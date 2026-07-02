import { test, expect } from "@playwright/test";

test.describe("Blog Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
  });

  test("opens via trigger button and focuses the input", async ({ page }) => {
    const modal = page.locator("#search-modal");
    await expect(modal).toBeHidden();

    await page.locator("#search-trigger").click();

    await expect(modal).toBeVisible();
    await expect(page.locator("#search-input")).toBeFocused();
  });

  test("opens and closes with the Ctrl+K shortcut", async ({ page }) => {
    const modal = page.locator("#search-modal");

    await page.keyboard.press("Control+k");
    await expect(modal).toBeVisible();

    await page.keyboard.press("Control+k");
    await expect(modal).toBeHidden();
  });

  test("closes with Escape", async ({ page }) => {
    await page.locator("#search-trigger").click();
    await expect(page.locator("#search-modal")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("#search-modal")).toBeHidden();
  });

  test("returns relevant results for a query", async ({ page }) => {
    await page.locator("#search-trigger").click();
    await page.locator("#search-input").fill("vaultctl");

    const results = page.locator(".search-result");
    await expect(results.first()).toBeVisible();
    await expect(results.first()).toContainText("vaultctl");
  });

  test("shows an empty state for no matches", async ({ page }) => {
    await page.locator("#search-trigger").click();
    await page.locator("#search-input").fill("zzzznomatchquery");

    await expect(page.locator(".search-state-empty")).toBeVisible();
    await expect(page.locator(".search-result")).toHaveCount(0);
  });

  test("Enter opens the highlighted result", async ({ page }) => {
    await page.locator("#search-trigger").click();
    await page.locator("#search-input").fill("vaultctl");

    const firstResult = page.locator(".search-result").first();
    await expect(firstResult).toBeVisible();
    const targetUrl = await firstResult.getAttribute("data-url");
    expect(targetUrl).toBeTruthy();

    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(new RegExp(targetUrl!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  test("arrow keys move the active selection", async ({ page }) => {
    await page.locator("#search-trigger").click();
    await page.locator("#search-input").fill("building");

    const results = page.locator(".search-result");
    await expect(results.first()).toHaveClass(/is-active/);

    await page.keyboard.press("ArrowDown");
    await expect(results.nth(1)).toHaveClass(/is-active/);
    await expect(results.first()).not.toHaveClass(/is-active/);
  });
});
