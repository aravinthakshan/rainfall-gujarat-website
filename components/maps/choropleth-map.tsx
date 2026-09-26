"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, GeoJSON, Pane } from "react-leaflet"
import type { GeoJSON as LeafletGeoJSON, Layer, PathOptions } from "leaflet"
import { useTheme } from "@/components/theme-provider"
import { colorFor, fmt, talukaKey, titleCase } from "@/lib/rain"
import ClickToInteract from "./click-to-interact"

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas"
// Keyless grey basemaps; labels come as a separate layer drawn above the data.
export const TILES = {
  light: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
  dark: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
}
export const LABELS = {
  light: `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  dark: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
}
export const TILE_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"

export function BaseLayers({ dark }: { dark: boolean }) {
  return (
    <>
      <TileLayer key={dark ? "d" : "l"} url={dark ? TILES.dark : TILES.light} attribution={TILE_ATTRIBUTION} maxZoom={16} />
      <Pane name="labels" style={{ zIndex: 450, pointerEvents: "none" }}>
        <TileLayer key={dark ? "ld" : "ll"} url={dark ? LABELS.dark : LABELS.light} maxZoom={16} />
      </Pane>
    </>
  )
}

type Props = {
  geojson: any
  values: Map<string, number>
  thresholds: number[]
  unit: string
  selected: string | null
  onSelect: (key: string) => void
}

export default function ChoroplethMap({ geojson, values, thresholds, unit, selected, onSelect }: Props) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const layerRef = useRef<LeafletGeoJSON | null>(null)

  const style = useMemo(
    () =>
      (feature: any): PathOptions => {
        const key = talukaKey(feature.properties)
        const isSel = key === selected
        return {
          fillColor: colorFor(values.get(key), thresholds, dark),
          fillOpacity: values.has(key) ? 0.9 : 0,
          color: isSel ? (dark ? "#ffffff" : "#0b0b0b") : dark ? "#5a5a5a" : "#9a9a9a",
          weight: isSel ? 2.5 : 0.6,
        }
      },
    [values, thresholds, selected, dark],
  )

  const styleRef = useRef(style)
  styleRef.current = style

  // Restyle + refresh tooltips in place instead of re-mounting the layer
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.setStyle(style as any)
    layer.eachLayer((l: any) => {
      const key = talukaKey(l.feature.properties)
      l.setTooltipContent(tooltip(l.feature.properties.Tehsil_new, values.get(key), unit))
      if (key === selected) l.bringToFront()
    })
  }, [style, values, unit, selected])

  return (
    <MapContainer
      center={[22.4, 71.6]}
      zoom={7}
      zoomSnap={0.25}
      minZoom={6}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <BaseLayers dark={dark} />
      <ClickToInteract />
      <GeoJSON
        ref={layerRef as any}
        data={geojson}
        style={style as any}
        onEachFeature={(feature: any, layer: Layer) => {
          const key = talukaKey(feature.properties)
          layer.bindTooltip(tooltip(feature.properties.Tehsil_new, values.get(key), unit), {
            sticky: true,
            className: "map-tooltip",
          })
          layer.on({
            click: () => onSelect(key),
            mouseover: (e: any) => e.target.setStyle({ weight: 2 }),
            // not resetStyle(): that restores the style from mount time
            mouseout: (e: any) => e.target.setStyle(styleRef.current(e.target.feature)),
          })
        }}
      />
    </MapContainer>
  )
}

function tooltip(name: string, value: number | undefined, unit: string) {
  return `<div class="font-medium">${titleCase(name || "")}</div><div>${
    value == null ? "No data" : `${fmt(value, 1)} ${unit}`
  }</div>`
}
