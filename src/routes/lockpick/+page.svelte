<script lang="ts">
	import { onMount } from "svelte";
	import {
		LockpickList,
		LockpickSolver,
		NewLockpick,
	} from "../../components/lockpick/index";
	import type { GothicLock } from "../../components/lockpick/index";
	import { getLock } from "../../components/lockpick/index";

	// Default number of holes per tumbler (configurable per lock)
	const NUM_HOLES = 7;

	// Currently selected/active lock being displayed and manipulated
	let currentLock = $state<GothicLock | null>(null);

	// Warning message for lock not found
	let warningMessage = $state<string | null>(null);

	// UI modal visibility states
	let showCreateForm = $state(false); // Show/hide create lock modal

	onMount(async () => {
		// Check for lock ID from sessionStorage (set by /lockpick/[id] route)
		const selectedLockId = sessionStorage.getItem("selectedLockId");
		if (selectedLockId) {
			const lock = await getLock(selectedLockId);
			if (lock) {
				currentLock = lock;
			}
			sessionStorage.removeItem("selectedLockId");
		}

		// Check for warning message from sessionStorage (set by /lockpick/[id] route)
		const lockWarning = sessionStorage.getItem("lockWarning");
		if (lockWarning) {
			warningMessage = lockWarning;
			sessionStorage.removeItem("lockWarning");
		}
	});
</script>

<div class="p-8 max-w-6xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Lockpick Solver</h1>

	<!-- Warning message -->
	{#if warningMessage}
		<div
			class="mb-6 p-4 bg-danger/10 border border-danger text-danger rounded"
		>
			{warningMessage}
			<button
				onclick={() => (warningMessage = null)}
				class="ml-4 text-sm underline"
			>
				Dismiss
			</button>
		</div>
	{/if}

	<!-- Lock Management -->
	<div class="flex gap-4 mb-6">
		<button
			onclick={() => (showCreateForm = true)}
			class="px-4 py-2 bg-secondary text-text border border-border"
		>
			➕ New Lock
		</button>
	</div>

	<!-- Create Lock Modal -->
	{#if showCreateForm}
		<div
			class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		>
			<div
				class="card border border-border dark:border-border p-6 max-w-2xl w-full mx-4 bg-surface"
			>
				<NewLockpick onCreate={() => { showCreateForm = false; }} />
			</div>
		</div>
	{/if}
	<LockpickList />

</div>
