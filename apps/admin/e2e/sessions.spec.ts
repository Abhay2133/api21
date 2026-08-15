import { test, expect } from '@playwright/test';

test.describe('Admin Sessions Management', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/overview/);
  });

  test('renders sessions table with columns and entries', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page).toHaveURL(/\/sessions/);

    // Verify header and table structure
    await expect(page.locator('text=Recorded Administrative Sessions')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'SESSION ID' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'ADMIN USER' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'STATUS' })).toBeVisible();

    // Verify session rows exist
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('filters sessions via search bar', async ({ page }) => {
    await page.goto('/sessions');
    const searchInput = page.locator('input[placeholder*="Search by ID, username"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('nonexistent-search-query-12345');
    await expect(page.locator('text=No matching administrative sessions found.')).toBeVisible();

    await searchInput.fill('');
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('filters sessions by status pills (All, Active, Revoked)', async ({ page }) => {
    await page.goto('/sessions');

    const allBtn = page.locator('button:has-text("All")');
    const activeBtn = page.locator('button:has-text("Active")');
    const revokedBtn = page.locator('button:has-text("Revoked")');

    await expect(allBtn).toBeVisible();
    await expect(activeBtn).toBeVisible();
    await expect(revokedBtn).toBeVisible();

    // Click Active filter
    await activeBtn.click();
    // Click Revoked filter
    await revokedBtn.click();
    // Reset to All
    await allBtn.click();
  });

  test('opens session telemetry details dialog on clicking Details button', async ({ page }) => {
    await page.goto('/sessions');
    const detailsBtn = page.locator('tbody tr').first().locator('button:has-text("Details")');
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // Verify Details modal opens with Telemetry header
    await expect(page.locator('h3:has-text("Telemetry")')).toBeVisible();
    await expect(page.locator('text=Authenticated User')).toBeVisible();

    // Close modal
    await page.locator('button:has-text("Close")').click();
    await expect(page.locator('text=Authenticated User')).not.toBeVisible();
  });
});
