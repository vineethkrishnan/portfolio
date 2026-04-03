import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
  test("blog listing page loads", async ({ page }) => {
    await page.goto("/blog");

    await expect(page).toHaveTitle(/Blog/);
    await expect(page.locator(".section-title")).toContainText("Blog");
  });

  test("blog listing shows posts", async ({ page }) => {
    await page.goto("/blog");

    const cards = page.locator(".blog-card");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("blog post page loads from listing", async ({ page }) => {
    await page.goto("/blog");

    const firstCard = page.locator(".blog-card").first();
    await firstCard.click();

    await expect(page.locator(".blog-title")).toBeVisible();
    await expect(page.locator(".blog-content")).toBeVisible();
  });

  test("blog post has back link", async ({ page }) => {
    await page.goto("/blog/hello-world");

    const backLink = page.locator(".blog-back");
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText("Back to blog");

    await backLink.click();
    await expect(page).toHaveURL("/blog");
  });

  test("blog post renders metadata", async ({ page }) => {
    await page.goto("/blog/hello-world");

    await expect(page.locator(".blog-title")).toContainText("Hello World");
    await expect(page.locator(".blog-meta time")).toBeVisible();
    await expect(page.locator(".blog-tags .tag")).toHaveCount(3);
  });

  test("blog post renders markdown content", async ({ page }) => {
    await page.goto("/blog/hello-world");

    const content = page.locator(".blog-content");
    await expect(content).toBeVisible();

    // Check headings rendered from markdown
    await expect(content.locator("h2").first()).toBeVisible();
    // Check list items rendered
    await expect(content.locator("li").first()).toBeVisible();
  });
});
