"use client"

import { MapContainer, GeoJSON, CircleMarker, Tooltip } from "react-leaflet"
import { useTheme } from "@/components/theme-provider"
import { colorFor, fmt, FILLING, normalize } from "@/lib/rain"
import { BaseLayers } from "./choropleth-map"

type Props = {
  points: any // Reservoir_ID_Location.geojson
  boundary: any
  rows: Map<string, any> // lower-case scheme name -> record
  selected: string | null
  onSelect: (name: string) => void
}

export default function ReservoirMap({ points, boundary, rows, selected, onSelect }: Props) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  return (
    <MapContainer center={[22.4, 71.6]} zoom={7} zoomSnap={0.25} minZoom={6} scrollWheelZoom={false} className="h-full w-full">
      <BaseLayers dark={dark} />
      {boundary && (
        <GeoJSON
          key={dark ? "bd" : "bl"}
          data={boundary}
          interactive={false}
          style={{ color: dark ? "#3a3a3a" : "#c9c9c9", weight: 0.5, fillOpacity: 0 }}
        />
      )}
      {points.features.map((f: any) => {
        const name: string = f.properties["Name of Sc"]
        const [lng, lat] = f.geometry?.coordinates ?? []
        if (!name || lat == null) return null
        const row = rows.get(normalize(name))
        const pct = row ? Number(row.PercentageFilling) : null
        const isSel = selected != null && normalize(selected) === normalize(name)
        return (
          <CircleMarker
            key={name}
            center={[lat, lng]}
            radius={isSel ? 9 : 6}
            pathOptions={{
              fillColor: row ? colorFor(pct, FILLING.thresholds, dark, true) : dark ? "#444" : "#ddd",
              fillOpacity: 1,
              color: isSel ? (dark ? "#fff" : "#0b0b0b") : dark ? "#121212" : "#ffffff",
              weight: isSel ? 2.5 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(name) }}
          >
            <Tooltip direction="top" offset={[0, -6]} className="map-tooltip">
              <div className="font-medium">{name}</div>
              <div>{row ? `${fmt(pct, 1)}% full` : "No data"}</div>
              {row?.Warning && row.Warning !== "NIL" && <div className="font-medium">{row.Warning}</div>}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
