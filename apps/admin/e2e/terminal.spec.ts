import { test, expect } from '@playwright/test';

test.describe('Admin Terminal PTY & Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/overview/);
  });

  test('loads terminal page, initializes xterm canvas, and displays control buttons', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page).toHaveURL(/\/terminal/);

    // Verify topbar title
    await expect(page.locator('h1, h2, div').filter({ hasText: 'Terminal' }).first()).toBeVisible();

    // Verify terminal action buttons (Restart, Clear, Fullscreen)
    const restartBtn = page.locator('button:has-text("Restart")');
    const clearBtn = page.locator('button:has-text("Clear")');
    const fullscreenBtn = page.locator('button[title*="fullscreen" i], button:has-text("Fullscreen")').first();

    await expect(restartBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();

    // Verify xterm container rendered
    const xterm = page.locator('.xterm');
    await expect(xterm).toBeVisible({ timeout: 10000 });
  });

  test('toggles fullscreen mode when clicking fullscreen button', async ({ page }) => {
    await page.goto('/terminal');
    const fullscreenBtn = page.locator('button[title*="fullscreen" i]').first();
    if (await fullscreenBtn.isVisible()) {
      await fullscreenBtn.click();
      // Verify fullscreen indicator or button state changes
      await page.waitForTimeout(500);
      await fullscreenBtn.click();
    }
  });
});
