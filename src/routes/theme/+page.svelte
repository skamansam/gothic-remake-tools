<script lang="ts">
	import { Card, Button, Input } from 'twintrinsic';
	import { colorThemes, defaultTheme, getThemeFromCustomColor, type ColorTheme } from '$lib/theme';

	const STORAGE_KEY = 'gothic-remake-tools-theme';

	let selectedTheme = $state(0);
	let useCustom = $state(false);
	let customColor = $state('#d4af37');

	function loadFromStorage() {
		if (typeof window === 'undefined') return null;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	}

	function saveToStorage(settings: { selectedTheme: number; useCustom: boolean; customColor: string }) {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		} catch {
			// Ignore storage errors
		}
	}

	function applyTheme(theme: ColorTheme) {
		document.documentElement.style.setProperty('--theme-primary', theme.primary);
		document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
		document.documentElement.style.setProperty('--theme-accent', theme.accent);
		document.documentElement.style.setProperty('--theme-bg', theme.bg);
		document.documentElement.style.setProperty('--theme-border', theme.border);
		document.documentElement.style.setProperty('--theme-text', theme.text);
	}

	function selectTheme(index: number) {
		selectedTheme = index;
		useCustom = false;
		applyTheme(colorThemes[index]);
		saveToStorage({ selectedTheme: index, useCustom: false, customColor });
	}

	function applyCustomTheme() {
		useCustom = true;
		const theme = getThemeFromCustomColor(customColor);
		applyTheme(theme);
		saveToStorage({ selectedTheme, useCustom: true, customColor });
	}

	// Load saved theme on mount
	$effect(() => {
		const stored = loadFromStorage();
		if (stored) {
			selectedTheme = stored.selectedTheme;
			useCustom = stored.useCustom;
			customColor = stored.customColor;
			if (stored.useCustom) {
				applyTheme(getThemeFromCustomColor(stored.customColor));
			} else {
				applyTheme(colorThemes[stored.selectedTheme]);
			}
		}
	});
</script>

<div class="p-8 max-w-4xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Site Theme</h1>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">Pre-configured Themes</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each colorThemes as theme, i}
				<Card
					class="cursor-pointer transition-all hover:scale-105 {selectedTheme === i && !useCustom ? 'ring-2 ring-primary' : ''}"
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
				</Card>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-2xl font-semibold mb-4">Custom Theme</h2>
		<Card class="p-6">
			<div class="flex flex-col gap-4">
				<div>
					<label for="customColor" class="block mb-2 font-medium">Primary Color</label>
					<div class="flex gap-3">
						<Input
							id="customColor"
							type="color"
							bind:value={customColor}
							class="w-16 h-10 cursor-pointer"
						/>
						<Input
							type="text"
							bind:value={customColor}
							placeholder="#d4af37"
							class="flex-1"
						/>
					</div>
				</div>
				<Button onclick={applyCustomTheme}>Apply Custom Theme</Button>
			</div>
		</Card>
	</section>
</div>
