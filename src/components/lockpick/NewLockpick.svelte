<script lang="ts">
    import { untrack } from "svelte";
    import type { GothicLock } from "./index";
    import { createLock as createLockStorage, updateLock, slugify } from "./index";
    import { Icon } from "twintrinsic";

    interface Props {
        /** If provided, the dialog operates in edit mode pre-populated with this lock's data. */
        lock?: GothicLock;
        /** Called after a successful create or update. */
        onCreate?: () => void;
        /** Called when the user cancels without saving. */
        onCancel?: () => void;
    }

    let { lock, onCreate, onCancel }: Props = $props();

    const isEditMode = $derived(!!lock);

    let lockName = $state(untrack(() => lock?.name ?? ""));
    let lockDescription = $state(untrack(() => lock?.description ?? ""));
    let lockLocation = $state(untrack(() => lock?.location ?? ""));
    let numTumblers = $state(untrack(() => lock?.numTumblers ?? 6));
    let numHoles = $state(untrack(() => lock?.numHoles ?? 7));
    let startingPositionsInput = $state(
        untrack(() => lock?.startingPositions?.join(",") ?? "1,1,1,1,1,1")
    );

    let links = $state<Array<{ from: number; to: number; reversed: boolean }>>(
        untrack(() => (lock?.links ? [...lock.links] : []))
    );
    $effect(() => {
        const n = numTumblers; // only track numTumblers, not links
        untrack(() => {
            links = links.filter((l) => l.from < n && l.to < n);
        });
    });

    /** Returns the link state for a given from→to pair. */
    function getLinkState(from: number, to: number): 'none' | 'forward' | 'reversed' {
        const link = links.find((l) => l.from === from && l.to === to);
        if (!link) return 'none';
        return link.reversed ? 'reversed' : 'forward';
    }

    /** Cycles link state: none → forward → reversed → none. */
    function toggleLink(from: number, to: number) {
        if (from === to) return;
        const state = getLinkState(from, to);
        if (state === 'none') {
            links = [...links, { from, to, reversed: false }];
        } else if (state === 'forward') {
            links = links.map((l) => (l.from === from && l.to === to ? { ...l, reversed: true } : l));
        } else {
            links = links.filter((l) => !(l.from === from && l.to === to));
        }
    }

    // JSON export/import panel state
    let showJsonPanel = $state(false);
    let importJsonText = $state("");
    let importError = $state<string | null>(null);
    let copySuccess = $state(false);

    /** Live JSON representation of the current form state. */
    const exportJson = $derived.by(() => {
        const center = Math.ceil(numHoles / 2);
        const positions = startingPositionsInput
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && n >= 1 && n <= numHoles);
        while (positions.length < numTumblers) positions.push(center);
        positions.length = numTumblers;
        return JSON.stringify(
            {
                id: untrack(() => lock?.id) ?? slugify(lockName || "new-lock"),
                name: lockName,
                description: lockDescription,
                location: lockLocation,
                numTumblers,
                numHoles,
                startingPositions: positions,
                links: [...links],
            },
            null,
            2
        );
    });

    function copyJson() {
        navigator.clipboard.writeText(exportJson).then(() => {
            copySuccess = true;
            setTimeout(() => (copySuccess = false), 2000);
        });
    }

    function importJson() {
        importError = null;
        try {
            const parsed = JSON.parse(importJsonText) as Partial<GothicLock>;
            if (typeof parsed.name === "string") lockName = parsed.name;
            if (typeof parsed.description === "string") lockDescription = parsed.description;
            if (typeof parsed.location === "string") lockLocation = parsed.location;
            if (typeof parsed.numTumblers === "number") numTumblers = parsed.numTumblers;
            if (typeof parsed.numHoles === "number") numHoles = parsed.numHoles;
            if (Array.isArray(parsed.startingPositions)) {
                startingPositionsInput = parsed.startingPositions.join(",");
            }
            if (Array.isArray(parsed.links)) {
                links = parsed.links.filter(
                    (l) => typeof l.from === "number" && typeof l.to === "number"
                );
            }
            importJsonText = "";
        } catch (e) {
            importError = "Invalid JSON: " + (e as Error).message;
        }
    }

    async function handleSave() {
        if (!lockName.trim()) return;

        const center = Math.ceil(numHoles / 2);
        const parsedPositions = startingPositionsInput
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && n >= 1 && n <= numHoles);

        while (parsedPositions.length < numTumblers) parsedPositions.push(center);
        parsedPositions.length = numTumblers;

        if (isEditMode && lock) {
            await updateLock(lock.id, {
                name: lockName,
                description: lockDescription,
                location: lockLocation,
                numTumblers,
                numHoles,
                startingPositions: parsedPositions,
                links: [...links],
            });
        } else {
            await createLockStorage({
                id: slugify(lockName),
                name: lockName,
                description: lockDescription,
                location: lockLocation,
                numTumblers,
                numHoles,
                startingPositions: parsedPositions,
                links: [...links],
            });
        }
        onCreate?.();
    }
