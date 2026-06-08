<script lang="ts">
	import defaultLocksUntyped from "$lib/data/locks.json";

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

	// localStorage key for persisting user-created locks
	const STORAGE_KEY = "gothic-remake-tools-locks";

	// Default number of holes per tumbler (configurable per lock)
	const NUM_HOLES = 7;

	// Default locks loaded from JSON file (bundled with app)
	const defaultLocks = defaultLocksUntyped as Lock[];

	// All locks (merged default + user locks from localStorage)
	let locks = $state<Lock[]>([]);

	// Currently selected/active lock being displayed and manipulated
	let currentLock = $state<Lock | null>(null);

	// Lock creation form input fields
	let lockName = $state(""); // Name of new lock being created
	let lockDescription = $state(""); // Optional description for new lock
	let lockLocation = $state(""); // In-game location of the lock
	let numTumblers = $state(6); // Number of tumblers for new lock (1-10)
	let startingPositionsInput = $state("0,0,0,0,0,0"); // Comma-separated string input for starting positions
	let startingPositions = $state<number[]>([]); // Parsed array of starting positions

	// Current positions of tumblers during gameplay (0 = leftmost, 3 = center, 6 = rightmost)
	let tumblerPositions = $state<number[]>([]);

	// Link creation form state
	let linkFrom = $state<number | null>(null); // Source tumbler index (0-based)
	let linkTo = $state<number | null>(null); // Target tumbler index (0-based)
	let linkReversed = $state(false); // Whether link direction is reversed (opposite movement)

	// UI modal visibility states
	let showCreateForm = $state(false); // Show/hide create lock modal
	let showLockList = $state(false); // Show/hide lock list modal

	function loadLocks() {
		if (typeof window === "undefined") return;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const userLocks = JSON.parse(stored) as Lock[];
				// Merge default locks with user locks, keeping user locks if they have the same ID
				const userLockIds = new Set(userLocks.map((l) => l.id));
				const mergedLocks = [
					...defaultLocks.filter((l) => !userLockIds.has(l.id)),
					...userLocks,
				];
				locks = mergedLocks;
			} else {
				// No user locks, use defaults
				locks = [...defaultLocks];
			}
		} catch {
			// On error, use defaults
			locks = [...defaultLocks];
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
			numHoles: NUM_HOLES,
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
		if (!currentLock) return;
		const currentPos = tumblerPositions[index];
		const maxPos = currentLock.numHoles; // 7 for 7 holes
		let newPos = direction === "left" ? currentPos - 1 : currentPos + 1;

		// Clamp to valid range (1 to numHoles)
		newPos = Math.max(1, Math.min(maxPos, newPos));

		if (newPos !== currentPos) {
			tumblerPositions[index] = newPos;
			applyLinks(index);
		}
	}

	function applyLinks(triggerIndex: number) {
		if (!currentLock) return;
		const maxPos = currentLock.numHoles; // 7 for 7 holes

		// Find all links that start from the moved tumbler
		const triggeredLinks = (currentLock.links || []).filter(
			(l) => l.from === triggerIndex,
		);

		for (const link of triggeredLinks) {
			const currentPos = tumblerPositions[link.to];
			let newPos = link.reversed ? currentPos - 1 : currentPos + 1;
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
	{/if}
</div>
