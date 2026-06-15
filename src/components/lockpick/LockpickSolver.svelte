<script lang="ts">
    import type { GothicLock, SolverMove, SolverResult, SolverAlgorithm } from "./index";
    import { getLock, updateLock, solveLock } from "./index";
    import NewLockpick from "./NewLockpick.svelte";
    import { onMount } from "svelte";

    interface Props {
        lockId: string;
    }

    let { lockId }: Props = $props();
    let currentLock = $state<GothicLock | null>(null);

    // Current positions of tumblers during gameplay (0 = leftmost, 3 = center, 6 = rightmost)
    let tumblerPositions = $state<number[]>([]);

    // Edit dialog state
    let showEditDialog = $state(false);

    // Solver state
    let solverResult = $state<SolverResult | null>(null);
    let currentStep = $state(0);
    let showSolver = $state(false);
    let solverAlgorithm = $state<SolverAlgorithm>("astar");

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
        const centerPos = Math.ceil(currentLock.numHoles / 2);
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
                if (linkedNewPos < 1 || linkedNewPos > maxPos) return false;
                // Linked tumblers cannot be moved past the center position
                if ((tumblerPositions[link.to] <= centerPos && linkedNewPos > centerPos) ||
                    (tumblerPositions[link.to] >= centerPos && linkedNewPos < centerPos)) return false;
            }
        }

        return true;
    }

    function moveTumbler(index: number, direction: "left" | "right") {
        if (!currentLock) return;
        const currentPos = tumblerPositions[index];
        const maxPos = currentLock.numHoles; // 7 for 7 holes
        const centerPos = Math.ceil(currentLock.numHoles / 2);
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
                    // Linked tumblers cannot be moved past the center position
                    if ((tumblerPositions[link.to] <= centerPos && linkedNewPos > centerPos) ||
                        (tumblerPositions[link.to] >= centerPos && linkedNewPos < centerPos)) {
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

    async function handleEditSave() {
        const updated = await getLock(lockId);
        if (updated) {
            currentLock = updated;
            tumblerPositions = [...updated.startingPositions];
        }
        showEditDialog = false;
        solverResult = null;
        currentStep = 0;
        showSolver = false;
    }

    function runSolver() {
        if (!currentLock) return;
        solverResult = solveLock(
            tumblerPositions,
            currentLock.links || [],
            currentLock.numHoles,
            solverAlgorithm
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
		<div class="flex items-start justify-between gap-4">
			<div>
				<h2 class="text-xl font-bold">{currentLock.name}</h2>
				<p class="text-text">{currentLock.location}</p>
				{#if currentLock.description}
					<p class="text-sm text-text mt-2">{currentLock.description}</p>
				{/if}
			</div>
			<button
				onclick={() => (showEditDialog = true)}
				class="shrink-0 px-3 py-1 bg-secondary text-text border border-border text-sm"
			>
				✏️ Edit Lock
			</button>
		</div>
	</div>

	<!-- Edit Lock Dialog -->
	{#if showEditDialog}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="card border border-border p-6 max-w-2xl w-full mx-4 bg-surface">
				<NewLockpick
					lock={currentLock}
					onCreate={handleEditSave}
					onCancel={() => (showEditDialog = false)}
				/>
			</div>
		</div>
	{/if}

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

			<div class="flex gap-4 mb-6 flex-wrap">
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
				<div class="flex items-center border border-border overflow-hidden">
					<button
						onclick={runSolver}
						class="px-4 py-2 bg-success text-text border-r border-border"
					>
						Auto Solve
					</button>
					<button
						onclick={() => solverAlgorithm = solverAlgorithm === 'astar' ? 'bfs' : 'astar'}
						class="px-3 py-2 bg-surface text-text text-xs font-mono"
						title={solverAlgorithm === 'astar' ? 'Using A* (faster). Click to switch to BFS.' : 'Using BFS (exhaustive). Click to switch to A*.'}
						aria-label="Toggle solver algorithm"
					>
						{solverAlgorithm === 'astar' ? 'A*' : 'BFS'}
					</button>
				</div>
			</div>
		</section>

		<!-- Solver Results -->
		<section>
			{#if showSolver && solverResult}
				<div
					class="card border border-border dark:border-border p-6 mb-6"
				>
					<h3 class="font-semibold mb-4">
						{solverResult.solvable
							? "Solution Found"
							: "No Solution"}
						<span class="text-xs font-mono font-normal opacity-60 ml-2">
							({solverAlgorithm === 'astar' ? 'A*' : 'BFS'})
						</span>
					</h3>
					{#if solverResult.solvable}
						<p class="text-sm text-text mb-4">
							{solverResult.moves.length} steps required
						</p>
						<div class="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
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
											? " left (←)"
											: " right (→)"}
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

	</div>
{/if}
