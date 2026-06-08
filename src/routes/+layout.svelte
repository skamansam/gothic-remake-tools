<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { App, type MenuItem, setIconset, TwintrinsicLogo } from 'twintrinsic';
	import { page } from '$app/stores';
	import { type ColorTheme, colorThemes, getThemeFromCustomColor } from '$lib/theme';

	setIconset('mdi');

	let { children } = $props();

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

	function applyTheme(theme: ColorTheme) {
		document.documentElement.style.setProperty('--theme-primary', theme.primary);
		document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
		document.documentElement.style.setProperty('--theme-accent', theme.accent);
		document.documentElement.style.setProperty('--theme-bg', theme.bg);
		document.documentElement.style.setProperty('--theme-border', theme.border);
		document.documentElement.style.setProperty('--theme-text', theme.text);
	}

	onMount(() => {
		const stored = loadFromStorage();
		if (stored) {
			if (stored.useCustom) {
				applyTheme(getThemeFromCustomColor(stored.customColor));
			} else {
				applyTheme(colorThemes[stored.selectedTheme]);
			}
		}
	});

	const siteLinks = [
		{ label: 'Home', href: '/', current: $page.url.pathname === '/' },
		{ label: 'Lockpick', href: '/lockpick', current: $page.url.pathname === '/lockpick' }
	];

	const siteMenu: MenuItem[] = [
		{
			title: 'Tools',
			children: [
				{ title: 'Lockpick Solver', link: '/lockpick' }
			]
		},
		{
			title: 'Site Theme',
			link: "/theme"
		}
	];
</script>

{#snippet logo(size)}
  <TwintrinsicLogo {size}/>
{/snippet}

<div class="min-h-screen bg-background text-text">
<App
	appName="Gothic Remake Tools"
	rightSidebarHidden
	themeToggleHidden
  brand={{
    name: 'Gothic Remake Tools',
    href: '/',
    logo
  }}

	{siteMenu}
	{siteLinks}
>
	{@render children?.()}
</App>
</div>
