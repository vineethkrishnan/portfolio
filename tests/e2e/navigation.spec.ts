import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("navbar is visible and contains all links", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    const logo = nav.locator('a[href="/"]');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText("<VNK />");
  });

  test("desktop nav links are present", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Desktop-only test");

    const navLinks = page.locator(".nav-links .nav-link");
    const expectedLinks = ["About", "Skills", "Projects", "Blog", "Contact"];

    for (const label of expectedLinks) {
      await expect(navLinks.filter({ hasText: label })).toBeVisible();
    }
  });

  test("clicking nav link scrolls to section", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Desktop-only test");

    await page.click('.nav-link[href="/#projects"]');
    await page.waitForTimeout(800);

    const section = page.locator("#projects");
    await expect(section).toBeInViewport();
  });

  test("blog link navigates to blog page", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "Desktop-only test");

    await page.click('.nav-link[href="/blog"]');
    await expect(page).toHaveURL("/blog");
  });

  test("logo navigates home", async ({ page }) => {
    await page.goto("/blog");
    await page.click(".nav-logo");
    await expect(page).toHaveURL("/");
  });
});

test.describe("Mobile Navigation", () => {
  test("mobile menu toggle works", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");

    await page.goto("/");

    const toggle = page.locator("#mobile-toggle");
    const menu = page.locator("#mobile-menu");

    await expect(menu).not.toBeVisible();
    await toggle.click();
    await expect(menu).toBeVisible();

    const mobileLinks = menu.locator(".mobile-link");
    await expect(mobileLinks).toHaveCount(5);
  });

  test("mobile menu closes on link click", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only test");

    await page.goto("/");

    await page.click("#mobile-toggle");
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();

    await menu.locator('.mobile-link[href="/#about"]').click();
    await expect(menu).not.toBeVisible();
  });
});
