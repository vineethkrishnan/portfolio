import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { toSearchText } from "../../lib/search-text";

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const documents = posts.map((post) => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    tags: post.data.tags,
    date: post.data.pubDate.toISOString(),
    url: `/blog/${post.id}`,
    body: toSearchText(post.body ?? ""),
  }));

  return new Response(JSON.stringify(documents), {
    headers: { "Content-Type": "application/json" },
  });
};
