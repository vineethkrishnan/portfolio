#!/usr/bin/env node
// Syndicates blog posts from src/content/blog/*.mdx to dev.to and Hashnode.
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
const HASHNODE_PAT = process.env.HASHNODE_PAT || '';
const HASHNODE_PUBLICATION_HOST = process.env.HASHNODE_PUBLICATION_HOST || '';

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

function hashnodeTags(tags) {
  return tags.slice(0, 5).map((tag) => ({
    slug: tag.toLowerCase().trim(),
    name: tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));
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
    console.log(`  [dry-run] dev.to ${existingId ? 'update' : 'create'} — tags=${payload.article.tags.join(',')}`);
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
      console.log(`    dev.to 429 — waiting ${retryAfter}s (attempt ${attempt}/3)`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    throw new Error(`dev.to ${method} failed (${response.status}): ${text}`);
  }
  throw new Error('dev.to upsert exhausted retries');
}

// ---------------------------------------------------------------------------
// Hashnode
// ---------------------------------------------------------------------------

async function hashnodeGraphQL(query, variables) {
  const response = await fetch('https://gql.hashnode.com/', {
    method: 'POST',
    headers: {
      Authorization: HASHNODE_PAT,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) {
    throw new Error(`Hashnode GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function hashnodeResolvePublicationId() {
  const query = `query Publication($host: String!) { publication(host: $host) { id } }`;
  const data = await hashnodeGraphQL(query, { host: HASHNODE_PUBLICATION_HOST });
  if (!data?.publication?.id) {
    throw new Error(`Could not resolve Hashnode publication for host ${HASHNODE_PUBLICATION_HOST}`);
  }
  return data.publication.id;
}

// ---------------------------------------------------------------------------
// Reconciliation — match already-published posts on each platform by canonical URL
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

async function fetchHashnodePosts(publicationId) {
  const query = `query PublicationPosts($id: ObjectId!) {
    publication(id: $id) {
      posts(first: 50) {
        edges { node { id title url slug } }
      }
    }
  }`;
  const data = await hashnodeGraphQL(query, { id: publicationId });
  return (data?.publication?.posts?.edges ?? []).map((edge) => edge.node);
}

function slugFromCanonical(canonicalUrl) {
  const match = canonicalUrl.match(/\/blog\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

async function hashnodeUpsert({ existingId, publicationId, title, bodyMarkdown, canonicalUrl, heroImage, tags }) {
  const tagInputs = hashnodeTags(tags);

  if (DRY_RUN) {
    console.log(`  [dry-run] hashnode ${existingId ? 'update' : 'publish'} — tags=${tagInputs.map((tag) => tag.slug).join(',')}`);
    return { id: existingId ?? 'dry-run', url: 'https://dry-run.example/hashnode' };
  }

  if (existingId) {
    const mutation = `mutation UpdatePost($input: UpdatePostInput!) {
      updatePost(input: $input) { post { id slug url } }
    }`;
    const input = {
      id: existingId,
      title,
      contentMarkdown: bodyMarkdown,
      tags: tagInputs,
      originalArticleURL: canonicalUrl,
      ...(heroImage ? { coverImageOptions: { coverImageURL: heroImage } } : {}),
    };
    const data = await hashnodeGraphQL(mutation, { input });
    const post = data.updatePost.post;
    return { id: post.id, url: post.url };
  }

  const mutation = `mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) { post { id slug url } }
  }`;
  const input = {
    title,
    contentMarkdown: bodyMarkdown,
    publicationId,
    tags: tagInputs,
    originalArticleURL: canonicalUrl,
    ...(heroImage ? { coverImageOptions: { coverImageURL: heroImage } } : {}),
  };
  const data = await hashnodeGraphQL(mutation, { input });
  const post = data.publishPost.post;
  return { id: post.id, url: post.url };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!DEVTO_API_KEY) throw new Error('DEVTO_API_KEY missing');
  if (!HASHNODE_PAT) throw new Error('HASHNODE_PAT missing');
  if (!HASHNODE_PUBLICATION_HOST) throw new Error('HASHNODE_PUBLICATION_HOST missing');

  const state = existsSync(STATE_FILE) ? JSON.parse(await readFile(STATE_FILE, 'utf8')) : { posts: {} };
  if (!state.posts) state.posts = {};

  const posts = await resolvePostsToProcess();
  if (posts.length === 0) {
    console.log('No blog posts to process.');
    return;
  }

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${BACKFILL ? ' (backfill)' : ''}`);
  console.log(`Posts to evaluate: ${posts.length}`);

  const publicationId = await hashnodeResolvePublicationId();

  // Reconcile state with what's already on each platform, matched by the
  // portfolio canonical URL. Prevents duplicate creation when a prior run
  // published posts but crashed before committing state back.
  if (!DRY_RUN) {
    const devtoExisting = await fetchDevtoArticles();
    const hashnodeExisting = await fetchHashnodePosts(publicationId);
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
    for (const post of hashnodeExisting) {
      const slug = post.slug;
      if (!slug || !state.posts[slug]) continue;
      const entry = state.posts[slug];
      if (!entry.hashnode) {
        entry.hashnode = { id: post.id, url: post.url };
        reconciled += 1;
      }
    }
    if (reconciled > 0) {
      console.log(`Reconciled ${reconciled} existing platform entries into state.`);
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

    const hashnode = await hashnodeUpsert({
      existingId: prior.hashnode?.id,
      publicationId,
      title: frontmatter.title,
      bodyMarkdown,
      canonicalUrl,
      heroImage,
      tags,
    });
    console.log(`    hashnode -> ${hashnode.url}`);

    if (!DRY_RUN) {
      state.posts[slug] = {
        title: frontmatter.title,
        hash,
        devto: { id: devto.id, url: devto.url },
        hashnode: { id: hashnode.id, url: hashnode.url },
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
