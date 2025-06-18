"use client"

import { BarChart3, Cloud, Home, Map, HelpCircle, Database, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export function TopNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/maps", label: "Maps", icon: Map },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/data-export", label: "Data Export", icon: Database },
    { href: "/about", label: "About Us", icon: Users },
    { href: "/help", label: "Help & Support", icon: HelpCircle },
  ]

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <Cloud className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">RainInsight</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 flex-1">
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

        {/* Theme Toggle */}
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
