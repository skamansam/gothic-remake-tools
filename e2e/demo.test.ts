import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('h1')).toContainText('Gothic 1 Remake Tools');
});

test('theme selector works', async ({ page }) => {
	await page.goto('/theme');

	// Check that theme cards are visible
	await expect(page.locator('h2').filter({ hasText: 'Pre-configured Themes' })).toBeVisible();

	// Click on a theme
	await page.locator('text=Old Camp').click();

	// Navigate back to home
	await page.goto('/');

	// Check that page still loads
	await expect(page.locator('h1')).toContainText('Gothic 1 Remake Tools');
});
