"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/1q8KX7jqpW4T9hdX-2OUDt7Pkk5eYOYNVbbCzIP7mDA8/values/Sheet1?key=${process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY}`

function parseSheetData(values: string[][]) {
  if (!values || values.length < 2) return []
  const headers = values[0].map((h) => h.trim().toLowerCase())
  return values
    .slice(1)
    .filter((row) => row.length > 0 && row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const obj: Record<string, string> = {}
      headers.forEach((header, i) => {
        obj[header] = row[i] || ""
      })
      return obj
    })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Array<Record<string, string>>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Saurashtra Floods blog post (internal)
  const saurashtraFloodsPost = {
    title: "Saurashtra Submerged: A Wake-Up Call from the June 2025 Floods",
    "image source": "/Rainfall_map.jpg",
    "link to source": "/blog/saurashtra-floods-2025",
    internal: true,
  }

  useEffect(() => {
    fetch(SHEET_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch blog posts")
        return res.json()
      })
      .then((data) => {
        setPosts(parseSheetData(data.values))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-foreground text-left">Blog</h1>
          <p className="text-muted-foreground mt-2 text-left">Insights and stories from the Water & Climate Lab</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive">Error: {error}</p>
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-56 rounded-t-lg" />
                <div className="bg-card p-6 rounded-b-lg">
                  <div className="h-5 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Internal Saurashtra Floods Post */}
            <Link href={saurashtraFloodsPost["link to source"]} className="group">
              <div className="bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-border">
                <div className="relative h-56">
                  <Image
                    src={saurashtraFloodsPost["image source"] || "/placeholder.svg"}
                    alt={saurashtraFloodsPost.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-center">
                    {saurashtraFloodsPost.title}
                  </h3>
                </div>
              </div>
            </Link>
            {/* External Posts from Google Sheets */}
            {posts
              .filter((post) => post["title"] && post["image source"] && post["link to source"])
              .map((post: Record<string, string>, idx: number) => (
                <a key={idx} href={post["link to source"]} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-border">
                    <div className="relative h-56">
                      <Image
                        src={post["image source"] || "/placeholder.svg?height=200&width=400"}
                        alt={post["title"]}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-3 right-3">
                        <div className="bg-card/90 backdrop-blur-sm rounded-full p-2 border border-border">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-center">
                        {post["title"]}
                      </h3>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        )}
        {posts.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No blog posts found.</p>
          </div>
        )}
      </main>
    </div>
  )
}
