"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/maps", label: "Maps" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
]

export function TopNavigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-[2000] border-b bg-background/90 backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/maps" className="shrink-0" aria-label="Water & Climate Lab home">
          <Image
            src="/logo.png"
            alt="Water & Climate Lab, IIT Gandhinagar"
            width={1080}
            height={172}
            priority
            className="h-7 w-auto sm:h-8 dark:brightness-0 dark:invert"
          />
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          <nav className="flex items-center">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-2.5 py-4 text-sm transition-colors sm:px-3",
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-primary sm:inset-x-3" />}
                </Link>
              )
            })}
          </nav>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
