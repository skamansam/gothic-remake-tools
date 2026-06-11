export { default as LockpickList } from "./LockpickList.svelte";
export { default as LockpickSolver } from "./LockpickSolver.svelte";
export { default as NewLockpick } from "./NewLockpick.svelte";

import { LocalStorageAdapter } from '$lib/storage';
import locksData from '$lib/data/locks.json';

export const LOCKS_PREFIX = 'locks';
export const LOCKS_STORAGE_KEY = LOCKS_PREFIX; // Legacy alias for compatibility

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

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

// Create storage adapter with initial data from JSON file
const lockStorage = new LocalStorageAdapter<GothicLock>(LOCKS_PREFIX, locksData as GothicLock[]);

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

export { slugify };
