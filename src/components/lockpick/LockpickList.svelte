<script lang="ts">
    import type { GothicLock } from "./index";
    import { getAllLocks, deleteLock as deleteLockFromStorage } from "./index";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    // All locks
    let locks = $state<GothicLock[]>([]);

    async function loadLocks() {
        locks = await getAllLocks();
    }

    function goToLock(id: string) {
        goto(`/lockpick/${id}`);
    }

    async function deleteLock(id: string) {
        await deleteLockFromStorage(id);
        await loadLocks();
    }

    onMount(() => {
        loadLocks();
    });
</script>

{#if locks.length === 0}
    <p class="text-text mb-4">No locks saved yet.</p>
{:else}
    <div class="space-y-2 max-h-96 overflow-y-auto mb-4">
        {#each locks as lock}
            <div
                class="flex items-center justify-between p-3 bg-surface border border-border"
            >
                <div>
                    <h3 class="font-bold">{lock.name}</h3>
                    <p class="text-sm text-text">
                        {lock.location}
                    </p>
                    <p class="text-xs text-text">
                        {lock.numTumblers} tumblers
                    </p>
                </div>
                <div class="flex gap-2">
                    <button
                        onclick={() => goToLock(lock.id)}
                        class="px-3 py-1 bg-primary text-text border border-primary text-sm"
                    >
                        Load
                    </button>
                    <button
                        onclick={() => deleteLock(lock.id)}
                        class="px-3 py-1 bg-error text-text border border-error text-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        {/each}
    </div>
{/if}
