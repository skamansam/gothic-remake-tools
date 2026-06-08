<script lang="ts">
	interface Lock {
		id: string;
		name: string;
		description: string;
		location: string;
		numTumblers: number;
		startingPositions: number[];
		links: Array<{ from: number; to: number; direction: "left" | "right" }>;
	}

	const STORAGE_KEY = "gothic-remake-tools-locks";

	const NUM_HOLES = 7;

	// Lock list
	let locks = $state<Lock[]>([]);
	let currentLock = $state<Lock | null>(null);

	// Lock creation/editing state
	let lockName = $state("");
	let lockDescription = $state("");
	let lockLocation = $state("");
	let numTumblers = $state(6);
	let startingPositionsInput = $state("0,0,0,0,0,0");
	let startingPositions = $state<number[]>([]);

	// Tumbler state (current positions)
	let tumblerPositions = $state<number[]>([]);

	// Link creation state
	let linkFrom = $state<number | null>(null);
	let linkTo = $state<number | null>(null);
	let linkDirection = $state<"left" | "right">("right");

	// UI state
	let showCreateForm = $state(false);
	let showLockList = $state(false);

	function loadLocks() {
		if (typeof window === "undefined") return;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				locks = JSON.parse(stored);
			}
		} catch {
			locks = [];
		}
	}

	function saveLocks() {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
		} catch {
			// Ignore storage errors
		}
	}

	function createLock() {
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

		const newLock: Lock = {
			id: Date.now().toString(),
			name: lockName,
			description: lockDescription,
			location: lockLocation,
			numTumblers,
			startingPositions: parsedPositions,
			links: [],
		};

		locks = [...locks, newLock];
		saveLocks();
		loadLock(newLock);
		showCreateForm = false;
		resetForm();
	}

	function loadLock(lock: Lock) {
		currentLock = lock;
		tumblerPositions = [...lock.startingPositions];
		linkFrom = null;
		linkTo = null;
		showLockList = false;
	}

	function updateCurrentLock() {
		if (!currentLock) return;

		currentLock.startingPositions = [...tumblerPositions];
		currentLock.links = [...(currentLock.links || [])];

		const index = locks.findIndex((l) => l.id === currentLock!.id);
		if (index !== -1) {
			locks[index] = { ...currentLock };
			saveLocks();
		}
	}

	function deleteLock(id: string) {
		locks = locks.filter((l) => l.id !== id);
		saveLocks();
		if (currentLock?.id === id) {
			currentLock = null;
			tumblerPositions = [];
		}
	}

	function resetForm() {
		lockName = "";
		lockDescription = "";
		lockLocation = "";
		numTumblers = 6;
		startingPositionsInput = "0,0,0,0,0,0";
		startingPositions = Array(6).fill(0);
	}

	function resetTumblers() {
		if (currentLock) {
			tumblerPositions = [...currentLock.startingPositions];
		}
	}

	function moveTumbler(index: number, direction: "left" | "right") {
		const currentPos = tumblerPositions[index];
		let newPos = direction === "left" ? currentPos - 1 : currentPos + 1;

		// Clamp to valid range
		newPos = Math.max(0, Math.min(NUM_HOLES - 1, newPos));

		if (newPos !== currentPos) {
			tumblerPositions[index] = newPos;
			applyLinks(index);
		}
	}

	function applyLinks(triggerIndex: number) {
		if (!currentLock) return;

		// Find all links that start from the moved tumbler
		const triggeredLinks = (currentLock.links || []).filter(
			(l) => l.from === triggerIndex,
		);

		for (const link of triggeredLinks) {
			const currentPos = tumblerPositions[link.to];
			let newPos =
				link.direction === "left" ? currentPos - 1 : currentPos + 1;
			newPos = Math.max(0, Math.min(NUM_HOLES - 1, newPos));

			if (newPos !== currentPos) {
				tumblerPositions[link.to] = newPos;
				// Recursively apply links from the newly moved tumbler
				applyLinks(link.to);
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
				l.direction === linkDirection,
		);
		if (!exists) {
			currentLock.links = [
				...(currentLock.links || []),
				{ from: linkFrom, to: linkTo, direction: linkDirection },
			];
			updateCurrentLock();
		}
		// Reset selection
		linkFrom = null;
		linkTo = null;
	}

	function removeLink(index: number) {
		if (!currentLock) return;
		currentLock.links = (currentLock.links || []).filter(
			(_, i) => i !== index,
		);
		updateCurrentLock();
	}

	// Update starting positions input when numTumblers changes
	$effect(() => {
		const currentPositions = startingPositionsInput
			.split(",")
			.map((s) => parseInt(s.trim(), 10))
			.filter((n) => !isNaN(n) && n >= 0 && n < NUM_HOLES);

		while (currentPositions.length < numTumblers) {
			currentPositions.push(0);
		}
		if (currentPositions.length > numTumblers) {
			currentPositions.length = numTumblers;
		}

		startingPositionsInput = currentPositions.join(",");
	});

	// Load locks on mount
	loadLocks();
</script>

<div class="p-8 max-w-6xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Lockpick Solver</h1>

	<!-- Lock Management -->
	<div class="flex gap-4 mb-6">
		<button
			onclick={() => (showLockList = true)}
			class="px-4 py-2 bg-primary text-text border border-primary"
		>
			📋 Load Lock
		</button>
		<button
			onclick={() => (showCreateForm = true)}
			class="px-4 py-2 bg-secondary text-text border border-border"
		>
			➕ New Lock
		</button>
	</div>

	<!-- Lock List Modal -->
	{#if showLockList}
		<div
			class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		>
			<div
				class="card border border-border dark:border-border p-6 max-w-2xl w-full mx-4 bg-surface"
			>
				<h2 class="text-2xl font-bold mb-4">Saved Locks</h2>
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
										onclick={() => loadLock(lock)}
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
				<button
					onclick={() => (showLockList = false)}
					class="px-4 py-2 bg-secondary text-text border border-border"
				>
					Close
				</button>
			</div>
		</div>
	{/if}

	<!-- Create Lock Modal -->
	{#if showCreateForm}
		<div
			class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		>
			<div
				class="card border border-border dark:border-border p-6 max-w-2xl w-full mx-4 bg-surface"
			>
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
						<label class="block mb-2 font-medium">Description</label
						>
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
						<label class="block mb-2 font-medium"
							>Number of Tumblers</label
						>
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
								showCreateForm = false;
								resetForm();
							}}
							class="px-4 py-2 bg-secondary text-text border border-border"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Current Lock Info -->
	{#if currentLock}
		<div
			class="card border border-border dark:border-border p-4 mb-6 bg-surface"
		>
			<h2 class="text-xl font-bold">{currentLock.name}</h2>
			<p class="text-text">{currentLock.location}</p>
			{#if currentLock.description}
				<p class="text-sm text-text mt-2">{currentLock.description}</p>
			{/if}
		</div>
	{:else}
		<div
			class="card border border-border dark:border-border p-6 mb-6 bg-surface text-center"
		>
			<p class="text-text">
				Load an existing lock or create a new one to get started.
			</p>
		</div>
	{/if}

	{#if currentLock}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Lock Visualization -->
			<section>
				<h2 class="text-2xl font-semibold mb-4">Lock Tumblers</h2>
				<div
					class="card border border-border dark:border-border p-6 mb-6"
				>
					<div class="space-y-4">
						{#each Array(currentLock.numTumblers) as _, i}
							<div class="flex items-center gap-4">
								<!-- Bolt indicator -->
								<div
									class="w-4 h-8 bg-secondary border-2 border-border rounded-l"
								></div>
								<span class="w-8 font-mono font-bold"
									>T{i + 1}</span
								>
								<div class="flex-1 flex gap-1">
									{#each Array(NUM_HOLES) as _, j}
										<div
											class="h-8 flex-1 border-2 {tumblerPositions[
												i
											] === j
												? 'bg-primary border-primary'
												: 'bg-surface border-border'}"
										>
											{#if tumblerPositions[i] === j}
												<div
													class="w-full h-full flex items-center justify-center"
												>
													<div
														class="w-2 h-2 bg-text rounded-full"
													></div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
								<div class="flex gap-2">
									<button
										onclick={() => moveTumbler(i, "left")}
										class="px-3 py-1 bg-secondary text-text border border-border text-sm"
										disabled={tumblerPositions[i] === 0}
									>
										←
									</button>
									<button
										onclick={() => moveTumbler(i, "right")}
										class="px-3 py-1 bg-secondary text-text border border-border text-sm"
										disabled={tumblerPositions[i] ===
											NUM_HOLES - 1}
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
							<label class="block mb-2 font-medium"
								>Direction</label
							>
							<div class="flex gap-2">
								<button
									class="px-4 py-2 border border-border {linkDirection ===
									'left'
										? 'bg-primary text-text'
										: 'bg-surface text-text'}"
									onclick={() => (linkDirection = "left")}
								>
									← Left
								</button>
								<button
									class="px-4 py-2 border border-border {linkDirection ===
									'right'
										? 'bg-primary text-text'
										: 'bg-surface text-text'}"
									onclick={() => (linkDirection = "right")}
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
	{/if}
</div>
