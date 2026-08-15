import { test, expect } from '@playwright/test';

test.describe('Shadcn AlertDialog Logout Confirmation Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/overview/);
  });

  test('clicking logout button opens confirmation dialog instead of direct logout', async ({ page }) => {
    const logoutBtn = page.locator('button[title="Sign out"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify AlertDialog is visible with prompt
    const dialogTitle = page.locator('text=Sign out of System Control Panel?');
    await expect(dialogTitle).toBeVisible();

    const dialogDesc = page.locator('text=Are you sure you want to log out?');
    await expect(dialogDesc).toBeVisible();

    // Verify Cancel and Sign out buttons exist
    const cancelBtn = page.locator('button:has-text("Cancel")');
    const confirmBtn = page.locator('button:has-text("Sign out")');
    await expect(cancelBtn).toBeVisible();
    await expect(confirmBtn).toBeVisible();
  });

  test('clicking Cancel in AlertDialog dismisses modal and keeps user on dashboard', async ({ page }) => {
    await page.locator('button[title="Sign out"]').click();
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await cancelBtn.click();

    // Modal should close
    await expect(page.locator('text=Sign out of System Control Panel?')).not.toBeVisible();
    // User remains on /overview
    await expect(page).toHaveURL(/\/overview/);
  });

  test('clicking Sign out in AlertDialog confirms termination and redirects to /login', async ({ page }) => {
    await page.locator('button[title="Sign out"]').click();
    const confirmBtn = page.locator('button:has-text("Sign out")');
    await confirmBtn.click();

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Administrative Login')).toBeVisible();

    // Verify subsequent protected route access is blocked
    await page.goto('/overview');
    await expect(page).toHaveURL(/\/login/);
  });
});
