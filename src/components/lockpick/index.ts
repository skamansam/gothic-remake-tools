export { default as LockpickList } from "./LockpickList.svelte";
export { default as LockpickSolver } from "./LockpickSolver.svelte";
export { default as NewLockpick } from "./NewLockpick.svelte";

import { LocalStorageAdapter, slugify } from '$lib/storage';
import locksData from '$lib/data/locks.json';

export const LOCKS_PREFIX = 'locks';

export interface GothicLock {
    id: string;
    name: string;
    description: string;
    location: string;
    numTumblers: number;
    numHoles: number;
    startingPositions: number[];
    links: Array<{ from: number; to: number; reversed: boolean }>;
}

// Create lock-specific storage adapter
// Disable slugifyIds since JSON data already has proper IDs
const lockStorage = new LocalStorageAdapter<GothicLock>(LOCKS_PREFIX, locksData as GothicLock[], false);

// Export the storage adapter instance for direct use
export { lockStorage };

// Helper functions for lock storage operations
export async function getAllLocks(): Promise<GothicLock[]> {
    return await lockStorage.getAll();
}

export async function getLock(lockId: string): Promise<GothicLock | null> {
    return await lockStorage.get(lockId);
}

export async function createLock(lock: GothicLock): Promise<GothicLock> {
    return await lockStorage.create(lock);
}

export async function updateLock(lockId: string, updates: Partial<GothicLock>): Promise<GothicLock | null> {
    return await lockStorage.update(lockId, updates);
}

export async function deleteLock(lockId: string): Promise<boolean> {
    return await lockStorage.delete(lockId);
}

export async function searchLocks(query: string, fields?: (keyof GothicLock)[]): Promise<GothicLock[]> {
    return await lockStorage.search(query, fields);
}

export async function lockExists(lockId: string): Promise<boolean> {
    return await lockStorage.exists(lockId);
}

export { slugify } from '$lib/storage';

export interface SolverMove {
    tumblerIndex: number;
    direction: "left" | "right";
    positionsAfter: number[];
}

export interface SolverResult {
    solvable: boolean;
    moves: SolverMove[];
    message?: string;
}

/** Available solver algorithms. */
export type SolverAlgorithm = "bfs" | "astar";

/**
 * Attempts to apply a single tumbler move and all triggered link movements.
 * Returns the resulting position array, or null if the move is out of bounds.
 * @param positions - Current tumbler positions
 * @param tumblerIndex - Index of the tumbler to move
 * @param direction - Direction to move ("left" increases position, "right" decreases)
 * @param links - Active links between tumblers
 * @param numHoles - Number of holes per tumbler
 */
function applyMove(
    positions: number[],
    tumblerIndex: number,
    direction: "left" | "right",
    links: Array<{ from: number; to: number; reversed: boolean }>,
    numHoles: number
): number[] | null {
    const newPos = direction === "right" ? positions[tumblerIndex] - 1 : positions[tumblerIndex] + 1;
    if (newPos < 1 || newPos > numHoles) return null;

    const np = [...positions];
    np[tumblerIndex] = newPos;

    for (const link of links) {
        if (link.from === tumblerIndex) {
            const linkDirection = link.reversed
                ? (direction === "left" ? "right" : "left")
                : direction;
            const linkedNewPos = linkDirection === "right" ? np[link.to] - 1 : np[link.to] + 1;
            if (linkedNewPos < 1 || linkedNewPos > numHoles) return null;
            np[link.to] = linkedNewPos;
        }
    }

    return np;
}

/** Binary min-heap keyed on `f` for A* open set. */
class MinHeap {
    private data: { positions: number[]; path: SolverMove[]; g: number; f: number }[] = [];

    get size(): number { return this.data.length; }

    push(item: { positions: number[]; path: SolverMove[]; g: number; f: number }): void {
        this.data.push(item);
        this._bubbleUp(this.data.length - 1);
    }

