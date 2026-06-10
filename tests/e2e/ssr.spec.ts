import { test, expect } from "@playwright/test";

test.describe("Vue SSR & Hydration E2E", () => {
  test("should deliver server-side rendered HTML on initial load", async ({ request }) => {
    // 1. Fetch raw HTML directly (without JS engine) to prove Server-Side Rendering
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    
    const html = await response.text();
    
    // The placeholder should be replaced, and SSR content should be present
    expect(html).not.toContain("<!--ssr-outlet-->");
    expect(html).toContain("Abhay Bisht");
    expect(html).toContain("Software Engineer specializing in Full Stack");
  });

  test("should successfully hydrate on client-side and support interactivity", async ({ page }) => {
    // 2. Open page in browser with JavaScript enabled
    await page.goto("/");

    // Verify title and initial page state
    await expect(page).toHaveTitle("Abhay Bisht | Portfolio");

    // Wait for hydration to complete (indicated by client-side onMounted executing)
    await expect(page.locator(".scroll-animate").first()).toHaveClass(/transition-all/);
    
    const carToggle = page.locator('button[aria-label="Toggle Car Follower"]');
    await expect(carToggle).toBeVisible();
    
    // Click to enable car follower
    await carToggle.click();
    
    // Verify it changed to active state class
    await expect(carToggle).toHaveClass(/text-blue-500/);
  });

  test("should check nav header elements and link presence", async ({ page }) => {
    await page.goto("/");

    // Logo / Name check
    const logo = page.locator("nav div").first();
    await expect(logo).toContainText("Abhay Bisht");

    // Check social links
    const githubLink = page.locator('nav a[aria-label="GitHub"]');
    await expect(githubLink).toHaveAttribute("href", "https://github.com/abhay2133");

    const linkedinLink = page.locator('nav a[aria-label="LinkedIn"]');
    await expect(linkedinLink).toHaveAttribute("href", "https://www.linkedin.com/in/abhay-21m");
  });
});
