<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { Card, Button, Input } from 'twintrinsic';
	import { colorThemes, defaultTheme, getThemeFromCustomColor, type ColorTheme } from '$lib/theme';

	const STORAGE_KEY = 'gothic-remake-tools-theme';

	function loadFromStorage() {
		if (typeof window === 'undefined') return null;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	}

	function saveToStorage(data: { selectedTheme: number; customColor: string; useCustom: boolean }) {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch {
			// Storage might be disabled or full
		}
	}

	const stored = loadFromStorage();
	const selectedTheme = writable<number>(stored?.selectedTheme ?? 0);
	const customColor = writable<string>(stored?.customColor ?? '#d4af37');
	const useCustom = writable<boolean>(stored?.useCustom ?? false);

	function getCurrentTheme(): ColorTheme {
		if ($useCustom) {
			return getThemeFromCustomColor($customColor);
		}
		return colorThemes[$selectedTheme];
	}

	function applyTheme(theme: ColorTheme) {
		document.documentElement.style.setProperty('--theme-primary', theme.primary);
		document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
		document.documentElement.style.setProperty('--theme-accent', theme.accent);
		document.documentElement.style.setProperty('--theme-bg', theme.bg);
		document.documentElement.style.setProperty('--theme-border', theme.border);
		document.documentElement.style.setProperty('--theme-text', theme.text);
	}

	onMount(() => {
		applyTheme(getCurrentTheme());
	});

	$effect(() => {
		applyTheme(getCurrentTheme());
		saveToStorage({ selectedTheme: $selectedTheme, customColor: $customColor, useCustom: $useCustom });
	});

	function selectTheme(index: number) {
		useCustom.set(false);
		selectedTheme.set(index);
	}

	function applyCustomTheme() {
		useCustom.set(true);
	}
</script>

<div class="p-8 max-w-4xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Site Theme</h1>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">Pre-configured Themes</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each colorThemes as theme, i}
				<div
					class="card border border-border dark:border-border cursor-pointer transition-all hover:scale-105 {$selectedTheme === i && !$useCustom ? 'ring-2 ring-primary' : ''}"
					onclick={() => selectTheme(i)}
				>
					<div class="p-4">
						<div class="flex items-center gap-3 mb-3">
							<div
								class="w-8 h-8 rounded-full"
								style="background-color: {theme.primary}"
							></div>
							<h3 class="font-semibold">{theme.name}</h3>
						</div>
						<div class="grid grid-cols-5 gap-1">
							<div
								class="w-full h-4 rounded"
								style="background-color: {theme.primary}"
							></div>
							<div
								class="w-full h-4 rounded"
								style="background-color: {theme.secondary}"
							></div>
							<div
								class="w-full h-4 rounded"
								style="background-color: {theme.accent}"
							></div>
							<div
								class="w-full h-4 rounded"
								style="background-color: {theme.bg}"
							></div>
							<div
								class="w-full h-4 rounded"
								style="background-color: {theme.border}"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-2xl font-semibold mb-4">Custom Theme</h2>
		<div class="card border border-border dark:border-border p-6">
			<div class="flex flex-col gap-4">
				<div>
					<label for="customColor" class="block mb-2 font-medium">Primary Color</label>
					<div class="flex gap-3">
						<input
							id="customColor"
							type="color"
							bind:value={$customColor}
							class="w-16 h-10 cursor-pointer border border-border"
						/>
						<input
							type="text"
							bind:value={$customColor}
							placeholder="#d4af37"
							class="flex-1 px-3 py-2 border border-border bg-background text-text"
						/>
					</div>
				</div>
				<button
					onclick={applyCustomTheme}
					class="px-4 py-2 bg-primary text-text border border-primary font-medium"
				>
					Apply Custom Theme
				</button>
			</div>
		</div>
	</section>
</div>
