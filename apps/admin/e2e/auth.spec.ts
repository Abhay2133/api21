import { test, expect } from '@playwright/test';

test.describe('Admin Authentication & Session Guard', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/overview');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const alert = page.locator('.text-red-400');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Invalid|failed/i);
  });

  test('successfully logs in with master credentials and redirects to /overview', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/overview/);
    await expect(page.getByText('apps21', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('System Control Panel').first()).toBeVisible();
  });
});
