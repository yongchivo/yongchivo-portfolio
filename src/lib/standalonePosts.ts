// Blog entries that live as their own .astro pages under
// src/pages/phv-prep-uk/blog/, outside the Markdown blog content collection.
//
// Single source of truth: consumed by BOTH the blog index (/blog) and the RSS
// feed (/rss.xml), so the two never drift. Keep pubDate accurate — entries are
// merged with the collection and sorted newest first in each consumer.

export interface StandalonePost {
  title: string;
  /** Card thumbnail for the blog index (unused by RSS). */
  img: string;
  desc: string;
  /** Absolute site path, with trailing slash. */
  url: string;
  badge?: string;
  pubDate: Date;
}

export const standalonePosts: StandalonePost[] = [
  {
    title:
      "The PHV Prep UK Android Test Is Underway — Launch Expected 18 August",
    img: "/images/closed-testing-underway.png",
    desc: "PHV Prep UK has started its 14-day Google Play closed test. If all goes well, the Android version launches on 18 August 2026.",
    url: "/phv-prep-uk/blog/closed-testing-underway/",
    badge: "ANDROID BETA",
    pubDate: new Date("2026-08-06"),
  },
  {
    title: "PHV Prep UK Android Is Ready — And We Need 12 Testers",
    img: "/images/android-beta-testers.png",
    desc: "The Android version of PHV Prep UK is finished. We need 12 testers to unlock the Play Store launch — join the beta and get free full access.",
    url: "/phv-prep-uk/blog/android-ready/",
    badge: "ANDROID BETA",
    pubDate: new Date("2026-07-31"),
  },
  {
    title: "Join the PHV Prep UK Android Beta — Test It Now",
    img: "/images/join-android-beta.png",
    desc: "PHV Prep UK is in closed beta on Android. Join the tester group, opt in, and install it from the Play Store.",
    url: "/phv-prep-uk/blog/join-android-beta/",
    badge: "ANDROID BETA",
    pubDate: new Date("2026-07-17"),
  },
  {
    title: "We Made a Promo Video for PHV Prep UK",
    img: "/images/promo-video-announcement.png",
    desc: "Check out our new promotional video for PHV Prep UK — the exam prep app for the Wolverhampton private hire test.",
    url: "/phv-prep-uk/blog/promo-video/",
    pubDate: new Date("2026-07-17"),
  },
  {
    title: "Help Us Test PHV Prep UK on Android — Be a Beta Tester",
    img: "/images/android-beta-testers.png",
    desc: "PHV Prep UK is coming to Android. We need 12 beta testers before we can launch on the Play Store. Join now — it's free.",
    url: "/phv-prep-uk/blog/android-beta-testers/",
    badge: "ANDROID BETA",
    pubDate: new Date("2026-07-10"),
  },
];
