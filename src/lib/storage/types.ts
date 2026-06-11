/**
 * Generic storage interface for CRUD operations and search
 * Supports multiple backends: localStorage, Supabase, Firebase, etc.
 */
export interface StorageAdapter<T> {
	/**
	 * Get a single item by ID
	 */
	get(id: string): Promise<T | null>;

	/**
	 * Get all items
	 */
	getAll(): Promise<T[]>;

	/**
	 * Create a new item
	 */
	create(item: T): Promise<T>;

	/**
	 * Update an existing item
	 */
	update(id: string, item: Partial<T>): Promise<T | null>;

	/**
	 * Delete an item by ID
	 */
	delete(id: string): Promise<boolean>;

	/**
	 * Search items by query
	 */
	search(query: string, fields?: (keyof T)[]): Promise<T[]>;

	/**
	 * Check if an item exists
	 */
	exists(id: string): Promise<boolean>;
}

/**
 * Search options for advanced filtering
 */
export interface SearchOptions {
	query: string;
	fields?: string[];
	limit?: number;
	offset?: number;
}

/**
 * Generic item with ID
 */
export interface StorageItem {
	id: string;
}
