<script lang="ts">
    import type { GothicLock } from "./index";
    import { createLock as createLockStorage, slugify } from "./index";

	// Lock creation form input fields
	let lockName = $state(""); // Name of new lock being created
	let lockDescription = $state(""); // Optional description for new lock
	let lockLocation = $state(""); // In-game location of the lock
	let numTumblers = $state(6); // Number of tumblers for new lock (1-10)
	let startingPositionsInput = $state("0,0,0,0,0,0"); // Comma-separated string input for starting positions
	let startingPositions = $state<number[]>([]); // Parsed array of starting positions

    // Default number of holes per tumbler (configurable per lock)
	const NUM_HOLES = 7;

    // Callback to notify parent component
    let { onCreate }: { onCreate?: () => void } = $props();

    async function createLock() {
        if (!lockName.trim()) return;

        // Parse starting positions from input
        const parsedPositions = startingPositionsInput
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && n >= 0 && n < NUM_HOLES);

        // Ensure we have the right number of positions
        while (parsedPositions.length < numTumblers) {
            parsedPositions.push(0);
        }
        if (parsedPositions.length > numTumblers) {
            parsedPositions.length = numTumblers;
        }

        const newLock: GothicLock = {
            id: slugify(lockName),
            name: lockName,
            description: lockDescription,
            location: lockLocation,
            numTumblers,
            numHoles: NUM_HOLES,
            startingPositions: parsedPositions,
            links: [],
        };

        await createLockStorage(newLock);
        resetForm();
        onCreate?.();
    }

    function resetForm() {
        lockName = "";
        lockDescription = "";
        lockLocation = "";
        numTumblers = 6;
        startingPositionsInput = "0,0,0,0,0,0";
        startingPositions = Array(6).fill(0);
    }
</script>

<div class="new-lock-form">
    <h2 class="text-2xl font-bold mb-4">Create New Lock</h2>
    <div class="space-y-4">
        <div>
            <label class="block mb-2 font-medium">Lock Name</label>
            <input
                type="text"
                bind:value={lockName}
                placeholder="e.g., Old Camp Gate"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
        </div>
        <div>
            <label class="block mb-2 font-medium">Description</label>
            <textarea
                bind:value={lockDescription}
                placeholder="Optional description..."
                class="w-full px-3 py-2 border border-border bg-background text-text"
                rows="3"
            ></textarea>
        </div>
        <div>
            <label class="block mb-2 font-medium">Location</label>
            <input
                type="text"
                bind:value={lockLocation}
                placeholder="e.g., Old Camp, near Diego"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
        </div>
        <div>
            <label class="block mb-2 font-medium">Number of Tumblers</label>
            <input
                type="number"
                bind:value={numTumblers}
                min="1"
                max="10"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
        </div>
        <div>
            <label class="block mb-2 font-medium"
                >Starting Positions (comma-separated, 0-6)</label
            >
            <input
                type="text"
                bind:value={startingPositionsInput}
                placeholder="e.g., 0,0,0,0,0,0"
                class="w-full px-3 py-2 border border-border bg-background text-text"
            />
            <p class="text-xs text-text mt-1">
                Enter {numTumblers} values separated by commas (0-6)
            </p>
        </div>
        <div class="flex gap-4">
            <button
                onclick={createLock}
                class="px-4 py-2 bg-primary text-text border border-primary"
                disabled={!lockName.trim()}
            >
                Create Lock
            </button>
            <button
                onclick={() => {
                    resetForm();
                }}
                class="px-4 py-2 bg-secondary text-text border border-border"
            >
                Cancel
            </button>
        </div>
    </div>
</div>
