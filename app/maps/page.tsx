"use client"

import React, { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

// Color bins and thresholds as per reference image
const colorBins = [
  { min: 0, max: 30, color: "#e3eef9" },
  { min: 30, max: 60, color: "#c6dbef" },
  { min: 60, max: 90, color: "#9ecae1" },
  { min: 90, max: 120, color: "#6baed6" },
  { min: 120, max: 150, color: "#4292c6" },
  { min: 150, max: 180, color: "#2171b5" },
  { min: 180, max: 210, color: "#08519c" },
  { min: 210, max: 240, color: "#08306b" },
  { min: 240, max: 270, color: "#05204a" },
  { min: 270, max: 300, color: "#021024" },
  { min: 300, max: Infinity, color: "#000c1a" },
]

const metricOptions = [
  { value: "rain_till_yesterday", label: "Rain till Yesterday" },
  { value: "rain_last_24hrs", label: "Rain Last 24hrs" },
  { value: "total_rainfall", label: "Total Rainfall" },
  { value: "percent_against_avg", label: "% Against Avg" },
]

// Helper to get color for a value
function getColor(value: number) {
  for (const bin of colorBins) {
    if (value >= bin.min && value < bin.max) return bin.color
  }
  return colorBins[colorBins.length - 1].color
}

// Hardcoded CSV file list (since we can't list files in public from client-side)
const csvFilesList = [
  "13th June.csv",
  "14th June.csv",
  "15th June.csv",
  "16th June.csv",
  "17th June.csv",
]

type CsvRow = Record<string, string>

type Feature = {
  properties: {
    Tehsil_new: string
    [key: string]: any
  }
  [key: string]: any
}

type GeoJson = {
  features: Feature[]
  [key: string]: any
}

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
)
const GeoJSON = dynamic(
  () => import("react-leaflet").then(mod => mod.GeoJSON),
  { ssr: false }
)

// --- MapView component to avoid dynamic import type issues ---
const MapView: React.FC<{
  geojson: GeoJson
  getTehsilValue: (tehsil: string) => number | null
  getColor: (value: number) => string
}> = ({ geojson, getTehsilValue, getColor }) => {
  // Import here to avoid SSR issues
  const { MapContainer, TileLayer, GeoJSON } = require("react-leaflet")
  return (
    <MapContainer
      center={[22.5, 72.5]}
      zoom={7}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: 8 }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <GeoJSON
        data={geojson as any}
        style={(feature: any) => {
          const tehsil = feature?.properties?.Tehsil_new
          const value = getTehsilValue(tehsil)
          const color = value == null ? "#eee" : getColor(value)
          return {
            fillColor: color,
            color: "#333",
            weight: 1,
            fillOpacity: 0.85,
          }
        }}
        onEachFeature={(feature: any, layer: any) => {
          const tehsil = feature?.properties?.Tehsil_new
          const value = getTehsilValue(tehsil)
          layer.bindTooltip(
            `<strong>${tehsil}</strong><br/>${value ?? "-"}`,
            { sticky: true }
          )
        }}
      />
    </MapContainer>
  )
}

const MapsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(csvFilesList[0])
  const [selectedMetric, setSelectedMetric] = useState<string>(metricOptions[0].value)
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [geojson, setGeojson] = useState<GeoJson | null>(null)

  // Load CSV data when date changes
  useEffect(() => {
    if (!selectedDate) return
    fetch(`/${selectedDate}`)
      .then(res => res.text())
      .then(text => {
        const rows = text.split("\n").filter(Boolean)
        const headers = rows[0].split(",")
        const data = rows.slice(1).map((row: string) => {
          const values = row.split(",")
          const obj: CsvRow = {}
          headers.forEach((h, i) => (obj[h.trim()] = values[i]?.trim()))
          return obj
        })
        setCsvData(data)
      })
  }, [selectedDate])

  // Load GeoJSON once
  useEffect(() => {
    fetch("/gujarat_tehsil.geojson")
      .then(res => res.json())
      .then(setGeojson)
  }, [])

  // Helper: get value for a tehsil
  function getTehsilValue(tehsil: string) {
    const row: CsvRow | undefined = csvData.find((r: CsvRow) => r.taluka?.toLowerCase() === tehsil?.toLowerCase())
    if (!row) return null
    const val = row[selectedMetric]
    return isNaN(Number(val)) ? null : Number(val)
  }

  // Format CSV filename to date label
  function formatDateLabel(filename: string) {
    return filename.replace(/\.csv$/, "").replace(/(\d+)(st|nd|rd|th)/, (m, d) => d.padStart(2, "0")).replace(" ", "/").replace("June", "06/2025")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Rainfall Map</h2>
          <p className="text-muted-foreground">Interactive map showing rainfall data across Gujarat</p>
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2 mb-4 items-center">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          >
            {csvFilesList.map(f => (
              <option key={f} value={f}>{formatDateLabel(f)}</option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
          >
            {metricOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Map Placeholder replaced with real map */}
        <div className="w-full h-[calc(100vh-260px)] relative border rounded bg-white dark:bg-slate-900">
          {geojson ? (
            <MapView geojson={geojson} getTehsilValue={getTehsilValue} getColor={getColor} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">Loading map...</div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-4 z-[1000]">
            <h4 className="font-medium mb-2">Rainfall (mm)</h4>
            <div className="space-y-1 text-xs">
              {colorBins.map((bin, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: bin.color }}></div>
                  <span>{bin.max === Infinity ? `>${bin.min}` : `${bin.min} - ${bin.max}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapsPage
