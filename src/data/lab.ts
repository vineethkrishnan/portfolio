export interface LabSpec {
  label: string;
  value: string;
}

export interface LabService {
  name: string;
  description: string;
  exposure: "public" | "internal";
}

export const labIntro =
  "Everything I build has to run somewhere, so it runs here. A hand-me-down 2018 Mac mini sitting at home, quietly doing the job I used to hand over to a dozen free SaaS tiers. Password manager, uptime checks, push notifications, workflow automation, and a small army of agents that answer a webhook, all self-hosted, all mine.";

export const labSpecs: LabSpec[] = [
  { label: "Machine", value: "2018 Mac mini" },
  { label: "Memory", value: "8GB RAM" },
  { label: "Storage", value: "128GB SSD" },
  { label: "OS", value: "macOS 15 Sequoia" },
];

export const labStack: string[] = [
  "Docker",
  "Cloudflare Tunnel",
  "Tailscale",
  "Caddy",
  "restic",
  "Backblaze B2",
];

export const labServices: LabService[] = [
  {
    name: "VaultCTL",
    description:
      "My own zero-knowledge credential manager, now with a browser extension for autofill.",
    exposure: "public",
  },
  {
    name: "Vaultwarden",
    description: "Self-hosted, Bitwarden-compatible vault for the everyday logins.",
    exposure: "public",
  },
  {
    name: "Uptime Kuma",
    description: "Status page and uptime checks watching everything else I run.",
    exposure: "public",
  },
  {
    name: "Agent webhook",
    description:
      "Fires Claude Code from a prompt and pushes the result to my phone, 24x7.",
    exposure: "public",
  },
  {
    name: "n8n",
    description: "Workflow automation, kept inside the tailnet where it belongs.",
    exposure: "internal",
  },
  {
    name: "ntfy",
    description: "Push notifications straight to my devices, no third party in the middle.",
    exposure: "internal",
  },
  {
    name: "docling-server",
    description: "Self-hosted document processing on FastAPI, Celery, and Redis.",
    exposure: "internal",
  },
  {
    name: "medix",
    description: "Media converter with a small local web GUI for quick jobs.",
    exposure: "internal",
  },
];
