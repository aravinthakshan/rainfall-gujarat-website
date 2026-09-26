import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { posts, type Post } from "@/content/posts"

export const metadata = { title: "Blog · Gujarat Monsoon Monitor" }

function PostRow({ post }: { post: Post }) {
  const external = /^https?:\/\//.test(post.href)
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
          {external && <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 text-muted-foreground" />}
        </h2>
        {post.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.summary}</p>}
        {post.date && <p className="mt-2 text-xs text-muted-foreground">{post.date}</p>}
      </div>
    </article>
  )
  return external ? (
    <a href={post.href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link href={post.href}>{inner}</Link>
  )
}

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-2 text-muted-foreground">Notes and case studies from the Water & Climate Lab.</p>
      <div className="mt-6 divide-y border-y">
        {posts.map((post) => (
          <PostRow key={post.href} post={post} />
        ))}
      </div>
    </div>
  )
}
