import { test, expect } from "@playwright/test";

test.describe("PWA & Offline Fallback E2E Tests", () => {
  test.beforeEach(async ({ context, page }) => {
    // Enable browser console logging in tests for debugging
    page.on("console", msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", err => console.log(`[Browser Error] ${err.message}`));
    
    // Ensure we start online
    await context.setOffline(false);
  });

  test("should register service worker", async ({ page }) => {
    await page.goto("/");
    // Wait for the service worker to be registered and ready
    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      return reg !== null;
    });
    expect(swRegistered).toBe(true);
  });

  test("should redirect to /offline on failed navigation when offline", async ({ page, context }) => {
    await page.goto("/");
    
    // Wait for service worker to register
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    }, null, { timeout: 5000 });

    // Go offline
    await context.setOffline(true);

    // Try navigating to a page that isn't cached (using a subpage)
    // We expect the navigation to fail and the Service Worker to redirect to /offline
    await page.goto("/some-random-route");

    // The URL should have redirected to the offline page with _next parameter
    await expect(page).toHaveURL(/\/offline\?_next=%2Fsome-random-route/);

    // Check for offline page content
    const offlineHeader = page.locator("h1");
    await expect(offlineHeader).toContainText("You're Offline");

    // Keep retry button active
    const retryBtn = page.locator("button#retry-btn");
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).not.toBeDisabled();
  });

  test("should stay on offline page when clicking retry while still offline", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    await context.setOffline(true);
    await page.goto("/some-random-route");
    await expect(page).toHaveURL(/\/offline\?_next=%2Fsome-random-route/);

    const retryBtn = page.locator("button#retry-btn");
    // Click retry while offline
    await retryBtn.click();

    // Should still be on the offline page (since the navigation failed again)
    await expect(page).toHaveURL(/\/offline\?_next=%2Fsome-random-route/);
  });

  test("should automatically redirect when connection is restored", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    await context.setOffline(true);
    await page.goto("/some-random-route");
    await expect(page).toHaveURL(/\/offline\?_next=%2Fsome-random-route/);

    // Go back online - Chrome will automatically trigger the 'online' event on the window,
    // which our offline page listens to and redirects back.
    await context.setOffline(false);

    // The browser should auto-redirect to the target page /some-random-route
    await expect(page).toHaveURL(/\/some-random-route/, { timeout: 10000 });
  });

  test("should show connection status toast when coming online/offline", async ({ page, context }) => {
    await page.goto("/");
    // Wait for hydration/controller to be ready
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    // Simulate going offline
    await context.setOffline(true);

    // Verify offline status toast is shown
    const offlineToast = page.locator(".connection-toast-offline");
    await expect(offlineToast).toBeVisible();
    await expect(offlineToast).toContainText("You are currently offline");

    // Simulate coming back online
    await context.setOffline(false);

    // Verify online status toast is shown
    const onlineToast = page.locator(".connection-toast-online");
    await expect(onlineToast).toBeVisible();
    await expect(onlineToast).toContainText("Connection restored");
  });
});
