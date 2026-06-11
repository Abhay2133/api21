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

  test("should return 404 status and not found page for non-existent routes", async ({ page, request }) => {
    // 1. Check response status code directly using request
    const response = await request.get("/non-existent-page-url");
    expect(response.status()).toBe(404);

    // 2. Load page and verify it shows our custom "Page Not Found" page
    await page.goto("/non-existent-page-url");
    await expect(page.locator("h1")).toContainText("404");
    await expect(page.locator("h2")).toContainText("Page Not Found");
    
    // Check "Back to Home" button presence
    const homeBtn = page.locator('a:has-text("Back to Home")');
    await expect(homeBtn).toBeVisible();
  });

  test("should check that the resume link points to the copied PDF file", async ({ page }) => {
    await page.goto("/");
    const resumeLink = page.locator('a:has-text("Resume")');
    await expect(resumeLink).toHaveAttribute("href", "/Resume_Abhay-Bisht.pdf");
  });

  test("should return health status data from API", async ({ request }) => {
    const response = await request.get("/api/v1/health");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("ok");
    expect(["up", "down"]).toContain(data.data.postgres);
    expect(["up", "down"]).toContain(data.data.redis);
  });
});
