<script lang="ts">
    import type { GothicLock } from "./index";
    
    interface Props {
        lockId: GothicLock;
    }
    let currentLock: GothicLock | null = null;

    let { lockId }: Props = $props();
	// Link creation form state
	let linkFrom = $state<number | null>(null); // Source tumbler index (0-based)
	let linkTo = $state<number | null>(null); // Target tumbler index (0-based)
	let linkReversed = $state(false); // Whether link direction is reversed (opposite movement)

    function loadLock(lockId: string) {
		// Load user locks from localStorage
		const userLocksJson = localStorage.getItem(STORAGE_KEY);
		const userLocks: GothicLock[] = userLocksJson
			? JSON.parse(userLocksJson)
			: [];

		// Check user locks first (they take precedence)
		let lock = userLocks.find((l) => l.id === lockId);

		// If not found in user locks, check built-in locks
		if (!lock) {
			// lock = defaultLocks.find((l) => l.id === lockId);
		}

		if (lock) {
			// Store the lock ID in sessionStorage for the main page to load
			// sessionStorage.setItem("selectedLockId", lockId);
			// goto("/lockpick");
		} else {
			// Lock not found, redirect to list with warning
			// sessionStorage.setItem("lockWarning", `Lock "${lockId}" not found`);
			// goto("/lockpick");
		}
	}

</script>

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
							<!-- // Display index reverses order so T1 appears at top -->
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
										<!-- // True if this is the center hole (hole 3 for 7 holes) -->
										{@const isCenterHole =
											j ===
											Math.floor(
												currentLock.numHoles / 2,
											)}
										<!-- // Current position value (1-7) determining tumbler extent -->
										{@const centerPinPos =
											tumblerPositions[displayIndex]}
										<!-- // Hole is filled if within tumbler material range -->
										<!-- // Range is [4 - position, 10 - position] clamped to [0, 6] for 1-based positions -->
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
											moveTumbler(displayIndex, "right")}
										class="px-2 py-1 bg-secondary text-text border border-border text-xs"
										disabled={tumblerPositions[
											displayIndex
										] === currentLock.numHoles}
									>
										←
									</button>
									<button
										onclick={() =>
											moveTumbler(displayIndex, "left")}
										class="px-2 py-1 bg-secondary text-text border border-border text-xs"
										disabled={tumblerPositions[
											displayIndex
										] === 1}
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
						� Save Positions
					</button>
				</div>
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
							>
								<input
									type="checkbox"
									bind:checked={linkReversed}
									class="w-4 h-4"
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
