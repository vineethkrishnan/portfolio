#!/usr/bin/env node
// Syndicates blog posts from src/content/blog/*.mdx to dev.to.
// Idempotent: tracks state in .syndication.json, skips unchanged posts.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const BLOG_DIR = 'src/content/blog';
const STATE_FILE = '.syndication.json';
const SITE_URL = (process.env.SITE_URL || 'https://vineethnk.in').replace(/\/$/, '');
const DRY_RUN = process.env.DRY_RUN === 'true';
const BACKFILL = process.env.BACKFILL === 'true';
const SLUG = process.env.SLUG || '';

const DEVTO_API_KEY = process.env.DEVTO_API_KEY || '';

// ---------------------------------------------------------------------------
// Frontmatter parser (handles the fixed schema used by src/content.config.ts)
// ---------------------------------------------------------------------------

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter block found');
  const [, yamlBlock, body] = match;
  const data = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    const pair = line.match(/^([a-zA-Z_][\w]*):\s*(.*)$/);
    if (!pair) continue;
    data[pair[1]] = parseValue(pair[2]);
  }
  return { data, body };
}

function parseValue(raw) {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1);
    return [...inner.matchAll(/"([^"]*)"|'([^']*)'/g)].map((match) => match[1] ?? match[2]);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Content transformation
// ---------------------------------------------------------------------------

function rewriteImages(body) {
  return body.replace(/\]\((\/[^)]+)\)/g, (_, path) => `](${SITE_URL}${path})`);
}

