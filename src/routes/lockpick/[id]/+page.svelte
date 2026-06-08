<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import type { Lock } from "$lib/index";

	// localStorage key for persisting user-created locks
	const STORAGE_KEY = "gothic-remake-tools-locks";

	// Default locks loaded from JSON file (bundled with app)
	import defaultLocksUntyped from "$lib/data/locks.json";
	const defaultLocks = defaultLocksUntyped as Lock[];

	onMount(() => {
		const lockId = $page.params.id;
		loadLock(lockId);
	});

	function loadLock(lockId: string) {
		// Load user locks from localStorage
		const userLocksJson = localStorage.getItem(STORAGE_KEY);
		const userLocks: Lock[] = userLocksJson
			? JSON.parse(userLocksJson)
			: [];

		// Check user locks first (they take precedence)
		let lock = userLocks.find((l) => l.id === lockId);

		// If not found in user locks, check built-in locks
		if (!lock) {
			lock = defaultLocks.find((l) => l.id === lockId);
		}

		if (lock) {
			// Store the lock ID in sessionStorage for the main page to load
			sessionStorage.setItem("selectedLockId", lockId);
			goto("/lockpick");
		} else {
			// Lock not found, redirect to list with warning
			sessionStorage.setItem("lockWarning", `Lock "${lockId}" not found`);
			goto("/lockpick");
		}
	}
</script>
