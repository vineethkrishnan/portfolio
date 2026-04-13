import { test, expect } from "@playwright/test";

test.describe("Homepage Sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Make all fade-in elements visible for testing
    await page.evaluate(() => {
      document
        .querySelectorAll(".fade-in")
        .forEach((el) => el.classList.add("visible"));
    });
  });

  test("hero section renders with correct content", async ({ page }) => {
    const hero = page.locator("#hero");
    await expect(hero).toBeVisible();

    await expect(page.locator(".hero-title")).toContainText("Vineeth N K");
    await expect(page.locator(".hero-tagline")).toContainText(
      "Writing code, building tools"
    );
  });

  test("hero has CTA buttons", async ({ page }) => {
    const viewProjects = page.locator('.btn-primary:has-text("View Projects")');
    await expect(viewProjects).toBeVisible();

    const github = page.locator('.btn-outline:has-text("GitHub")');
    await expect(github).toBeVisible();
    await expect(github).toHaveAttribute(
      "href",
      "https://github.com/vineethkrishnan"
    );
  });

  test("hero stats display correctly", async ({ page }) => {
    const stats = page.locator(".hero-stats");
    await expect(stats).toBeVisible();

    // Years calculated dynamically from 2012 start year
    const expectedYears = `${new Date().getFullYear() - 2012}+`;
    await expect(stats).toContainText(expectedYears);
    await expect(stats).toContainText("40+");
    await expect(stats).toContainText("8+");
  });

  test("about section renders", async ({ page }) => {
    const about = page.locator("#about");
    await expect(about).toBeVisible();

    await expect(about.locator(".section-title")).toContainText("About Me");
    await expect(about).toContainText("Cochin, Kerala");
    await expect(about).toContainText("BEO Software");

    // Highlight cards
    const cards = about.locator(".highlight-card");
    await expect(cards).toHaveCount(3);
  });

  test("skills section renders all categories", async ({ page }) => {
    const skills = page.locator("#skills");
    await expect(skills).toBeVisible();

    const cards = skills.locator(".skill-card");
    await expect(cards).toHaveCount(6);

    // Check key technologies are present
    await expect(skills).toContainText("TypeScript");
    await expect(skills).toContainText("NestJS");
    await expect(skills).toContainText("Docker");
    await expect(skills).toContainText("PostgreSQL");
  });

  test("projects section renders all project cards", async ({ page }) => {
    const projects = page.locator("#projects");
    await expect(projects).toBeVisible();

    // Featured projects (first 6)
    const featured = projects.locator(".project-card");
    await expect(featured).toHaveCount(6);

    // Other projects
    const other = projects.locator(".other-card");
    expect(await other.count()).toBeGreaterThan(0);

    // Check a specific project
    await expect(projects).toContainText("backupctl");
    await expect(projects).toContainText("diskdoc");
  });

  test("project cards link to GitHub", async ({ page }) => {
    const firstCard = page.locator(".project-card").first();
    const href = await firstCard.getAttribute("href");
    expect(href).toContain("github.com/vineethkrishnan");
  });

  test("experience section renders", async ({ page }) => {
    const experience = page.locator("#experience");
    await expect(experience).toBeVisible();

    await expect(experience).toContainText("Senior Full-Stack Developer");
    await expect(experience).toContainText("BEO Software");
  });

  test("github stats section renders", async ({ page }) => {
    const github = page.locator("#github");
    await expect(github).toBeVisible();

    // Stat cards
    const statCards = github.locator(".stat-card");
    await expect(statCards).toHaveCount(4);

    // Language bar
    const langBar = github.locator(".lang-bar");
    await expect(langBar).toBeVisible();

    // Contribution grid
    const contribGrid = github.locator(".contrib-grid");
    await expect(contribGrid).toBeVisible();
  });

  test("blog preview section renders", async ({ page }) => {
    const blog = page.locator("#blog");
    await expect(blog).toBeVisible();

    await expect(blog.locator(".section-title")).toContainText("Latest Posts");

    const blogCards = blog.locator(".blog-card");
    expect(await blogCards.count()).toBeGreaterThan(0);
  });

  test("contact section renders with correct links", async ({ page }) => {
    const contact = page.locator("#contact");
    await expect(contact).toBeVisible();

    const github = contact.locator('a[href="https://github.com/vineethkrishnan"]');
    await expect(github).toBeVisible();

    const linkedin = contact.locator(
      'a[href="https://www.linkedin.com/in/vineeth-n-k-40891265/"]'
    );
    await expect(linkedin).toBeVisible();
  });

  test("footer renders", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Vineeth N K");
    await expect(footer).toContainText("Astro");
  });
});
