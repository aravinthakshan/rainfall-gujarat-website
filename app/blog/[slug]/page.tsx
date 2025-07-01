import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { marked } from "marked"
import Image from "next/image"
import React from "react"
import { notFound } from "next/navigation"

// Custom renderer to support images from /uploads/posts/images
const renderer = new marked.Renderer()
renderer.image = ({ href, title, text }: { href?: string; title?: string | null; text?: string }) => {
  // If the image path is relative, serve from /uploads/posts/images
  let src = href || ""
  if (!src.startsWith("http") && !src.startsWith("/")) {
    src = `/uploads/posts/images/${src}`
  }
  return `<img src="${src}" alt="${text || ""}" title="${title || ""}" style="max-width:100%;height:auto;border-radius:8px;margin:1em 0;" />`
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const filePathMd = path.join(process.cwd(), "uploads", "posts", `${slug}.md`)
  const filePathMarkdown = path.join(process.cwd(), "uploads", "posts", `${slug}.markdown`)
  let fileContent = null
  if (fs.existsSync(filePathMd)) {
    fileContent = fs.readFileSync(filePathMd, "utf8")
  } else if (fs.existsSync(filePathMarkdown)) {
    fileContent = fs.readFileSync(filePathMarkdown, "utf8")
  }
  if (!fileContent) {
    return notFound()
  }
  const { content, data } = matter(fileContent)
  const html = marked(content, { renderer })
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">{data.title || slug.replace(/-/g, " ")}</h1>
      {data.author && <div className="mb-2 text-sm text-gray-500">By {data.author}</div>}
      {data.date && <div className="mb-6 text-xs text-gray-400">{data.date}</div>}
      {/* Render markdown HTML safely */}
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
} 