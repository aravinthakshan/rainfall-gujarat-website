"use client"

import { useEffect, useState } from "react"
import { useMap } from "react-leaflet"

// Scroll-wheel / trackpad-pinch zoom (and one-finger panning on touch
// screens) only while the map is "active", so the page scrolls normally past
// it. The map activates on click/tap and deactivates when the pointer leaves
// or the user taps elsewhere. Two-finger pinch on phones always works.
export default function ClickToInteract() {
  const map = useMap()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const touch = window.matchMedia("(pointer: coarse)").matches
    const container = map.getContainer()

    const activate = () => {
      map.scrollWheelZoom.enable()
      map.dragging.enable()
      setActive(true)
    }
    const deactivate = () => {
      map.scrollWheelZoom.disable()
      if (touch) map.dragging.disable()
      setActive(false)
    }
    deactivate()

    const onOutside = (e: Event) => {
      if (!container.contains(e.target as Node)) deactivate()
    }

    map.on("click", activate)
    map.on("focus", activate)
    container.addEventListener("mouseleave", deactivate)
    document.addEventListener("touchstart", onOutside, { passive: true })
    document.addEventListener("mousedown", onOutside)
    return () => {
      map.off("click", activate)
      map.off("focus", activate)
      container.removeEventListener("mouseleave", deactivate)
      document.removeEventListener("touchstart", onOutside)
      document.removeEventListener("mousedown", onOutside)
    }
  }, [map])

  return (
    <div
      className={`pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md border bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur transition-opacity duration-300 ${
        active ? "opacity-0" : "opacity-100"
      }`}
    >
      Click map to zoom and pan
    </div>
  )
}
