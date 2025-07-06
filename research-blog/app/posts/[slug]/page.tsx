import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Mock data - in a real app, this would come from a database or file system
const getPost = (slug: string) => {
  const posts = {
    "understanding-ml-fundamentals": {
      title: "Understanding Machine Learning Fundamentals",
      content: `# Understanding Machine Learning Fundamentals

Machine learning has become an integral part of modern research and technology. This comprehensive guide explores the fundamental concepts that every researcher should understand.

## What is Machine Learning?

Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every scenario.

## Key Concepts

### Supervised Learning
- Uses labeled training data
- Predicts outcomes for new data
- Examples: Classification, Regression

### Unsupervised Learning  
- Finds patterns in unlabeled data
- Discovers hidden structures
- Examples: Clustering, Dimensionality Reduction

### Reinforcement Learning
- Learns through interaction with environment
- Maximizes cumulative reward
- Examples: Game playing, Robotics

## Applications in Research

Machine learning techniques are being applied across various research domains:

1. **Healthcare**: Disease diagnosis, drug discovery
2. **Climate Science**: Weather prediction, climate modeling  
3. **Social Sciences**: Behavior analysis, trend prediction
4. **Physics**: Particle detection, astronomical observations

## Conclusion

Understanding these fundamentals provides a solid foundation for applying machine learning techniques in your research domain.`,
      date: "2024-01-15",
      tags: ["Machine Learning", "Research", "AI"],
    },
  }

  return posts[slug as keyof typeof posts] || null
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-foreground mb-4">Post not found</h1>
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to posts
          </Link>
          <h1 className="text-3xl font-light text-foreground">{post.title}</h1>
          <div className="flex items-center gap-4 mt-4">
            <time className="text-muted-foreground">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <div className="flex gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <Card className="border-border">
          <CardContent className="p-8">
            <div className="prose prose-foreground max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br>") }} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
