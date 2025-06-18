"use client"

import { ModeToggle } from "@/components/mode-toggle"

export function DashboardHeader() {
  return (
    <div className="border-b w-full">
      <div className="flex h-16 items-center justify-end px-4 w-full">
        <ModeToggle />
      </div>
    </div>
  )
}