function extractHeroImage(body) {
  const match = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (!match) return null;
  const url = match[1];
  return url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function devtoTags(tags) {
  return tags
    .map((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((tag) => tag.length > 0 && tag.length <= 24)
    .slice(0, 4);
}

function contentHash(parts) {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 16);
}

// ---------------------------------------------------------------------------
// Post discovery
// ---------------------------------------------------------------------------

async function resolvePostsToProcess() {
  if (SLUG) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(SLUG)) {
      throw new Error(`Invalid slug (must be lowercase alphanumeric + hyphens): ${SLUG}`);
    }
    const path = join(BLOG_DIR, `${SLUG}.mdx`);
    if (!existsSync(path)) throw new Error(`Post not found: ${path}`);
    return [path];
  }
  if (BACKFILL) {
    const entries = await readdir(BLOG_DIR);
    return entries.filter((entry) => entry.endsWith('.mdx')).map((entry) => join(BLOG_DIR, entry));
  }
  const before = process.env.GITHUB_EVENT_BEFORE || 'HEAD~1';
  const after = process.env.GITHUB_EVENT_AFTER || 'HEAD';
  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=AM', before, after, '--', `${BLOG_DIR}/`],
      { encoding: 'utf8' },
    );
    return output
      .split('\n')
      .filter((line) => line.endsWith('.mdx'));
  } catch (error) {
    console.warn('Could not compute git diff, falling back to empty set:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// dev.to
// ---------------------------------------------------------------------------

async function devtoUpsert({ existingId, title, description, bodyMarkdown, canonicalUrl, heroImage, tags }) {
  const payload = {
    article: {
      title,
      body_markdown: bodyMarkdown,
      description,
      published: true,
      canonical_url: canonicalUrl,
      tags: devtoTags(tags),
      ...(heroImage ? { main_image: heroImage } : {}),
    },
  };

  if (DRY_RUN) {
    console.log(`  [dry-run] dev.to ${existingId ? 'update' : 'create'} - tags=${payload.article.tags.join(',')}`);
    return { id: existingId ?? 0, url: 'https://dry-run.example/devto' };
  }

  const endpoint = existingId ? `https://dev.to/api/articles/${existingId}` : 'https://dev.to/api/articles';
  const method = existingId ? 'PUT' : 'POST';

  // dev.to's POST rate limit is aggressive (especially for brand-new articles).
  // Retry up to 3 times on 429, honouring Retry-After when provided.
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'api-key': DEVTO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();

    if (response.ok) {
      const json = JSON.parse(text);
      return { id: json.id, url: json.url };
    }

    if (response.status === 429 && attempt < 4) {
      const retryAfter = Number(response.headers.get('retry-after')) || 35;
      console.log(`    dev.to 429 - waiting ${retryAfter}s (attempt ${attempt}/3)`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    throw new Error(`dev.to ${method} failed (${response.status}): ${text}`);
  }
  throw new Error('dev.to upsert exhausted retries');
}

// ---------------------------------------------------------------------------
// Reconciliation - match already-published dev.to articles by canonical URL
// ---------------------------------------------------------------------------

async function fetchDevtoArticles() {
  const articles = [];
  let page = 1;
  while (true) {
    const response = await fetch(`https://dev.to/api/articles/me/all?per_page=50&page=${page}`, {
      headers: { 'api-key': DEVTO_API_KEY, accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`dev.to list failed (${response.status}): ${await response.text()}`);
    const batch = await response.json();
    articles.push(...batch);
    if (batch.length < 50) break;
    page += 1;
  }
  return articles;
}

function slugFromCanonical(canonicalUrl) {
  const match = canonicalUrl.match(/\/blog\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!DEVTO_API_KEY) throw new Error('DEVTO_API_KEY missing');

  const state = existsSync(STATE_FILE) ? JSON.parse(await readFile(STATE_FILE, 'utf8')) : { posts: {} };
  if (!state.posts) state.posts = {};

  const posts = await resolvePostsToProcess();
  if (posts.length === 0) {
    console.log('No blog posts to process.');
    return;
  }

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${BACKFILL ? ' (backfill)' : ''}`);
  console.log(`Posts to evaluate: ${posts.length}`);

  // Reconcile state with what's already on dev.to, matched by the portfolio
  // canonical URL. Prevents duplicate creation when a prior run published
  // posts but crashed before committing state back.
  if (!DRY_RUN) {
    const devtoExisting = await fetchDevtoArticles();
    let reconciled = 0;

    for (const article of devtoExisting) {
      const slug = slugFromCanonical(article.canonical_url ?? '');
      if (!slug) continue;
      const entry = (state.posts[slug] ??= {});
      if (!entry.devto) {
        entry.devto = { id: article.id, url: article.url };
        reconciled += 1;
      }
    }
    if (reconciled > 0) {
      console.log(`Reconciled ${reconciled} existing dev.to entries into state.`);
    }
  }

  let wroteAny = false;
  let firstWrite = true;
  for (const path of posts) {
    const slug = basename(path, '.mdx');
    const source = await readFile(path, 'utf8');
    const { data: frontmatter, body: rawBody } = parseFrontmatter(source);

    if (frontmatter.draft === true) {
      console.log(`- ${slug}: skipped (draft)`);
      continue;
    }

    const canonicalUrl = `${SITE_URL}/blog/${slug}/`;
    const bodyMarkdown = rewriteImages(rawBody).trim();
    const heroImage = extractHeroImage(bodyMarkdown);
    const tags = frontmatter.tags ?? [];
    const hash = contentHash({ title: frontmatter.title, description: frontmatter.description, bodyMarkdown, tags });

    const prior = state.posts[slug] ?? {};
    if (!BACKFILL && prior.hash === hash) {
      console.log(`- ${slug}: unchanged (${hash})`);
      continue;
    }

    // Pace dev.to writes. Creating new articles is rate-limited more aggressively
    // than updating, so we stay conservative and rely on in-request retry for spikes.
    if (!DRY_RUN && !firstWrite) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
    firstWrite = false;

    console.log(`- ${slug}: syndicating`);

    const devto = await devtoUpsert({
      existingId: prior.devto?.id,
      title: frontmatter.title,
      description: frontmatter.description,
      bodyMarkdown,
      canonicalUrl,
      heroImage,
      tags,
    });
    console.log(`    dev.to   -> ${devto.url}`);

    if (!DRY_RUN) {
      state.posts[slug] = {
        title: frontmatter.title,
        hash,
        devto: { id: devto.id, url: devto.url },
        syndicatedAt: new Date().toISOString(),
      };
      state.updatedAt = new Date().toISOString();
      await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
      wroteAny = true;
    }
  }

  if (!DRY_RUN && !wroteAny) {
    state.updatedAt = new Date().toISOString();
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  }
  if (!DRY_RUN) console.log(`State written to ${STATE_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
