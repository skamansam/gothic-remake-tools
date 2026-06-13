<script lang="ts">
    import type { GothicLock, SolverMove, SolverResult } from "./index";
    import { getLock, updateLock, solveLock } from "./index";
    import { onMount } from "svelte";

    interface Props {
        lockId: string;
    }

    let { lockId }: Props = $props();
    let currentLock = $state<GothicLock | null>(null);

    // Current positions of tumblers during gameplay (0 = leftmost, 3 = center, 6 = rightmost)
    let tumblerPositions = $state<number[]>([]);

    // Link creation form state
    let linkFrom = $state<number | null>(null); // Source tumbler index (0-based)
    let linkTo = $state<number | null>(null); // Target tumbler index (0-based)
    let linkReversed = $state(false); // Whether link direction is reversed (opposite movement)

    // Solver state
    let solverResult = $state<SolverResult | null>(null);
    let currentStep = $state(0);
    let showSolver = $state(false);

    onMount(async () => {
        const lock = await getLock(lockId);
        if (lock) {
            currentLock = lock;
            tumblerPositions = [...lock.startingPositions];
        }
    });

    function updateCurrentLock() {
        if (!currentLock) return;

        currentLock.startingPositions = [...tumblerPositions];
        currentLock.links = [...(currentLock.links || [])];

        updateLock(currentLock.id, {
            startingPositions: currentLock.startingPositions,
            links: currentLock.links
        });
    }

    function resetTumblers() {
        if (currentLock) {
            tumblerPositions = [...currentLock.startingPositions];
            solverResult = null;
            currentStep = 0;
            showSolver = false;
        }
    }

    function canMoveTumbler(index: number, direction: "left" | "right"): boolean {
        if (!currentLock) return false;
        const currentPos = tumblerPositions[index];
        const maxPos = currentLock.numHoles;
        // Right button moves right (towards position 1), left button moves left (towards position 7)
        let newPos = direction === "right" ? currentPos - 1 : currentPos + 1;

        // Check if move is within bounds
        if (newPos < 1 || newPos > maxPos) return false;

        // Check if all linked tumblers can move (constraint: linked tumblers must move together)
        const tempPositions = [...tumblerPositions];
        tempPositions[index] = newPos;

        // Check all links where this tumbler is the source
        for (const link of currentLock.links || []) {
            if (link.from === index) {
                // If reversed, move in opposite direction; otherwise move in same direction
                const linkDirection = link.reversed 
                    ? (direction === "left" ? "right" : "left")
                    : direction;
                const linkedNewPos = linkDirection === "right" 
                    ? tempPositions[link.to] - 1 
                    : tempPositions[link.to] + 1;
                if (linkedNewPos < 1 || linkedNewPos > maxPos) {
                    return false;
                }
            }
        }

        return true;
    }

    function moveTumbler(index: number, direction: "left" | "right") {
        if (!currentLock) return;
        const currentPos = tumblerPositions[index];
        const maxPos = currentLock.numHoles; // 7 for 7 holes
        // Right button moves right (towards position 1), left button moves left (towards position 7)
        let newPos = direction === "right" ? currentPos - 1 : currentPos + 1;

        // Clamp to valid range (1 to numHoles)
        newPos = Math.max(1, Math.min(maxPos, newPos));

        if (newPos !== currentPos) {
            // Check if all linked tumblers can move (constraint: linked tumblers must move together)
            const tempPositions = [...tumblerPositions];
            tempPositions[index] = newPos;
            let allLinksCanMove = true;

            // Check all links where this tumbler is the source
            for (const link of currentLock.links || []) {
                if (link.from === index) {
                    const linkDirection = link.reversed
                        ? (direction === "left" ? "right" : "left")
                        : direction;
                    const linkedNewPos = linkDirection === "right"
                        ? tempPositions[link.to] - 1
                        : tempPositions[link.to] + 1;
                    if (linkedNewPos < 1 || linkedNewPos > maxPos) {
                        allLinksCanMove = false;
                        break;
                    }
                }
            }

            if (!allLinksCanMove) return; // Can't move if linked tumblers can't move

            tumblerPositions[index] = newPos;
            applyLinks(index, direction);
        }
    }

    function applyLinks(triggerIndex: number, direction: "left" | "right") {
        if (!currentLock) return;
        const maxPos = currentLock.numHoles; // 7 for 7 holes

        // Find all links that start from the moved tumbler
        const triggeredLinks = (currentLock.links || []).filter(
            (l) => l.from === triggerIndex,
        );

        for (const link of triggeredLinks) {
            const currentPos = tumblerPositions[link.to];
            // If reversed, move in opposite direction; otherwise move in same direction
            const linkDirection = link.reversed 
                ? (direction === "left" ? "right" : "left")
                : direction;
            let newPos = linkDirection === "right" ? currentPos - 1 : currentPos + 1;
            newPos = Math.max(1, Math.min(maxPos, newPos));

            if (newPos !== currentPos) {
                tumblerPositions[link.to] = newPos;
            }
        }
    }

    function addLink() {
        if (
            !currentLock ||
            linkFrom === null ||
            linkTo === null ||
            linkFrom === linkTo
        )
            return;

        // Check if link already exists
        const exists = (currentLock.links || []).some(
            (l) =>
                l.from === linkFrom &&
                l.to === linkTo &&
                l.reversed === linkReversed,
        );
        if (!exists) {
            currentLock.links = [
                ...(currentLock.links || []),
                { from: linkFrom, to: linkTo, reversed: linkReversed },
            ];
            updateCurrentLock();
        }
        // Reset selection
        linkFrom = null;
        linkTo = null;
        linkReversed = false;
    }

    function removeLink(index: number) {
        if (!currentLock) return;
        currentLock.links = (currentLock.links || []).filter(
            (_, i) => i !== index,
        );
        updateCurrentLock();
    }

    function runSolver() {
        if (!currentLock) return;
        solverResult = solveLock(
            tumblerPositions,
            currentLock.links || [],
            currentLock.numHoles
        );
        currentStep = 0;
        showSolver = true;
    }

    function applySolutionStep() {
        if (!solverResult || currentStep >= solverResult.moves.length) return;

        const move = solverResult.moves[currentStep];
        moveTumbler(move.tumblerIndex, move.direction);
        currentStep++;
    }

    function resetSolver() {
        solverResult = null;
        currentStep = 0;
        showSolver = false;
        resetTumblers();
    }
