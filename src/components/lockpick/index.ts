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

/**
 * Solves a lockpicking puzzle using BFS to find the shortest sequence of moves.
 * @param startingPositions - Current positions of all tumblers (1-based)
 * @param links - Links between tumblers that cause movement effects
 * @param numHoles - Number of holes per tumbler
 * @returns Solver result with move sequence or error message
 */
export function solveLock(
    startingPositions: number[],
    links: Array<{ from: number; to: number; reversed: boolean }>,
    numHoles: number
): SolverResult {
    const centerPos = Math.floor(numHoles / 2);
    const numTumblers = startingPositions.length;

    // Check if already solved
    if (startingPositions.every((pos) => pos === centerPos)) {
        return { solvable: true, moves: [] };
    }

    // BFS to find shortest path
    const queue: { positions: number[]; path: SolverMove[] }[] = [
        { positions: [...startingPositions], path: [] },
    ];

    const visited = new Set<string>();
    visited.add(startingPositions.join(","));

    const maxIterations = 100000; // Prevent infinite loops
    let iterations = 0;

    while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const { positions, path } = queue.shift()!;

        // Try moving each tumbler in each direction
        for (let i = 0; i < numTumblers; i++) {
            for (const direction of ["left", "right"] as const) {
                const newPos =
                    direction === "left"
                        ? positions[i] - 1
                        : positions[i] + 1;

                // Check if move is valid (within bounds)
                if (newPos < 1 || newPos > numHoles) continue;

                // Apply move and link effects
                const newPositions = [...positions];
                newPositions[i] = newPos;

                // Apply links triggered by this move
                for (const link of links) {
                    if (link.from === i) {
                        const linkedNewPos = link.reversed
                            ? newPositions[link.to] - 1
                            : newPositions[link.to] + 1;
                        if (linkedNewPos >= 1 && linkedNewPos <= numHoles) {
                            newPositions[link.to] = linkedNewPos;
                        }
                    }
                }

                // Check if solved
                if (newPositions.every((pos) => pos === centerPos)) {
                    return {
                        solvable: true,
                        moves: [
                            ...path,
                            {
                                tumblerIndex: i,
                                direction,
                                positionsAfter: newPositions,
                            },
                        ],
                    };
                }

                // Add to queue if not visited
                const stateKey = newPositions.join(",");
                if (!visited.has(stateKey)) {
                    visited.add(stateKey);
                    queue.push({
                        positions: newPositions,
                        path: [
                            ...path,
                            {
                                tumblerIndex: i,
                                direction,
                                positionsAfter: newPositions,
                            },
                        ],
                    });
                }
            }
        }
    }

    return {
        solvable: false,
        moves: [],
        message: "Could not find a solution within iteration limit",
    };
}
