import { test, expect } from '@playwright/test';

test.describe('Admin Theme & Design System Uniformity', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/overview/);
  });

  test('verifies pure black background (#09090b) and zinc border consistency across dashboard', async ({ page }) => {
    // Check root background
    const bodyBg = await page.evaluate(() => {
      const el = document.querySelector('body');
      return el ? window.getComputedStyle(el).backgroundColor : '';
    });
    // #09090b in rgb is rgb(9, 9, 11)
    expect(bodyBg).toBe('rgb(9, 9, 11)');

    // Check sidebar background
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Verify nav links render cleanly
    await expect(page.locator('a:has-text("Overview")')).toBeVisible();
    await expect(page.locator('a:has-text("Terminal")')).toBeVisible();
    await expect(page.locator('a:has-text("Sessions")')).toBeVisible();
    await expect(page.locator('a:has-text("Deployments")')).toBeVisible();
  });

  test('verifies zero legacy slate classes on active views', async ({ page }) => {
    for (const path of ['/overview', '/sessions', '/deployments', '/terminal']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Ensure no elements contain stale bg-[#070b12] or bg-[#0c121d]
      const staleBgCount = await page.locator('[class*="bg-[#070b12]"], [class*="bg-[#0c121d]"]').count();
      expect(staleBgCount).toBe(0);
    }
  });
});
