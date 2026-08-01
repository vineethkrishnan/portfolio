// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * @typedef {{ type: string, tagName?: string, value?: string,
 *   properties?: Record<string, any>, children?: HastNode[] }} HastNode
 */

/** @param {HastNode} node @returns {string} */
function collectText(node) {
  if (node.type === 'text') return node.value ?? '';
  if (!Array.isArray(node.children)) return '';
  return node.children.map(collectText).join('');
}

/** @param {HastNode} node @param {string} name */
function addClass(node, name) {
  node.properties = node.properties || {};
  const existing = node.properties.className;
  node.properties.className = Array.isArray(existing) ? [...existing, name] : [name];
}

/**
 * Opt in from markdown with the image title: ![alt](/blog/x.png "inset").
 * The title is dropped so it never surfaces as a hover tooltip.
 */
function rehypeInsetImages() {
  /** @param {HastNode} tree */
  return (tree) => {
    /** @param {HastNode} node */
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'p') {
        const inset = (node.children || []).find(
          (child) =>
            child.type === 'element' &&
            child.tagName === 'img' &&
            child.properties?.title === 'inset'
        );
        if (inset?.properties) {
          delete inset.properties.title;
          addClass(node, 'inset-figure');
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * The TL;DR blockquote restates the frontmatter description, so it reads as
 * filler on the page. Tagging it here keeps it in the markup for feeds and
 * cross-posts while the stylesheet takes it out of the visual flow.
 */
function rehypeTagTldr() {
  /** @param {HastNode} node */
  const isCandidate = (node) =>
    node.type === 'element' && (node.tagName === 'blockquote' || node.tagName === 'p');

  /** @param {HastNode} tree */
  return (tree) => {
    /** @param {HastNode} node */
    const walk = (node) => {
      if (isCandidate(node) && /^\s*TL;DR/i.test(collectText(node))) {
        addClass(node, 'tldr');
        return;
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://vineethnk.in',
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeTagTldr, rehypeInsetImages],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});