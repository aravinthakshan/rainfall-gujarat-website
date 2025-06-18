"use client"

import { BarChart3, Cloud, Home, Map, HelpCircle, Database, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import Image from "next/image"

export function TopNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { href: "/about", label: "About Us", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/maps", label: "Maps", icon: Map },
    { href: "/help", label: "Help & Support", icon: HelpCircle },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8 justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Image src="/logo.png" alt="Water & Climate Lab Logo" width={160} height={44} priority />
        </div>
        {/* Navigation and Theme Toggle */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  size="sm"
                  asChild
                  className="h-9"
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </nav>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
