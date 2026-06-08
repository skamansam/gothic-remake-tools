<script lang="ts">
	// Lock configuration: 6 tumblers, each with 7 holes (positions 0-6)
	const NUM_TUMBLERS = 6;
	const NUM_HOLES = 7;

	// Tumbler state: position (0-6) for each tumbler
	let tumblerPositions = $state(Array(NUM_TUMBLERS).fill(0));

	// Links: array of { from: number, to: number, direction: 'left' | 'right' }
	let links = $state<Array<{ from: number; to: number; direction: 'left' | 'right' }>>([]);

	// Link creation state
	let linkFrom = $state<number | null>(null);
	let linkTo = $state<number | null>(null);
	let linkDirection = $state<'left' | 'right'>('right');

	// Target positions to solve for
	let targetPositions = $state(Array(NUM_TUMBLERS).fill(3));

	function moveTumbler(index: number, direction: 'left' | 'right') {
		const currentPos = tumblerPositions[index];
		let newPos = direction === 'left' ? currentPos - 1 : currentPos + 1;

		// Clamp to valid range
		newPos = Math.max(0, Math.min(NUM_HOLES - 1, newPos));

		if (newPos !== currentPos) {
			tumblerPositions[index] = newPos;
			applyLinks(index);
		}
	}

	function applyLinks(triggerIndex: number) {
		// Find all links that start from the moved tumbler
		const triggeredLinks = links.filter((l) => l.from === triggerIndex);

		for (const link of triggeredLinks) {
			const currentPos = tumblerPositions[link.to];
			let newPos = link.direction === 'left' ? currentPos - 1 : currentPos + 1;
			newPos = Math.max(0, Math.min(NUM_HOLES - 1, newPos));

			if (newPos !== currentPos) {
				tumblerPositions[link.to] = newPos;
				// Recursively apply links from the newly moved tumbler
				applyLinks(link.to);
			}
		}
	}

	function addLink() {
		if (linkFrom !== null && linkTo !== null && linkFrom !== linkTo) {
			// Check if link already exists
			const exists = links.some(
				(l) => l.from === linkFrom && l.to === linkTo && l.direction === linkDirection
			);
			if (!exists) {
				links = [...links, { from: linkFrom, to: linkTo, direction: linkDirection }];
			}
			// Reset selection
			linkFrom = null;
			linkTo = null;
		}
	}

	function removeLink(index: number) {
		links = links.filter((_, i) => i !== index);
	}

	function resetTumblers() {
		tumblerPositions = Array(NUM_TUMBLERS).fill(0);
	}

	function isSolved() {
		return tumblerPositions.every((pos, i) => pos === targetPositions[i]);
	}
</script>

<div class="p-8 max-w-6xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Lockpick Solver</h1>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Lock Visualization -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Lock Tumblers</h2>
			<div class="card border border-border dark:border-border p-6 mb-6">
				<div class="space-y-4">
					{#each Array(NUM_TUMBLERS) as _, i}
						<div class="flex items-center gap-4">
							<span class="w-8 font-mono font-bold">T{i + 1}</span>
							<div class="flex-1 flex gap-1">
								{#each Array(NUM_HOLES) as _, j}
									<div
										class="h-8 flex-1 rounded border-2 {tumblerPositions[i] === j
											? 'bg-primary border-primary'
											: 'bg-surface border-border'}"
									></div>
								{/each}
							</div>
							<div class="flex gap-2">
								<button
									onclick={() => moveTumbler(i, 'left')}
									class="px-3 py-1 bg-secondary text-text border border-border text-sm"
									disabled={tumblerPositions[i] === 0}
								>
									←
								</button>
								<button
									onclick={() => moveTumbler(i, 'right')}
									class="px-3 py-1 bg-secondary text-text border border-border text-sm"
									disabled={tumblerPositions[i] === NUM_HOLES - 1}
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
				{#if isSolved()}
					<div class="px-4 py-2 bg-success text-text border border-success font-bold">
						🔓 Unlocked!
					</div>
				{/if}
			</div>
		</section>

		<!-- Link Configuration -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Tumbler Links</h2>
			<div class="card border border-border dark:border-border p-6 mb-6">
				<div class="space-y-4">
					<div>
						<label class="block mb-2 font-medium">From Tumbler</label>
						<div class="flex gap-2 flex-wrap">
							{#each Array(NUM_TUMBLERS) as _, i}
								<button
									class="px-3 py-1 border border-border {linkFrom === i
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
						<label class="block mb-2 font-medium">To Tumbler</label>
						<div class="flex gap-2 flex-wrap">
							{#each Array(NUM_TUMBLERS) as _, i}
								<button
									class="px-3 py-1 border border-border {linkTo === i
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
						<label class="block mb-2 font-medium">Direction</label>
						<div class="flex gap-2">
							<button
								class="px-4 py-2 border border-border {linkDirection === 'left'
									? 'bg-primary text-text'
									: 'bg-surface text-text'}"
								onclick={() => (linkDirection = 'left')}
							>
								← Left
							</button>
							<button
								class="px-4 py-2 border border-border {linkDirection === 'right'
									? 'bg-primary text-text'
									: 'bg-surface text-text'}"
								onclick={() => (linkDirection = 'right')}
							>
								Right →
							</button>
						</div>
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
			{#if links.length > 0}
				<div class="card border border-border dark:border-border p-6">
					<h3 class="font-semibold mb-4">Active Links</h3>
					<div class="space-y-2">
						{#each links as link, i}
							<div class="flex items-center justify-between p-2 bg-surface border border-border">
								<span class="font-mono">
									T{link.from + 1} → T{link.to + 1} ({link.direction})
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
</div>
