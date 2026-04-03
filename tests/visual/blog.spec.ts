import { test, expect } from "@playwright/test";

test.describe("Visual Regression — Blog", () => {
  test("blog listing page — terminal theme", async ({ page }) => {
    await page.goto("/blog");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "terminal");
      document
        .querySelectorAll(".fade-in")
        .forEach((el) => el.classList.add("visible"));
    });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("blog-listing-terminal.png", {
      fullPage: true,
    });
  });

  test("blog post page — elegant theme", async ({ page }) => {
    await page.goto("/blog/hello-world");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "elegant");
      document
        .querySelectorAll(".fade-in")
        .forEach((el) => el.classList.add("visible"));
    });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("blog-post-elegant.png", {
      fullPage: true,
    });
  });
});
