"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/1q8KX7jqpW4T9hdX-2OUDt7Pkk5eYOYNVbbCzIP7mDA8/values/Sheet1?key=${process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY}`

type Post = {
  title: string
  image: string
  href: string
  summary?: string
  date?: string
  external: boolean
}

// Posts that live in this repo
const internalPosts: Post[] = [
  {
    title: "Saurashtra Submerged: A Wake-Up Call from the June 2025 Floods",
    summary:
      "Over 300 mm of rain in 48 hours across Botad, Amreli and Bhavnagar — what rainfall, SAR imagery and Shetrunji dam data show about the event.",
    image: "/Rainfall_map.jpg",
    href: "/blog/saurashtra-floods-2025",
    date: "June 2025",
    external: false,
  },
]

// Sheet columns: title, image source, link to source, (optional) summary, date
function parseSheetData(values: string[][]): Post[] {
  if (!values || values.length < 2) return []
  const headers = values[0].map((h) => h.trim().toLowerCase())
  return values
    .slice(1)
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, (row[i] || "").trim()])))
    .filter((r) => r["title"] && r["link to source"])
    .map((r) => ({
      title: r["title"],
      image: r["image source"],
      href: r["link to source"],
      summary: r["summary"] || r["description"],
      date: r["date"],
      external: true,
    }))
}

function PostRow({ post }: { post: Post }) {
  const inner = (
    <article className="group flex gap-4 py-6 sm:gap-6">
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-36">
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-medium leading-snug group-hover:text-primary">
          {post.title}
          {post.external && <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 text-muted-foreground" />}
        </h2>
        {post.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.summary}</p>}
        {post.date && <p className="mt-2 text-xs text-muted-foreground">{post.date}</p>}
      </div>
    </article>
  )
  return post.external ? (
    <a href={post.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link href={post.href}>{inner}</Link>
  )
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(SHEET_API_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setPosts(parseSheetData(data.values)))
      .catch((err) => console.warn("Blog sheet unavailable:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">Notes and case studies from the Water & Climate Lab.</p>

      <div className="mt-6 divide-y border-y">
        {[...internalPosts, ...posts].map((post) => (
          <PostRow key={post.href} post={post} />
        ))}
        {loading &&
          [0, 1].map((i) => (
            <div key={i} className="flex animate-pulse gap-6 py-6">
              <div className="h-24 w-36 rounded-md bg-muted" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
