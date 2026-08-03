import rss from "@astrojs/rss";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";
import { getCollection } from "astro:content";
import createSlug from "../lib/createSlug";
import { standalonePosts } from "../lib/standalonePosts";

export async function GET(context) {
  const blog = await getCollection("blog");

  // Merge the Markdown collection with the standalone .astro posts (shared with the
  // blog index via lib/standalonePosts) so the feed mirrors what /blog shows.
  const items = [
    ...blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${createSlug(post.data.title, post.slug)}/`,
    })),
    ...standalonePosts.map((post) => ({
      title: post.title,
      pubDate: post.pubDate,
      description: post.desc,
      link: post.url,
    })),
  ];
  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