</script>

{#if !currentLock}
	<p class="text-text">Loading lock...</p>
{:else}
	<div
		class="card border border-border dark:border-border p-4 mb-6 bg-surface"
	>
		<h2 class="text-xl font-bold">{currentLock.name}</h2>
		<p class="text-text">{currentLock.location}</p>
		{#if currentLock.description}
			<p class="text-sm text-text mt-2">{currentLock.description}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Lock Visualization -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Lock Tumblers</h2>
			<div
				class="card border border-border dark:border-border p-6 mb-6"
			>
				<div class="flex flex-col gap-4">
					{#each Array(currentLock.numTumblers) as _, i}
						<!-- Display index reverses order so T1 appears at top -->
						{@const displayIndex =
							currentLock.numTumblers - 1 - i}
						<div class="flex items-center gap-2">
							<span class="font-mono font-bold w-8"
								>T{displayIndex + 1}</span
							>
							<!-- Bolt indicator on left -->
							<div
								class="w-4 h-8 bg-secondary border-2 border-border rounded-l"
							></div>
							<!-- Horizontal tumbler with holes (left to right) -->
							<!-- Center pin always at center of display (hole 3) -->
							<!-- Tumbler material shifts based on position value -->
							<div class="flex gap-1 items-center">
								{#each Array(currentLock.numHoles) as _, j}
									<!-- True if this is the center hole (hole 3 for 7 holes) -->
									{@const isCenterHole =
										j ===
										Math.floor(
											currentLock.numHoles / 2,
										)}
									<!-- Current position value (1-7) determining tumbler extent -->
									{@const centerPinPos =
										tumblerPositions[displayIndex]}
									<!-- Hole is filled if within tumbler material range -->
									<!-- Range is [4 - position, 10 - position] clamped to [0, 6] for 1-based positions -->
									{@const isVisible =
										j >=
											Math.max(0, 4 - centerPinPos) &&
										j <= Math.min(6, 10 - centerPinPos)}
									<div
										class="w-8 h-8 border-border hole hole-{j} {isVisible
											? 'bg-primary border-2'
											: 'bg-surface '} flex items-center justify-center"
									>
										{#if isCenterHole}
											<div
												class="w-2 h-2 {centerPinPos ===
												Math.ceil(
													currentLock.numHoles /
														2,
												)
													? 'bg-text'
													: 'bg-surface border border-border'} rounded-full"
											></div>
										{/if}
									</div>
								{/each}
							</div>
							<!-- Center dot (single per tumbler row) -->
							<div
								class="w-8 h-8 flex items-center justify-center"
							></div>
							<!-- Move arrows aligned to right -->
							<div class="flex gap-2 ml-auto">
								<button
									onclick={() =>
										moveTumbler(displayIndex, "left")}
									class="px-2 py-1 bg-secondary text-text border border-border text-xs"
									disabled={!canMoveTumbler(displayIndex, "left")}
								>
									←
								</button>
								<button
									onclick={() =>
										moveTumbler(displayIndex, "right")}
									class="px-2 py-1 bg-secondary text-text border border-border text-xs"
									disabled={!canMoveTumbler(displayIndex, "right")}
								>
									→
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex gap-4 mb-6">
				<button
					onclick={resetTumblers}
					class="px-4 py-2 bg-secondary text-text border border-border"
				>
					Reset Tumblers
				</button>
				<button
					onclick={updateCurrentLock}
					class="px-4 py-2 bg-primary text-text border border-primary"
				>
					Save Positions
				</button>
				<button
					onclick={runSolver}
					class="px-4 py-2 bg-success text-text border border-success"
				>
					Auto Solve
				</button>
			</div>

			<!-- Solver Results -->
			{#if showSolver && solverResult}
				<div
					class="card border border-border dark:border-border p-6 mb-6"
				>
					<h3 class="font-semibold mb-4">
						{solverResult.solvable
							? "Solution Found"
							: "No Solution"}
					</h3>
					{#if solverResult.solvable}
						<p class="text-sm text-text mb-4">
							{solverResult.moves.length} steps required
						</p>
						<div class="space-y-2 mb-4">
							{#each solverResult.moves as move, i}
								<div
									class="flex items-center justify-between p-2 {i === currentStep
										? 'bg-primary text-text'
										: i < currentStep
											? 'bg-success text-text'
											: 'bg-surface text-text'} border border-border"
								>
									<span class="font-mono">
										Step {i + 1}: Move T{move.tumblerIndex + 1}
										{move.direction === "left"
											? " right (→)"
											: " left (←)"}
									</span>
									<span class="text-xs">
										Positions: {[...move.positionsAfter].reverse().join(", ")}
									</span>
								</div>
							{/each}
						</div>
						<div class="flex gap-2">
							<button
								onclick={applySolutionStep}
								disabled={currentStep >=
									solverResult.moves.length}
								class="px-4 py-2 bg-primary text-text border border-primary disabled:opacity-50"
							>
								{currentStep >= solverResult.moves.length
									? "Complete"
									: "Apply Next Step"}
							</button>
							<button
								onclick={resetSolver}
								class="px-4 py-2 bg-secondary text-text border border-border"
							>
								Reset
							</button>
						</div>
					{:else}
						<p class="text-text">{solverResult.message}</p>
						<button
							onclick={resetSolver}
							class="mt-4 px-4 py-2 bg-secondary text-text border border-border"
						>
							Close
						</button>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Link Configuration -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Tumbler Links</h2>
			<div
				class="card border border-border dark:border-border p-6 mb-6"
			>
				<div class="space-y-4">
					<div>
						<label class="block mb-2 font-medium"
							>From Tumbler</label
						>
						<div class="flex gap-2 flex-wrap">
							{#each Array(currentLock.numTumblers) as _, i}
								<button
									class="px-3 py-1 border border-border {linkFrom ===
									i
										? 'bg-primary text-text'
										: 'bg-surface text-text'}"
									onclick={() => (linkFrom = i)}
								>
									T{i + 1}
								</button>
							{/each}
						</div>
					</div>

					<div>
						<label class="block mb-2 font-medium"
							>To Tumbler</label
						>
						<div class="flex gap-2 flex-wrap">
							{#each Array(currentLock.numTumblers) as _, i}
								<button
									class="px-3 py-1 border border-border {linkTo ===
									i
										? 'bg-primary text-text'
										: 'bg-surface text-text'}"
									onclick={() => (linkTo = i)}
								>
									T{i + 1}
								</button>
							{/each}
						</div>
					</div>

					<div>
						<label
							class="flex items-center gap-2 mb-2 font-medium"
							for="link-reversed"
						>
							<input
								type="checkbox"
								bind:checked={linkReversed}
								class="w-4 h-4"
								id="link-reversed"
							/>
							<span>Reversed Direction</span>
						</label>
						<p class="text-xs text-text">
							When checked, moving the source tumbler will
							move the target tumbler in the opposite
							direction.
						</p>
					</div>

					<button
						onclick={addLink}
						class="w-full px-4 py-2 bg-primary text-text border border-primary font-medium"
						disabled={linkFrom === null || linkTo === null}
					>
						Add Link
					</button>
				</div>
			</div>

			<!-- Links List -->
			{#if (currentLock.links || []).length > 0}
				<div
					class="card border border-border dark:border-border p-6"
				>
					<h3 class="font-semibold mb-4">Active Links</h3>
					<div class="space-y-2">
						{#each currentLock.links || [] as link, i}
							<div
								class="flex items-center justify-between p-2 bg-surface border border-border"
							>
								<span class="font-mono">
									T{link.from + 1} → T{link.to + 1}
									{link.reversed ? " (reversed)" : ""}
								</span>
								<button
									onclick={() => removeLink(i)}
									class="px-2 py-1 bg-error text-text border border-error text-sm"
								>
									Remove
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>
	</div>
{/if}
