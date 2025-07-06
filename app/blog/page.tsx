import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Helper to get all markdown files in uploads/posts
async function getMarkdownPosts() {
  const postsDir = path.join(process.cwd(), "uploads", "posts")
  let files: string[] = []
  try {
    files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md") || f.endsWith(".markdown"))
  } catch {
    // Directory may not exist yet
  }
  return files.map(filename => {
    const slug = filename.replace(/\.(md|markdown)$/, "")
    const filePath = path.join(postsDir, filename)
    const raw = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(raw)
    // Use first paragraph as excerpt if not in frontmatter
    const excerpt = data.excerpt || content.split(/\n\s*\n/)[0]
    return {
      slug,
      title: data.title || slug.replace(/-/g, " "),
      date: data.date || null,
      tags: data.tags || [],
      excerpt,
      image: data.image || null,
    }
  })
}

export default async function BlogPage() {
  const markdownPosts = await getMarkdownPosts()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-2">Insights and stories from the Water & Climate Lab</p>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Tiling grid layout for blog posts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Case Study as first blog post */}
          <Link href="/blog/saurashtra-floods-2025" className="group block">
            <div className="rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow bg-white min-w-[340px]">
              <div className="relative h-64 bg-gray-100">
                <Image
                  src="/Rainfall_map.jpg"
                  alt="Saurashtra Floods 2025"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                  Saurashtra Submerged: A Wake-Up Call from the June 2025 Floods
                </h2>
              </div>
            </div>
          </Link>
          {/* Dynamically list markdown blog posts */}
          {markdownPosts.map((post, index) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <div className="rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow bg-white min-w-[340px]">
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={post.image || `/placeholder-${(index % 5) + 1}.jpg`}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                    {post.title}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
} 