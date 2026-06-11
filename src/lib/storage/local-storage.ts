import type { StorageAdapter, StorageItem } from './types';
import { slugify } from './index';

/**
 * LocalStorage implementation of StorageAdapter
 * Stores data as JSON strings in browser localStorage
 */
export class LocalStorageAdapter<T extends StorageItem> implements StorageAdapter<T> {
	private prefix: string;
	private initialData?: T[];
	private initialized = false;
	private slugifyIds: boolean;

	constructor(prefix: string, initialData?: T[], slugifyIds = true) {
		this.prefix = prefix;
		this.initialData = initialData;
		this.slugifyIds = slugifyIds;
	}

	private initialize(): void {
		if (this.initialized) return;
		if (typeof window === 'undefined') return;
		
		// Load initial data if storage is empty
		if (this.initialData && !localStorage.getItem(this.prefix)) {
			this.initialData.forEach((item) => {
				localStorage.setItem(`${this.prefix}/${item.id}`, JSON.stringify(item));
			});
		}
		this.initialized = true;
	}

	private getKey(id: string): string {
		return `${this.prefix}/${id}`;
	}

	async get(id: string): Promise<T | null> {
		this.initialize();
		if (typeof window === 'undefined') return null;
		
		const data = localStorage.getItem(this.getKey(id));
		if (!data) return null;
		return JSON.parse(data) as T;
	}

	async getAll(): Promise<T[]> {
		this.initialize();
		if (typeof window === 'undefined') return [];
		
		const keys = Object.keys(localStorage).filter((key) => key.startsWith(`${this.prefix}/`));
		const items = keys
			.map((key) => {
				const data = localStorage.getItem(key);
				return data ? (JSON.parse(data) as T) : null;
			})
			.filter((item): item is T => item !== null);
		return items;
	}

	async create(item: T): Promise<T> {
		this.initialize();
		if (typeof window === 'undefined') return item;
		
		// Slugify the ID if enabled
		const itemId = this.slugifyIds ? slugify(item.id) : item.id;
		const itemWithSlugifiedId = { ...item, id: itemId } as T;
		
		localStorage.setItem(this.getKey(itemId), JSON.stringify(itemWithSlugifiedId));
		return itemWithSlugifiedId;
	}

	async update(id: string, updates: Partial<T>): Promise<T | null> {
		this.initialize();
		if (typeof window === 'undefined') return null;
		
		const existing = await this.get(id);
		if (!existing) return null;
		const updated = { ...existing, ...updates };
		localStorage.setItem(this.getKey(id), JSON.stringify(updated));
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		this.initialize();
		if (typeof window === 'undefined') return false;
		
		const exists = await this.exists(id);
		if (!exists) return false;
		localStorage.removeItem(this.getKey(id));
		return true;
	}

	async search(query: string, fields?: (keyof T)[]): Promise<T[]> {
		this.initialize();
		if (typeof window === 'undefined') return [];
		
		const all = await this.getAll();
		const lowerQuery = query.toLowerCase();

		return all.filter((item) => {
			if (!fields || fields.length === 0) {
				// Search all string fields
				return Object.values(item).some(
					(value) => typeof value === 'string' && value.toLowerCase().includes(lowerQuery)
				);
			}

			// Search only specified fields
			return fields.some((field) => {
				const value = item[field];
				return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
			});
		});
	}

	async exists(id: string): Promise<boolean> {
		this.initialize();
		if (typeof window === 'undefined') return false;
		
		return localStorage.getItem(this.getKey(id)) !== null;
	}
}
