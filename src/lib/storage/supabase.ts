import type { StorageAdapter, StorageItem } from './types';

/**
 * Supabase implementation of StorageAdapter
 * Requires @supabase/supabase-js package
 * 
 * TODO: Install @supabase/supabase-js and configure environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */
export class SupabaseAdapter<T extends StorageItem> implements StorageAdapter<T> {
	private tableName: string;

	constructor(tableName: string) {
		this.tableName = tableName;
	}

	async get(id: string): Promise<T | null> {
		// TODO: Implement Supabase get
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}

	async getAll(): Promise<T[]> {
		// TODO: Implement Supabase getAll
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}

	async create(item: T): Promise<T> {
		// TODO: Implement Supabase create
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}

	async update(id: string, updates: Partial<T>): Promise<T | null> {
		// TODO: Implement Supabase update
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}

	async delete(id: string): Promise<boolean> {
		// TODO: Implement Supabase delete
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}

	async search(query: string, fields?: (keyof T)[]): Promise<T[]> {
		// TODO: Implement Supabase search using full-text search or pgvector
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}

	async exists(id: string): Promise<boolean> {
		// TODO: Implement Supabase exists
		throw new Error('Supabase adapter not implemented. Install @supabase/supabase-js');
	}
}
