export type { StorageAdapter, StorageItem, SearchOptions } from './types';
export { LocalStorageAdapter } from './local-storage';
export { SupabaseAdapter } from './supabase';
export { FirebaseAdapter } from './firebase';
export { AlgoliaSearchAdapter } from './algolia';

/**
 * Slugify a text string to create URL-friendly IDs
 * Converts to lowercase, removes special characters, replaces spaces with hyphens
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
