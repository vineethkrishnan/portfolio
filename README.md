<p align="center">
  <strong>vineethnk.in</strong><br>
  <em>Personal portfolio with 3 switchable themes, MDX blog, and full test coverage.</em>
</p>

<p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-6-ff5d01?logo=astro&logoColor=white" alt="Astro 6"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4"></a>
  <a href="https://playwright.dev/"><img src="https://img.shields.io/badge/Playwright-85_tests-2ead33?logo=playwright&logoColor=white" alt="Playwright"></a>
  <a href="https://pages.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare_Pages-deployed-f38020?logo=cloudflarepages&logoColor=white" alt="Cloudflare Pages"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
</p>

---

## Themes

Three visually distinct themes, switchable at runtime and persisted in localStorage:

| Minimal | Terminal | Elegant |
|---------|----------|---------|
| Clean white, warm amber accents, serif typography, dot grid background | Dark CRT aesthetic, green neon, monospace, scanlines, `$ whoami` prompt | Deep navy, violet-to-pink gradients, glass morphism, gradient borders |

## Features

- **3 switchable themes** — Minimal Light, Dark Terminal, Modern Elegant
- **MDX blog** — Astro Content Collections with full prose styling
- **Dynamic data** — years of experience calculated from 2012 start year
- **Scroll animations** — intersection observer fade-in with staggered delays
- **Scroll progress bar** — gradient progress indicator in the navbar
- **Responsive** — mobile-first with hamburger menu and adaptive layouts
- **SEO ready** — Open Graph, Twitter cards, sitemap, semantic HTML
- **Theme-specific effects** — CRT scanlines (terminal), glass cards (elegant), shadow lift (minimal)

## Sections

Hero · About · Skills · Projects · Experience · GitHub Activity · Blog · Contact

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro 6](https://astro.build/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + CSS custom properties |
| Blog | MDX via `@astrojs/mdx` |
| Testing | [Playwright](https://playwright.dev/) — 61 E2E + 24 visual regression |
| CI/CD | GitHub Actions → Cloudflare Pages |
| Release | [release-please](https://github.com/googleapis/release-please) |

## Quick Start

```bash
git clone https://github.com/vineethkrishnan/portfolio.git && cd portfolio
npm install
npm run dev         # http://localhost:4321
```

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all Playwright tests (E2E + visual) |
| `npm run test:e2e` | Run E2E tests only |
| `npm run test:visual` | Run visual regression tests only |
| `npm run test:update-snapshots` | Update visual regression baselines |

## Project Structure

```
src/
├── components/        # Astro components (Hero, About, Skills, etc.)
├── content/
│   └── blog/          # MDX blog posts
├── data/              # Projects and skills data
├── layouts/           # Base and blog layouts
├── pages/
│   ├── index.astro    # Homepage
│   └── blog/          # Blog listing and post pages
└── styles/
    └── global.css     # Theme system + utilities
tests/
├── e2e/               # Navigation, themes, sections, blog
└── visual/            # Screenshot comparisons per theme
```

## CI/CD Pipeline

| Workflow | Trigger | Jobs |
|----------|---------|------|
| **CI** | Push + PR | Build, Type Check, E2E Tests, Visual Regression |
| **Release** | Push to main | release-please + Cloudflare Pages deploy |
| **Commit Lint** | PR | Validate PR title (conventional commits) |
| **Security** | Push + PR + weekly | CodeQL, Dependency Review, Trivy |

## Branch Protection

- Squash merge only
- Required checks: Build, Type Check, E2E, Visual Regression, CodeQL, Trivy, PR title
- No force push, no branch deletion
- Admin bypass for maintainer

## License

[MIT](LICENSE) © Vineeth N K
