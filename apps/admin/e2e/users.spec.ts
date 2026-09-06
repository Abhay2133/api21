import { test, expect } from '@playwright/test';

test.describe.serial('Admin Users Management & Fallback Authentication', () => {
  const testUser = `admin_${Date.now()}`;
  const testPass = 'P@ssw0rd123!';
  const updatedPass = 'NewSecretPass99!';

  test.beforeEach(async ({ page }) => {
    // Authenticate with master credentials
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/overview/);
  });

  test('loads users page and displays toolbar, filters, and Add User button', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/\/users/);

    await expect(page.locator('h3:has-text("Administrator Accounts")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Admin User")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search by username"]')).toBeVisible();
  });

  test('creates a new admin user via modal', async ({ page }) => {
    await page.goto('/users');
    await page.click('button:has-text("Add Admin User")');

    // Modal should be open
    await expect(page.locator('h3:has-text("Add New Admin User")')).toBeVisible();

    await page.fill('input[placeholder="e.g. devops_lead"]', testUser);
    await page.fill('input[placeholder="At least 6 characters"]', testPass);
    await page.fill('input[placeholder="Alex Taylor"]', 'Test Admin User');
    await page.fill('input[placeholder="alex@apps21.dev"]', `${testUser}@apps21.dev`);

    await page.click('button[type="submit"]:has-text("Create Admin User")');

    // Success notification should appear and modal close
    await expect(page.locator(`text=Admin user '${testUser}' created successfully.`)).toBeVisible();
    await expect(page.locator('h3:has-text("Add New Admin User")')).not.toBeVisible();

    // Verify user row exists in table
    await expect(page.locator('tbody tr').filter({ hasText: testUser })).toBeVisible();
  });

  test('edits the created admin user', async ({ page }) => {
    await page.goto('/users');
    const userRow = page.locator('tbody tr').filter({ hasText: testUser });
    await expect(userRow).toBeVisible();

    await userRow.locator('button:has-text("Edit")').click();
    await expect(page.locator(`h3:has-text("Edit Admin User")`)).toBeVisible();

    await page.fill('input[value="Test Admin User"]', 'Updated Admin Name');
    await page.click('button[type="submit"]:has-text("Save Changes")');

    await expect(page.locator(`text=Admin user '${testUser}' updated successfully.`)).toBeVisible();
    await expect(page.locator('text=Updated Admin Name')).toBeVisible();
  });

  test('resets password and logs in with newly created database user credentials', async ({ page }) => {
    await page.goto('/users');
    const userRow = page.locator('tbody tr').filter({ hasText: testUser });
    await userRow.locator('button:has-text("Password")').click();

    await expect(page.locator(`h3:has-text("Reset Password")`)).toBeVisible();
    await page.fill('input[placeholder="At least 6 characters"]', updatedPass);
    await page.fill('input[placeholder="Repeat new password"]', updatedPass);
    await page.click('button[type="submit"]:has-text("Reset Password")');

    await expect(page.locator(`text=Password for '${testUser}' has been reset successfully.`)).toBeVisible();

    // Clear session and test logging in with this newly created DB user
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="text"]', testUser);
    await page.fill('input[type="password"]', updatedPass);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/overview/);
  });

  test('deletes the admin user and verifies master fallback login still works', async ({ page }) => {
    await page.goto('/users');
    const userRow = page.locator('tbody tr').filter({ hasText: testUser });
    await userRow.locator('button[title="Delete User"]').click();

    // Verify AlertDialog confirmation
    await expect(page.locator(`text=Delete Admin Account: ${testUser}?`)).toBeVisible();
    await page.locator('button:has-text("Delete User")').click();

    await expect(page.locator(`text=Admin user '${testUser}' was deleted.`)).toBeVisible();

    // Verify master environment credentials still log in seamlessly as fallback
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'securepassword');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/overview/);
  });
});