    pop(): { positions: number[]; path: SolverMove[]; g: number; f: number } | undefined {
        if (this.data.length === 0) return undefined;
        const top = this.data[0];
        const last = this.data.pop()!;
        if (this.data.length > 0) {
            this.data[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    private _bubbleUp(i: number): void {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[parent].f <= this.data[i].f) break;
            [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
            i = parent;
        }
    }

    private _sinkDown(i: number): void {
        const n = this.data.length;
        while (true) {
            let min = i;
            const l = 2 * i + 1;
            const r = 2 * i + 2;
            if (l < n && this.data[l].f < this.data[min].f) min = l;
            if (r < n && this.data[r].f < this.data[min].f) min = r;
            if (min === i) break;
            [this.data[min], this.data[i]] = [this.data[i], this.data[min]];
            i = min;
        }
    }
}

/**
 * Admissible heuristic for A*: sum of Manhattan distances of each tumbler to center.
 * Never overestimates since each tumbler needs at least |pos - center| individual moves.
 */
function heuristic(positions: number[], centerPos: number): number {
    return positions.reduce((sum, p) => sum + Math.abs(p - centerPos), 0);
}

/**
 * Solves a lockpicking puzzle using BFS (breadth-first search).
 * Guarantees the shortest solution. Best for locks with many dense links.
 * @param startingPositions - Current positions of all tumblers (1-based)
 * @param links - Links between tumblers that cause movement effects
 * @param numHoles - Number of holes per tumbler
 * @returns Solver result with move sequence or error message
 */
export function solveLockBFS(
    startingPositions: number[],
    links: Array<{ from: number; to: number; reversed: boolean }>,
    numHoles: number
): SolverResult {
    const centerPos = Math.ceil(numHoles / 2);
    const numTumblers = startingPositions.length;

    if (startingPositions.every((pos) => pos === centerPos)) {
        return { solvable: true, moves: [] };
    }

    const queue: { positions: number[]; path: SolverMove[] }[] = [
        { positions: [...startingPositions], path: [] },
    ];
    const visited = new Set<string>([startingPositions.join(",")]);
    const maxIterations = 500000;
    let iterations = 0;

    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const { positions, path } = queue.shift()!;

        for (let i = 0; i < numTumblers; i++) {
            for (const direction of ["left", "right"] as const) {
                const newPositions = applyMove(positions, i, direction, links, numHoles);
                if (!newPositions) continue;

                const move: SolverMove = { tumblerIndex: i, direction, positionsAfter: newPositions };

                if (newPositions.every((pos) => pos === centerPos)) {
                    return { solvable: true, moves: [...path, move] };
                }

                const stateKey = newPositions.join(",");
                if (!visited.has(stateKey)) {
                    visited.add(stateKey);
                    queue.push({ positions: newPositions, path: [...path, move] });
                }
            }
        }
    }

    return { solvable: false, moves: [], message: "Could not find a solution within iteration limit" };
}

/**
 * Solves a lockpicking puzzle using A* with an admissible Manhattan-distance heuristic.
 * Explores far fewer states than BFS for most locks; still guarantees the shortest solution.
 * Best for locks with few links or large tumbler counts (sparse constraint graphs).
 * @param startingPositions - Current positions of all tumblers (1-based)
 * @param links - Links between tumblers that cause movement effects
 * @param numHoles - Number of holes per tumbler
 * @returns Solver result with move sequence or error message
 */
export function solveLockAStar(
    startingPositions: number[],
    links: Array<{ from: number; to: number; reversed: boolean }>,
    numHoles: number
): SolverResult {
    const centerPos = Math.ceil(numHoles / 2);
    const numTumblers = startingPositions.length;

    if (startingPositions.every((pos) => pos === centerPos)) {
        return { solvable: true, moves: [] };
    }

    const open = new MinHeap();
    open.push({
        positions: [...startingPositions],
        path: [],
        g: 0,
        f: heuristic(startingPositions, centerPos),
    });
    const visited = new Set<string>([startingPositions.join(",")]);
    const maxIterations = 500000;
    let iterations = 0;

    while (open.size > 0 && iterations < maxIterations) {
        iterations++;
        const { positions, path, g } = open.pop()!;

        for (let i = 0; i < numTumblers; i++) {
            for (const direction of ["left", "right"] as const) {
                const newPositions = applyMove(positions, i, direction, links, numHoles);
                if (!newPositions) continue;

                const move: SolverMove = { tumblerIndex: i, direction, positionsAfter: newPositions };

                if (newPositions.every((pos) => pos === centerPos)) {
                    return { solvable: true, moves: [...path, move] };
                }

                const stateKey = newPositions.join(",");
                if (!visited.has(stateKey)) {
                    visited.add(stateKey);
                    const ng = g + 1;
                    open.push({
                        positions: newPositions,
                        path: [...path, move],
                        g: ng,
                        f: ng + heuristic(newPositions, centerPos),
                    });
                }
            }
        }
    }

    return { solvable: false, moves: [], message: "Could not find a solution within iteration limit" };
}

/**
 * Dispatches to the selected algorithm. Defaults to A* which is faster for most locks.
 * @param startingPositions - Current positions of all tumblers (1-based)
 * @param links - Links between tumblers that cause movement effects
 * @param numHoles - Number of holes per tumbler
 * @param algorithm - Which algorithm to use ("astar" | "bfs")
 */
export function solveLock(
    startingPositions: number[],
    links: Array<{ from: number; to: number; reversed: boolean }>,
    numHoles: number,
    algorithm: SolverAlgorithm = "astar"
): SolverResult {
    if (algorithm === "bfs") return solveLockBFS(startingPositions, links, numHoles);
    return solveLockAStar(startingPositions, links, numHoles);
}
