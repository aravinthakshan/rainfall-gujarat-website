"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Droplets, Database, AlertTriangle } from "lucide-react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TimeSeriesBrushChart } from "@/components/TimeSeriesBrushChart"
import InteractiveRainfallChart from "@/components/InteractiveRainfallChart"
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReservoirMap from "@/components/ReservoirMap"
import Papa from "papaparse"

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

// Color bins and thresholds for Rainfall Last 24 Hrs and % Against Avg
const colorBins = [
  { min: 0, max: 10, color: "#e3eef9" },
  { min: 10, max: 20, color: "#c6dbef" },
  { min: 20, max: 30, color: "#9ecae1" },
  { min: 30, max: 40, color: "#6baed6" },
  { min: 40, max: 50, color: "#4292c6" },
  { min: 50, max: 60, color: "#2171b5" },
  { min: 60, max: 70, color: "#08519c" },
  { min: 70, max: 80, color: "#08306b" },
  { min: 80, max: 90, color: "#05204a" },
  { min: 90, max: 100, color: "#021024" },
  { min: 100, max: Infinity, color: "#000c1a" },
]

const metricOptions = [
  { value: "rain_last_24hrs", label: "Rainfall Last 24 Hrs" },
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

const reservoirMetricOptions = [
  { value: "PercentageFilling", label: "% Filling" },
  { value: "InflowinCusecs", label: "Inflow (Cusecs)" },
  { value: "OutflowRiverinCusecs", label: "Outflow River (Cusecs)" },
  { value: "outflowCanalinCusecs", label: "Outflow Canal (Cusecs)" },
];

const reservoirColorBins = [
  { min: 0, max: 20, color: "#7fcdbb" },      // light blue
  { min: 20, max: 40, color: "#41b6c4" },    // greenish blue
  { min: 40, max: 60, color: "#ffffb2" },    // yellow
  { min: 60, max: 80, color: "#fe9929" },    // orange
  { min: 80, max: 100, color: "#de2d26" },   // red
  { min: 100, max: Infinity, color: "#a50f15" }, // dark red for >100%
];

function getReservoirColor(value: number) {
  for (const bin of reservoirColorBins) {
    if (value >= bin.min && value < bin.max) return bin.color;
  }
  return reservoirColorBins[reservoirColorBins.length - 1].color;
}

// Helper to get warning stations for marquee
function getReservoirWarningStations(reservoirData: any[]) {
  const high = [];
  const med = [];
  const low = [];
  for (const row of reservoirData) {
    let val = row["PercentageFilling"];
    val = Number(val);
    if (isNaN(val)) continue;
    if (val > 90) high.push(row["Name of Schemes"]);
    else if (val > 80) med.push(row["Name of Schemes"]);
    else if (val > 70) low.push(row["Name of Schemes"]);
  }
  return { high, med, low };
}

const MapsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>("16th June")
  const [selectedDateObject, setSelectedDateObject] = useState<Date | undefined>(undefined)
  const [selectedMetric, setSelectedMetric] = useState<string>("rain_last_24hrs")
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [geojson, setGeojson] = useState<GeoJson | null>(null)
  const [allCsvData, setAllCsvData] = useState<{ [tehsil: string]: { [date: string]: number } }>({})
  const [selectedTehsil, setSelectedTehsil] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [reservoirGeojson, setReservoirGeojson] = useState<any>(null);
  const [reservoirData, setReservoirData] = useState<any[]>([]);
  const [reservoirAvailableDates, setReservoirAvailableDates] = useState<string[]>([]);
  const [selectedReservoirDate, setSelectedReservoirDate] = useState<string>("");
  const [selectedReservoirMetric, setSelectedReservoirMetric] = useState<string>("PercentageFilling");
  const [reservoirLoading, setReservoirLoading] = useState(false);
  const [selectedReservoirName, setSelectedReservoirName] = useState<string | null>(null);
  const [reservoirTimeSeries, setReservoirTimeSeries] = useState<any[]>([]);
  const [reservoirMetaData, setReservoirMetaData] = useState<any | null>(null);

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
    console.log('Loading map data for date:', selectedDate)
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
        console.log('Map data updated for date:', selectedDate)
      })
      .catch(error => {
        console.error('Error loading rainfall data:', error)
      })
  }, [selectedDate]) // Only depend on selectedDate for map coloring

  // Load all data for time series from MongoDB
  useEffect(() => {
    if (availableDates.length === 0) return
    
    console.log('Loading chart data for metric:', selectedMetric)
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
        console.log('Chart data updated for metric:', selectedMetric)
        
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

  // Load GeoJSON once (for rainfall and for reservoir boundary)
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

  // Fetch reservoir geojson once
  useEffect(() => {
    fetch("/Reservoir_ID_Location.geojson")
      .then(res => res.json())
      .then(setReservoirGeojson)
      .catch(console.error);
  }, []);

  // Fetch available reservoir dates once
  useEffect(() => {
    fetch("/api/reservoir-data")
      .then(res => res.json())
      .then((data: any[]) => {
        const dates = Array.from(new Set(data.map((row: any) => row.date))) as string[];
        setReservoirAvailableDates(dates);
        if (dates.length > 0 && !selectedReservoirDate) setSelectedReservoirDate(dates[dates.length - 1]);
      })
      .catch(console.error);
  }, []);

  // Fetch reservoir data for selected date
  useEffect(() => {
    if (!selectedReservoirDate) return;
    setReservoirLoading(true);
    fetch(`/api/reservoir-data?date=${encodeURIComponent(selectedReservoirDate)}`)
      .then(res => res.json())
      .then(data => setReservoirData(data))
      .catch(console.error)
      .finally(() => setReservoirLoading(false));
  }, [selectedReservoirDate]);

  // Build time series for selected reservoir
  useEffect(() => {
    if (!selectedReservoirName) {
      setReservoirTimeSeries([]);
      return;
    }
    // Fetch all reservoir data for the selected name
    fetch('/api/reservoir-data')
      .then(res => res.json())
      .then((data: any[]) => {
        const filtered = data.filter(row => row["Name of Schemes"]?.toLowerCase() === selectedReservoirName.toLowerCase());
        const series = filtered.map(row => ({
          date: row.date,
          timestamp: parseDateFromString(row.date).getTime(),
          value: Number(row[selectedReservoirMetric]) || 0,
          formattedDate: row.date,
        })).sort((a, b) => a.timestamp - b.timestamp);
        setReservoirTimeSeries(series);
      });
  }, [selectedReservoirName, selectedReservoirMetric]);

  // Set default selected reservoir on data/metric change (like rainfall)
  useEffect(() => {
    if (reservoirData.length > 0) {
      let maxReservoir = null, maxVal = -Infinity;
      reservoirData.forEach((row: any) => {
        const val = Number(row["PercentageFilling"]);
        if (val > maxVal) {
          maxVal = val;
          maxReservoir = row["Name of Schemes"];
        }
      });
      setSelectedReservoirName(maxReservoir);
    }
  }, [reservoirData]);

  // Load metadata CSV and update when selectedReservoirName changes
  useEffect(() => {
    if (!selectedReservoirName) {
      setReservoirMetaData(null);
      return;
    }
    fetch("/Metadata.csv")
      .then(res => res.text())
      .then(csvText => {
        const parsed = Papa.parse(csvText, { header: true });
        if (!parsed.data || !Array.isArray(parsed.data)) return;
        const match = parsed.data.find((row: any) =>
          row["Name of Schemes"]?.toLowerCase().trim() === selectedReservoirName.toLowerCase().trim()
        );
        setReservoirMetaData(match || null);
      });
  }, [selectedReservoirName]);

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
      console.log('Date changed to:', date)
      setSelectedDateObject(date)
      // Convert Date back to string format for API calls (DD/MM/YYYY)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const dateString = `${day}/${month}/${year}`
      console.log('Setting selectedDate to:', dateString)
      setSelectedDate(dateString)
    }
  }

  // Debug effect to log when map should update
  useEffect(() => {
    console.log('Map should update - Date:', selectedDate, 'Metric:', selectedMetric, 'Data points:', csvData.length)
  }, [selectedDate, selectedMetric, csvData.length])

  // Debug effect to log when chart should update
  useEffect(() => {
    console.log('Chart should update - Metric:', selectedMetric, 'Tehsil:', selectedTehsil, 'Available dates:', availableDates.length)
  }, [selectedMetric, selectedTehsil, availableDates.length])

  // Time series data for selected tehsil
  const timeSeries = selectedTehsil && allCsvData[selectedTehsil]
    ? [...availableDates]
        .sort((a, b) => parseDateFromString(a).getTime() - parseDateFromString(b).getTime())
        .map(date => ({
          date: formatDateLabel(date),
          value: allCsvData[selectedTehsil]?.[date] ?? 0,
        }))
    : []

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Water & Climate Dashboard</h2>
          <p className="text-muted-foreground">
            Interactive dashboard for water and climate data across Gujarat
            {loading && <span className="ml-2 text-blue-600">Loading data...</span>}
          </p>
        </div>

        <Tabs defaultValue="rainfall" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="rainfall" className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Rainfall
            </TabsTrigger>
            <TabsTrigger value="reservoir" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Reservoir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rainfall" className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Rainfall Map</h3>
                <p className="text-muted-foreground">
                  Interactive map showing rainfall data across Gujarat
                </p>
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow ml-4"
                onClick={() => window.open('/path/to/information.pdf', '_blank')}
              >
                Information
              </button>
            </div>

            {/* Map and Time Series Side by Side */}
            <div className="flex flex-col lg:flex-row w-full gap-4 items-stretch">
              <div className="lg:w-1/2 h-[500px] lg:h-[calc(100vh-260px)]">
                <div className="h-full relative border rounded bg-card">
                  {geojson ? (
                    <MapViewWithClick 
                      key={`${selectedDate}-${selectedMetric}`}
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
                      onChange={e => {
                        console.log('Metric changed to:', e.target.value)
                        setSelectedMetric(e.target.value)
                      }}
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
          </TabsContent>

          <TabsContent value="reservoir" className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Reservoir Information</h3>
                <p className="text-muted-foreground">
                  Reservoir storage and water level data across Gujarat
                </p>
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow ml-4"
                onClick={() => window.open('/path/to/information.pdf', '_blank')}
              >
                Information
              </button>
            </div>
            <div className="flex flex-col lg:flex-row w-full gap-4 items-stretch">
              <div className="lg:w-1/2 h-[500px] lg:h-[calc(100vh-260px)]">
                <div className="h-full relative border rounded bg-card">
                  {reservoirGeojson && reservoirData.length > 0 && geojson ? (
                    <ReservoirMap
                      geojson={reservoirGeojson}
                      boundaryGeojson={geojson}
                      reservoirData={reservoirData}
                      getColor={getReservoirColor}
                      selectedMetric={"PercentageFilling"}
                      selectedDate={selectedReservoirDate}
                      onReservoirClick={setSelectedReservoirName}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">Loading reservoir map...</div>
                  )}
                  {/* Legend */}
                  <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-4 z-[1000]">
                    <h4 className="font-medium mb-2">
                      {reservoirMetricOptions.find(m => m.value === selectedReservoirMetric)?.label}
                    </h4>
                    <div className="space-y-1 text-xs">
                      {reservoirColorBins.map((bin, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ background: bin.color }}></div>
                          <span>{bin.max === Infinity ? `>${bin.min}` : `${bin.min} - ${bin.max}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Right column: meta data above chart, stretch to match map height */}
              <div className="lg:w-1/2 flex flex-col gap-6 h-full">
                {selectedReservoirName && reservoirTimeSeries.length > 0 ? (
                  <>
                    <div className="flex flex-col h-full">
                      {/* Meta Data Card at the top, does not shrink */}
                      {selectedReservoirName && reservoirMetaData && (
                        <div className="mb-4 w-full flex-shrink-0">
                          <h4 className="text-lg font-bold mb-2">Meta Data</h4>
                          <div className="bg-card rounded-lg shadow p-4 border w-full">
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 w-full">
                              <div className="flex"><span className="font-semibold pr-2">District:</span> <span>{reservoirMetaData["District"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Taluka:</span> <span>{reservoirMetaData["Taluka"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Name of Schemes:</span> <span>{reservoirMetaData["Name of Schemes"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Type:</span> <span>{
                                (() => {
                                  const typeVal = reservoirMetaData["Type (Gated/Ungated/FuseGate)"]?.trim();
                                  if (!typeVal) return "-";
                                  if (typeVal === "G") return "Gated";
                                  if (typeVal === "UG") return "Ungated";
                                  if (typeVal === "FG") return "FuseGate";
                                  return typeVal; // fallback to original if not matched
                                })()
                              }</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Overflow Spillway Level (m):</span> <span>{reservoirMetaData["Overflow Spillway Level (m)"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Full Reservoir Level (m):</span> <span>{reservoirMetaData["Full Reservoi Level (m)"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Gross Storage (MCM):</span> <span>{reservoirMetaData["Gross Storage (MCM)"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Live Storage (MCM):</span> <span>{reservoirMetaData["Live Storage (MCM)"]}</span></div>
                              <div className="flex"><span className="font-semibold pr-2">Dead Storage (MCM):</span> <span>{reservoirMetaData["Dead Storage (MCM)"]}</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col">
                        <InteractiveRainfallChart
                          key={`${selectedReservoirName}-${selectedReservoirMetric}`}
                          data={reservoirTimeSeries}
                          title={`${selectedReservoirName.charAt(0).toUpperCase() + selectedReservoirName.slice(1)} - ${reservoirMetricOptions.find(m => m.value === selectedReservoirMetric)?.label}`}
                          yAxisLabel={reservoirMetricOptions.find(m => m.value === selectedReservoirMetric)?.label || "Value"}
                          color="#60a5fa"
                        >
                          <CalendarDatePicker
                            selectedDate={selectedReservoirDate ? parseDateFromString(selectedReservoirDate) : undefined}
                            onDateChange={date => {
                              if (date) {
                                // Convert Date to DD/MM/YYYY string
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear();
                                const dateString = `${day}/${month}/${year}`;
                                setSelectedReservoirDate(dateString);
                              }
                            }}
                            availableDates={reservoirAvailableDates}
                            disabled={reservoirLoading}
                          />
                          <select
                            className="flex h-10 w-[240px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedReservoirMetric}
                            onChange={e => setSelectedReservoirMetric(e.target.value)}
                          >
                            {reservoirMetricOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </InteractiveRainfallChart>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[500px] lg:h-[calc(100vh-260px)] border rounded bg-card flex items-center justify-center">
                    <div className="text-center">
                      <h4 className="text-lg font-medium mb-2">Reservoir Data</h4>
                      <p className="text-muted-foreground">Click a reservoir marker to view time series</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default MapsPage