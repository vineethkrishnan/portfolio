import { getCollection } from "astro:content";

export async function GET(context) {
  const site = context.site?.toString() ?? "https://vineethnk.in/";
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Vineeth N K — Blog",
    home_page_url: site,
    feed_url: new URL("/feed.json", site).toString(),
    description: "Writing code, building tools, and sharing what I learn along the way.",
    language: "en",
    authors: [
      {
        name: "Vineeth N K",
        url: site,
      },
    ],
    items: posts.map((post) => {
      const url = new URL(`/blog/${post.id}/`, site).toString();
      const item = {
        id: url,
        url,
        title: post.data.title,
        summary: post.data.description,
        content_text: post.data.description,
        date_published: post.data.pubDate.toISOString(),
        tags: post.data.tags,
      };
      if (post.data.updatedDate) {
        item.date_modified = post.data.updatedDate.toISOString();
      }
      if (post.data.heroImage) {
        item.image = new URL(post.data.heroImage, site).toString();
      }
      return item;
    }),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
