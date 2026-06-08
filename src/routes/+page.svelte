<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	interface Lock {
		id: string;
		name: string;
		description: string;
		location: string;
		numTumblers: number;
		numHoles: number;
		startingPositions: number[];
		links: Array<{ from: number; to: number; reversed: boolean }>;
	}

	const STORAGE_KEY = "gothic-remake-tools-locks";
	import defaultLocksUntyped from "$lib/data/locks.json";
	const defaultLocks = defaultLocksUntyped as Lock[];

	let locks = $state<Lock[]>([]);

	onMount(() => {
		loadLocks();
	});

	function loadLocks() {
		if (typeof window === "undefined") return;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const userLocks = JSON.parse(stored) as Lock[];
				const userLockIds = new Set(userLocks.map((l) => l.id));
				const mergedLocks = [
					...defaultLocks.filter((l) => !userLockIds.has(l.id)),
					...userLocks,
				];
				locks = mergedLocks;
			} else {
				locks = [...defaultLocks];
			}
		} catch {
			locks = [...defaultLocks];
		}
	}

	function selectLock(lockId: string) {
		goto(`/lockpick/${lockId}`);
	}
</script>

<div class="p-8 max-w-6xl mx-auto">
	<h1 class="text-3xl font-bold mb-4">Gothic 1 Remake Tools</h1>
	<p class="text-lg mb-6">
		Welcome to the Gothic 1 Remake tools website. More tools coming soon!
	</p>

	<h2 class="text-2xl font-semibold mb-4">Lockpick Solver</h2>
	<p class="mb-6">Select a lock to solve:</p>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each locks as lock}
			<button
				onclick={() => selectLock(lock.id)}
				class="card border border-border dark:border-border p-4 text-left hover:border-primary transition-colors"
			>
				<h3 class="font-semibold text-lg mb-1">{lock.name}</h3>
				<p class="text-sm text-muted mb-2">{lock.description}</p>
				<p class="text-xs text-muted">{lock.location}</p>
				<p class="text-xs text-muted mt-2">
					{lock.numTumblers} tumblers
				</p>
			</button>
		{/each}
	</div>

	<div class="mt-8">
		<a
			href="/lockpick"
			class="text-primary underline hover:text-primary/80"
		>
			Or create a new lock →
		</a>
	</div>
</div>
