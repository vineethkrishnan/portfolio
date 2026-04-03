import { test, expect } from "@playwright/test";

const themes = ["minimal", "terminal", "elegant"] as const;

test.describe("Theme Switcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("theme switcher is visible", async ({ page }) => {
    const switcher = page.locator("#theme-switcher");
    await expect(switcher).toBeVisible();

    const buttons = switcher.locator(".theme-btn");
    await expect(buttons).toHaveCount(3);
  });

  for (const theme of themes) {
    test(`switching to ${theme} theme updates data-theme attribute`, async ({
      page,
    }) => {
      await page.click(`[data-theme-value="${theme}"]`);

      const dataTheme = await page
        .locator("html")
        .getAttribute("data-theme");
      expect(dataTheme).toBe(theme);
    });
  }

  test("active theme button has active class", async ({ page }) => {
    await page.click('[data-theme-value="elegant"]');

    const elegantBtn = page.locator('[data-theme-value="elegant"]');
    await expect(elegantBtn).toHaveClass(/active/);

    const terminalBtn = page.locator('[data-theme-value="terminal"]');
    await expect(terminalBtn).not.toHaveClass(/active/);
  });

  test("theme persists across page navigation", async ({ page }) => {
    await page.click('[data-theme-value="minimal"]');

    await page.goto("/blog");

    const dataTheme = await page
      .locator("html")
      .getAttribute("data-theme");
    expect(dataTheme).toBe("minimal");
  });

  test("terminal theme shows $ whoami prompt", async ({ page }) => {
    await page.click('[data-theme-value="terminal"]');

    const prompt = page.locator(".terminal-only");
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText("$ whoami");

    const badge = page.locator(".non-terminal-only");
    await expect(badge).not.toBeVisible();
  });

  test("minimal theme shows badge instead of prompt", async ({ page }) => {
    await page.click('[data-theme-value="minimal"]');

    const badge = page.locator(".non-terminal-only");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("Full Stack Developer");

    const prompt = page.locator(".terminal-only");
    await expect(prompt).not.toBeVisible();
  });
});
