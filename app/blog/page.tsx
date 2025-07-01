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
    }
  })
}

export default async function BlogPage() {
  const markdownPosts = await getMarkdownPosts()
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-light text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-2">Insights and stories from the Water & Climate Lab</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Case Study as first blog post */}
          <Card className="border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-medium text-gray-900 hover:text-gray-700">
                  <Link href="/blog/saurashtra-floods-2025">
                    Saurashtra Submerged: A Wake-Up Call from the June 2025 Floods
                  </Link>
                </CardTitle>
                <time className="text-sm text-gray-500 whitespace-nowrap ml-4">
                  June 17, 2025
                </time>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 w-full md:w-64 h-40 relative">
                  <Image
                    src="/Rainfall_map.jpg"
                    alt="Saurashtra Floods 2025"
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <p className="text-gray-600 mb-4">
                    A detailed case study of the devastating June 2025 floods in Saurashtra, Gujarat, with maps, rainfall data, and satellite imagery.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Floods</Badge>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Case Study</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Dynamically list markdown blog posts */}
          {markdownPosts.map(post => (
            <Card key={post.slug} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-medium text-gray-900 hover:text-gray-700">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                  {post.date && (
                    <time className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(post.tags) && post.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
} 