</script>

<div class="new-lock-form max-h-[80vh] overflow-y-auto">
    <h2 class="text-2xl font-bold mb-4">
        {isEditMode ? "Edit Lock" : "Create New Lock"}
    </h2>
    <div class="space-y-4">

        <!-- Metadata -->
        <div>
            <label for="nl-name" class="block mb-2 font-medium">Lock Name</label>
            <input
                id="nl-name"
                type="text"
                bind:value={lockName}
                placeholder="e.g., Old Camp Gate"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
        </div>
        <div>
            <label for="nl-description" class="block mb-2 font-medium">Description</label>
            <textarea
                id="nl-description"
                bind:value={lockDescription}
                placeholder="Optional description..."
                class="w-full px-3 py-2 border border-border bg-background text-text"
                rows="2"
            ></textarea>
        </div>
        <div>
            <label for="nl-location" class="block mb-2 font-medium">Location</label>
            <input
                id="nl-location"
                type="text"
                bind:value={lockLocation}
                placeholder="e.g., Old Camp, near Diego"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
        </div>

        <!-- Tumbler config -->
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="nl-num-tumblers" class="block mb-2 font-medium">Number of Tumblers</label>
                <input
                    id="nl-num-tumblers"
                    type="number"
                    bind:value={numTumblers}
                    min="1"
                    max="10"
                    class="w-full px-3 py-2 border border-border bg-background text-text"
                />
            </div>
            <div>
                <label for="nl-num-holes" class="block mb-2 font-medium">Holes per Tumbler</label>
                <input
                    id="nl-num-holes"
                    type="number"
                    bind:value={numHoles}
                    min="3"
                    max="15"
                    class="w-full px-3 py-2 border border-border bg-background text-text"
                />
            </div>
        </div>
        <div>
            <label for="nl-starting-positions" class="block mb-2 font-medium">
                Starting Positions (comma-separated, 1–{numHoles})
            </label>
            <input
                id="nl-starting-positions"
                type="text"
                bind:value={startingPositionsInput}
                placeholder="e.g., 1,1,1,1,1,1"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
            <p class="text-xs text-text mt-1">
                Enter {numTumblers} values (1 = leftmost, {numHoles} = rightmost,
                {Math.ceil(numHoles / 2)} = center/goal)
            </p>
        </div>

        <!-- Link editing -->
        <div class="border border-border p-4 space-y-3">
            <h3 class="font-semibold">Tumbler Links</h3>
            <p class="text-xs opacity-60">Rows = from, Columns = to. Click to cycle link from none → forward → reversed</p>
            <div class="overflow-auto">
                <div
                    class="grid gap-1 w-fit"
                    style="grid-template-columns: 2rem {Array(numTumblers).fill('2rem').join(' ')}"
                >
                    <!-- Corner + column headers -->
                    <div></div>
                    {#each Array(numTumblers) as _, col}
                        <div class="w-8 h-8 flex items-center justify-center text-xs font-mono font-bold opacity-60">
                            T{col + 1}
                        </div>
                    {/each}

                    <!-- Data rows (reversed so T1 is at bottom-left) -->
                    {#each Array(numTumblers) as _, i}
                        {@const row = numTumblers - 1 - i}
                        <div class="w-8 h-8 flex items-center justify-center text-xs font-mono font-bold opacity-60">
                            T{row + 1}
                        </div>
                        {#each Array(numTumblers) as _, col}
                            {#if row === col}
                                <div
                                    class="w-8 h-8 border border-border bg-surface flex items-center justify-center text-xs opacity-20"
                                    aria-hidden="true"
                                >✕</div>
                            {:else}
                                {@const state = getLinkState(row, col)}
                                <button
                                    type="button"
                                    onclick={() => toggleLink(row, col)}
                                    class="w-8 h-8 border flex items-center justify-center text-sm font-bold
                                        {state === 'none'
                                            ? 'bg-surface border-border text-text opacity-30'
                                            : state === 'forward'
                                                ? 'bg-primary border-primary text-text'
                                                : 'bg-[#3b82f6] border-[#3b82f6] text-white'}"
                                    aria-label="T{row + 1} to T{col + 1}: {state === 'none' ? 'no link' : state === 'forward' ? 'forward' : 'reversed'}. Click to cycle."
                                    title="T{row + 1} → T{col + 1}: {state}"
                                >
                                {#if state === 'none'}
                                    <Icon name="slash" />
                                {:else if state === 'forward'}
                                    <Icon name="arrows-right" />
                                {:else}
                                    <Icon name="arrows-left-right" />
                                {/if}
                                </button>
                            {/if}
                        {/each}
                    {/each}
                </div>
            </div>
            <!-- Legend -->
            <div class="flex gap-4 text-xs">
                <span class="flex items-center gap-1 opacity-50">
                    <span class="inline-flex w-5 h-5 items-center justify-center border border-border bg-surface font-mono">
                        <Icon name="slash" />
                    </span>
                    none
                </span>
                <span class="flex items-center gap-1">
                    <span class="inline-flex w-5 h-5 items-center justify-center bg-primary border-primary text-text font-bold"> <Icon name="arrows-right" /></span>
                    forward
                </span>
                <span class="flex items-center gap-1">
                    <span class="inline-flex w-5 h-5 items-center justify-center bg-[#3b82f6] border-[#3b82f6] text-white font-bold"> <Icon name="arrows-left-right" /></span>
                    reversed
                </span>
            </div>
        </div>

        <!-- Export / Import JSON -->
        <div class="border border-border">
            <button
                type="button"
                onclick={() => (showJsonPanel = !showJsonPanel)}
                class="w-full px-4 py-2 text-left bg-surface text-sm font-medium flex justify-between items-center"
                aria-expanded={showJsonPanel}
            >
                <span>Export / Import JSON</span>
                <span aria-hidden="true">{showJsonPanel ? "▲" : "▼"}</span>
            </button>

            {#if showJsonPanel}
                <div class="p-4 space-y-4 border-t border-border">
                    <!-- Export -->
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <p class="text-sm font-medium">Current Lock JSON</p>
                            <button
                                type="button"
                                onclick={copyJson}
                                class="px-2 py-0.5 bg-secondary text-text border border-border text-xs"
                            >
                                {copySuccess ? "✓ Copied!" : "Copy"}
                            </button>
                        </div>
                        <textarea
                            readonly
                            value={exportJson}
                            rows="10"
                            class="w-full px-3 py-2 border border-border bg-background text-text font-mono text-xs"
                            aria-label="Lock JSON export"
                        ></textarea>
                    </div>

                    <!-- Import -->
                    <div>
                        <p class="text-sm font-medium mb-1">Import from JSON</p>
                        <textarea
                            id="nl-import-json"
                            bind:value={importJsonText}
                            placeholder="Paste a lock JSON object here to populate the form…"
                            rows="5"
                            class="w-full px-3 py-2 border border-border bg-background text-text font-mono text-xs"
                        ></textarea>
                        {#if importError}
                            <p class="text-xs text-error mt-1" role="alert">{importError}</p>
                        {/if}
                        <button
                            type="button"
                            onclick={importJson}
                            disabled={!importJsonText.trim()}
                            class="mt-2 px-3 py-1 bg-secondary text-text border border-border text-sm disabled:opacity-50"
                        >
                            Import
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-2">
            <button
                type="button"
                onclick={handleSave}
                class="px-4 py-2 bg-primary text-text border border-primary"
                disabled={!lockName.trim()}
            >
                {isEditMode ? "Save Changes" : "Create Lock"}
            </button>
            <button
                type="button"
                onclick={onCancel}
                class="px-4 py-2 bg-secondary text-text border border-border"
            >
                Cancel
            </button>
        </div>
    </div>
</div>
