export interface Project {
  name: string;
  description: string;
  language: string;
  stars: number;
  url: string;
  topics: string[];
}

export const projects: Project[] = [
  {
    name: "backupctl",
    description:
      "Multi-project backup orchestration service for PostgreSQL, MySQL & MongoDB with Restic storage, GPG encryption, scheduled runs, notifications, audit trails, crash recovery, and a 14-command CLI.",
    language: "TypeScript",
    stars: 1,
    url: "https://github.com/vineethkrishnan/backupctl",
    topics: ["backup", "cli", "nest", "restic-backups"],
  },
  {
    name: "diskdoc",
    description:
      "Interactive disk analysis & cleanup CLI for macOS and Linux, built in Rust. Docker-aware, safe, and production-ready.",
    language: "Rust",
    stars: 1,
    url: "https://github.com/vineethkrishnan/diskdoc",
    topics: ["cli", "disk-usage", "docker", "linux", "macos", "rust"],
  },
  {
    name: "dockit",
    description:
      "Safe, intelligent, audit-first Docker disk analysis and cleanup CLI built in Go.",
    language: "Go",
    stars: 1,
    url: "https://github.com/vineethkrishnan/dockit",
    topics: ["cli", "devops", "disk-cleanup", "docker", "go"],
  },
  {
    name: "agent-sessions",
    description:
      "Interactive terminal session manager for Claude Code, browse, search, preview, delete, and resume conversations.",
    language: "TypeScript",
    stars: 1,
    url: "https://github.com/vineethkrishnan/agent-sessions",
    topics: ["cli", "claude-code", "terminal"],
  },
  {
    name: "mcp-pool",
    description:
      "Curated collection of MCP servers for popular SaaS platforms, Stripe, Sentry, Notion, Linear, Datadog, Vercel, PagerDuty, HubSpot, Intercom, Shopify.",
    language: "TypeScript",
    stars: 1,
    url: "https://github.com/vineethkrishnan/mcp-pool",
    topics: ["ai", "claude", "mcp", "model-context-protocol", "typescript"],
  },
  {
    name: "docling-server",
    description:
      "Production-ready Docling deployment with Docker Compose. FastAPI + Celery + Redis + Nginx + Let's Encrypt. One-command setup for self-hosted document processing.",
    language: "Python",
    stars: 0,
    url: "https://github.com/vineethkrishnan/docling-server",
    topics: ["celery", "docker", "document-processing", "fastapi", "python"],
  },
  {
    name: "ipwhoami",
    description:
      "IP geolocation lookup from your terminal. Query multiple providers, compare results side-by-side. Cross-platform (Bash + PowerShell).",
    language: "JavaScript",
    stars: 1,
    url: "https://github.com/vineethkrishnan/ipwhoami",
    topics: ["cli", "geolocation", "ip", "terminal"],
  },
  {
    name: "dfree",
    description:
      "Cross-platform disk cleanup CLI for developers. Safely analyze usage and clean system caches, Docker artifacts, and logs with interactive safeguards.",
    language: "Shell",
    stars: 1,
    url: "https://github.com/vineethkrishnan/dfree",
    topics: ["cli", "cross-platform", "developer-tools", "disk-cleanup"],
  },
  {
    name: "medix",
    description:
      "Lightweight CLI tool for converting media files with interactive configuration and progress display.",
    language: "Python",
    stars: 1,
    url: "https://github.com/vineethkrishnan/medix",
    topics: ["cli", "media", "converter", "python"],
  },
  {
    name: "jquery.verticalScroll.js",
    description:
      "Lightweight jQuery plugin for smooth full-page vertical scrolling, 13 pagination themes, 16 animations, keyboard/touch/mouse navigation, ARIA accessibility.",
    language: "JavaScript",
    stars: 0,
    url: "https://github.com/vineethkrishnan/jquery.verticalScroll.js",
    topics: ["jquery", "plugin", "scroll", "ui", "animations"],
  },
  {
    name: "laravel-kit-with-oauth",
    description:
      "Laravel starter kit bundled with hybrid auth for quick project bootstrapping.",
    language: "PHP",
    stars: 3,
    url: "https://github.com/vineethkrishnan/laravel-kit-with-oauth",
    topics: ["authentication", "laravel", "oauth", "php"],
  },
];

export const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  Rust: "#dea584",
  Go: "#00add8",
  Python: "#3572a5",
  JavaScript: "#f1e05a",
  PHP: "#4f5d95",
  Shell: "#89e051",
  Java: "#b07219",
  Ruby: "#701516",
};
