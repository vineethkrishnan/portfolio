import { test, expect } from "@playwright/test";

const themes = ["minimal", "terminal", "elegant"] as const;

test.describe("Visual Regression — Homepage", () => {
  for (const theme of themes) {
    test(`homepage hero — ${theme} theme`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-theme", t);
        document
          .querySelectorAll(".fade-in")
          .forEach((el) => el.classList.add("visible"));
      }, theme);

      // Wait for fonts + transitions
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`hero-${theme}.png`, {
        fullPage: false,
      });
    });

    test(`homepage full — ${theme} theme`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-theme", t);
        document
          .querySelectorAll(".fade-in")
          .forEach((el) => el.classList.add("visible"));
      }, theme);

      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`full-${theme}.png`, {
        fullPage: true,
      });
    });
  }
});

test.describe("Visual Regression — Components", () => {
  test("navbar — terminal theme", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "terminal");
    });
    await page.waitForTimeout(300);

    const navbar = page.locator("nav");
    await expect(navbar).toHaveScreenshot("navbar-terminal.png");
  });

  test("project cards — elegant theme", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "elegant");
      document
        .querySelectorAll(".fade-in")
        .forEach((el) => el.classList.add("visible"));
    });
    await page.waitForTimeout(300);

    const projects = page.locator("#projects");
    await projects.scrollIntoViewIfNeeded();
    await expect(projects).toHaveScreenshot("projects-elegant.png");
  });

  test("skills grid — minimal theme", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "minimal");
      document
        .querySelectorAll(".fade-in")
        .forEach((el) => el.classList.add("visible"));
    });
    await page.waitForTimeout(300);

    const skills = page.locator("#skills");
    await skills.scrollIntoViewIfNeeded();
    await expect(skills).toHaveScreenshot("skills-minimal.png");
  });

  test("github stats — terminal theme", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "terminal");
      document
        .querySelectorAll(".fade-in")
        .forEach((el) => el.classList.add("visible"));
    });
    await page.waitForTimeout(300);

    const github = page.locator("#github");
    await github.scrollIntoViewIfNeeded();
    await expect(github).toHaveScreenshot("github-stats-terminal.png");
  });
});
