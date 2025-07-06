"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TimeSeriesBrushChart } from "@/components/TimeSeriesBrushChart"
import InteractiveRainfallChart from "@/components/InteractiveRainfallChart"
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker"

// Format date label from database format (e.g., "01/06/2025" -> "01/06/2025")
function formatDateLabel(dateString: string) {
  // If already in DD/MM/YYYY format, return as is
  if (dateString.includes('/')) {
    return dateString;
  }
  
  // Legacy format conversion (e.g., "1st June 2025" -> "01/06/2025")
  return dateString.replace(/(\d+)(st|nd|rd|th)/, (m, d) => d.padStart(2, "0")).replace(" ", "/").replace("June", "06/2025")
}

// Parse date string to Date object (e.g., "01/06/2025" -> Date)
function parseDateFromString(dateString: string): Date {
  // Parse DD/MM/YYYY format
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }
  
  // Legacy format parsing (e.g., "1st June 2025" -> Date)
  const match = dateString.match(/(\d+)(st|nd|rd|th)\s+(June)\s+(\d{4})/)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = 5 // June is month 5 (0-indexed)
    const year = parseInt(match[4], 10)
    return new Date(year, month, day)
  }
  
  // Fallback to current date if parsing fails
  return new Date()
}

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

// We'll fetch dates from the API instead of hardcoding
const csvFilesList: string[] = [];
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

// --- MapView with click handler ---
const MapViewWithClick = React.memo<{
  geojson: GeoJson
  getTehsilValue: (tehsil: string) => number | null
  getColor: (value: number) => string
  onTehsilClick: (tehsil: string) => void
  selectedMetric: string
  selectedDate: string
}>(({ geojson, getTehsilValue, getColor, onTehsilClick, selectedMetric, selectedDate }) => {
  const { MapContainer, TileLayer, GeoJSON } = require("react-leaflet")
  const layersRef = React.useRef<any[]>([])
  
  // Get the appropriate label for the selected metric
  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "rain_till_yesterday": return "Rain till Yesterday (mm)"
      case "rain_last_24hrs": return "Rain Last 24hrs (mm)"
      case "total_rainfall": return "Total Rainfall (mm)"
      case "percent_against_avg": return "% Against Avg"
      default: return "Value"
    }
  }
  
  // Update tooltips when date or metric changes
  React.useEffect(() => {
    const dateLabel = formatDateLabel(selectedDate)
    const metricLabel = getMetricLabel(selectedMetric)
    
    layersRef.current.forEach(layer => {
      const tehsil = layer.feature?.properties?.Tehsil_new
      if (tehsil) {
        const value = getTehsilValue(tehsil)
        layer.setTooltipContent(
          `<strong>${tehsil}</strong><br/>${dateLabel}<br/>${metricLabel}: ${value ?? "-"}`
        )
      }
    })
  }, [selectedDate, selectedMetric, getTehsilValue])

  // Clear layers ref when geojson changes
  React.useEffect(() => {
    layersRef.current = []
  }, [geojson])

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
          const metricLabel = getMetricLabel(selectedMetric)
          const dateLabel = formatDateLabel(selectedDate)
          
          // Store layer reference for updating tooltips
          layersRef.current.push(layer)
          
          layer.bindTooltip(
            `<strong>${tehsil}</strong><br/>${dateLabel}<br/>${metricLabel}: ${value ?? "-"}`,
            { sticky: true }
          )
          layer.on('click', () => {
            if (tehsil) onTehsilClick(tehsil.toLowerCase())
          })
        }}
      />
    </MapContainer>
  )
})

MapViewWithClick.displayName = 'MapViewWithClick'

const MapsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>("16th June")
  const [selectedDateObject, setSelectedDateObject] = useState<Date | undefined>(undefined)
  const [selectedMetric, setSelectedMetric] = useState<string>("total_rainfall")
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [geojson, setGeojson] = useState<GeoJson | null>(null)
  const [allCsvData, setAllCsvData] = useState<{ [tehsil: string]: { [date: string]: number } }>({})
  const [selectedTehsil, setSelectedTehsil] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load available dates from MongoDB
  useEffect(() => {
    fetch('/api/rainfall-dates')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dates')
        return res.json()
      })
      .then(dates => {
        setAvailableDates(dates)
        if (dates.length > 0) {
          const latestDate = dates[dates.length - 1]
          setSelectedDate(latestDate) // Set to latest date
          setSelectedDateObject(parseDateFromString(latestDate))
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading dates:', error)
        setLoading(false)
      })
  }, [])

  // Load CSV data for selected date (for map coloring) from MongoDB
  useEffect(() => {
    if (!selectedDate) return
    fetch(`/api/rainfall-data?date=${encodeURIComponent(selectedDate)}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load data for ${selectedDate}`)
        return res.json()
      })
      .then(data => {
        // Convert MongoDB data to CSV-like format for compatibility
        const csvData = data.map((item: any) => ({
          taluka: item.taluka,
          rain_till_yesterday: item.rain_till_yesterday.toString(),
          rain_last_24hrs: item.rain_last_24hrs.toString(),
          total_rainfall: item.total_rainfall.toString(),
          percent_against_avg: item.percent_against_avg.toString(),
        }))
        setCsvData(csvData)
      })
      .catch(error => {
        console.error('Error loading rainfall data:', error)
      })
  }, [selectedDate]) // Only depend on selectedDate for map coloring

  // Load all data for time series from MongoDB
  useEffect(() => {
    if (availableDates.length === 0) return
    
    fetch('/api/rainfall-data')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load all rainfall data')
        return res.json()
      })
      .then(data => {
        const tehsilData: { [tehsil: string]: { [date: string]: number } } = {}
        
        data.forEach((item: any) => {
          const tehsil = item.taluka?.toLowerCase()
          if (!tehsil) return
          if (!tehsilData[tehsil]) tehsilData[tehsil] = {}
          tehsilData[tehsil][item.date] = Number(item[selectedMetric]) || 0
        })
        
        setAllCsvData(tehsilData)
        
        // Default: find tehsil with max value for the selected metric on latest date
        if (!selectedTehsil && availableDates.length > 0) {
          const latestDate = availableDates[availableDates.length - 1]
          const latestData = data.filter((item: any) => item.date === latestDate)
          let maxTehsil = null, maxVal = -Infinity
          
          latestData.forEach((item: any) => {
            const val = Number(item[selectedMetric])
            if (val > maxVal) {
              maxVal = val
              maxTehsil = item.taluka?.toLowerCase()
            }
          })
          setSelectedTehsil(maxTehsil)
        }
      })
      .catch(error => {
        console.error('Error loading all rainfall data:', error)
      })
  }, [selectedMetric, availableDates]) // Depend on selectedMetric and availableDates for time series

  // Load GeoJSON once
  useEffect(() => {
    fetch("/gujarat_tehsil.geojson")
      .then(res => {
        if (!res.ok) throw new Error('Failed to load GeoJSON data')
        return res.json()
      })
      .then(setGeojson)
      .catch(error => {
        console.error('Error loading GeoJSON:', error)
        // You might want to show a user-friendly error message here
      })
  }, [])

  // Helper: get value for a tehsil
  function getTehsilValue(tehsil: string) {
    const row: CsvRow | undefined = csvData.find((r: CsvRow) => r.taluka?.toLowerCase() === tehsil?.toLowerCase())
    if (!row) return null
    
    // Get the value for the selected metric
    const val = row[selectedMetric]
    if (val === undefined || val === null || val === '') return null
    
    const numVal = Number(val)
    return isNaN(numVal) ? null : numVal
  }

  // Handle date selection from calendar
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDateObject(date)
      // Convert Date back to string format for API calls (DD/MM/YYYY)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const dateString = `${day}/${month}/${year}`
      setSelectedDate(dateString)
    }
  }

  // Time series data for selected tehsil
  const timeSeries = selectedTehsil && allCsvData[selectedTehsil]
    ? availableDates.map(date => ({
        date: formatDateLabel(date), // Use the date string directly
        value: allCsvData[selectedTehsil]?.[date] ?? 0,
      }))
    : []

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Rainfall Map</h2>
          <p className="text-muted-foreground">
            Interactive map showing rainfall data across Gujarat
            {loading && <span className="ml-2 text-blue-600">Loading data...</span>}
          </p>
        </div>

        {/* Map and Time Series Side by Side */}
        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="lg:w-1/2 h-[500px] lg:h-[calc(100vh-260px)]">
            <div className="h-full relative border rounded bg-white dark:bg-slate-900">
              {geojson ? (
                <MapViewWithClick 
                  geojson={geojson} 
                  getTehsilValue={getTehsilValue} 
                  getColor={getColor} 
                  onTehsilClick={setSelectedTehsil} 
                  selectedMetric={selectedMetric} 
                  selectedDate={selectedDate} 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">Loading map...</div>
              )}
              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-4 z-[1000]">
                <h4 className="font-medium mb-2">
                  {selectedMetric === "percent_against_avg" ? "% Against Avg" : 
                   selectedMetric === "rain_till_yesterday" ? "Rain till Yesterday (mm)" :
                   selectedMetric === "rain_last_24hrs" ? "Rain Last 24hrs (mm)" :
                   "Total Rainfall (mm)"}
                </h4>
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
          <div className="lg:w-1/2">
            {selectedTehsil && allCsvData[selectedTehsil] ? (
              <InteractiveRainfallChart
                data={availableDates.map(date => ({
                  date: date, // Use the date string directly
                  timestamp: parseDateFromString(date).getTime(),
                  value: allCsvData[selectedTehsil]?.[date] ?? 0,
                  formattedDate: formatDateLabel(date),
                }))}
                title={`${selectedTehsil.charAt(0).toUpperCase() + selectedTehsil.slice(1)} - ${metricOptions.find(m => m.value === selectedMetric)?.label}`}
                yAxisLabel={metricOptions.find(m => m.value === selectedMetric)?.label || "Value"}
                color="#60a5fa"
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date)
                  setSelectedDateObject(parseDateFromString(date))
                }}
              >
                <CalendarDatePicker
                  selectedDate={selectedDateObject}
                  onDateChange={handleDateChange}
                  availableDates={availableDates}
                  disabled={loading}
                />
                <select
                  className="flex h-10 w-[240px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value)}
                >
                  {metricOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </InteractiveRainfallChart>
            ) : (
              <div className="text-muted-foreground flex items-center justify-center h-[500px]">Select a tehsil to view rainfall data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapsPage