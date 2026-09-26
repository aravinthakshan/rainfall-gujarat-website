// Blog posts listed on /blog, newest first.
//
// To add a post:
//   - Written on this site: create app/blog/<slug>/page.tsx, then add an entry
//     here with href "/blog/<slug>".
//   - Hosted elsewhere (Medium, news article, paper…): add an entry with the
//     full URL as href. It opens in a new tab.
// Images go in /public (use "/my-image.jpg") or can be a full https URL.

export type Post = {
  title: string
  href: string
  image?: string
  summary?: string
  date?: string // shown as written, e.g. "June 2025"
}

export const posts: Post[] = [
  {
    title: "Saurashtra Submerged: A Wake-Up Call from the June 2025 Floods",
    href: "/blog/saurashtra-floods-2025",
    image: "/Rainfall_map.jpg",
    summary:
      "Over 300 mm of rain in 48 hours across Botad, Amreli and Bhavnagar — what rainfall, SAR imagery and Shetrunji dam data show about the event.",
    date: "June 2025",
  },
]
