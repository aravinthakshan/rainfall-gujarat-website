import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Mock data - in a real app, this would come from a database
const posts = [
  {
    id: 1,
    title: "Understanding Machine Learning Fundamentals",
    excerpt:
      "A comprehensive overview of machine learning concepts and their practical applications in modern research.",
    date: "2024-01-15",
    tags: ["Machine Learning", "Research", "AI"],
    slug: "understanding-ml-fundamentals",
  },
  {
    id: 2,
    title: "Data Analysis Techniques for Researchers",
    excerpt: "Exploring various statistical methods and tools for effective data analysis in academic research.",
    date: "2024-01-10",
    tags: ["Data Analysis", "Statistics", "Research Methods"],
    slug: "data-analysis-techniques",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-light text-gray-900">Research Blog</h1>
          <p className="text-gray-600 mt-2">Insights and findings from academic research</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-medium text-gray-900 hover:text-gray-700">
                    <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                  <time className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
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
