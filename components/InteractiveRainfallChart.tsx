"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Brush, ReferenceLine, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Format date label from database format (e.g., "1st June 2025" -> "01/06/2025")
function formatDateLabel(dateString: string) {
  return dateString.replace(/(\d+)(st|nd|rd|th)/, (m, d) => d.padStart(2, "0")).replace(" ", "/").replace("June", "06/2025")
}

// Parse date string to Date object (e.g., "1st June 2025" -> Date)
function parseDateFromString(dateString: string): Date {
  // Extract day, month, and year from "1st June 2025" format
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

interface RainfallDataPoint {
  date: string
  timestamp: number
  value: number
  formattedDate: string
}

interface InteractiveRainfallChartProps {
  data: RainfallDataPoint[]
  title: string
  yAxisLabel: string
  color?: string
  selectedDate?: string
  onDateSelect?: (date: string) => void
  children?: React.ReactNode // For the controls above the chart
}

const chartConfig = {
  rainfall: {
    label: "Rainfall",
    color: "#22d3ee",
  },
}

export default function InteractiveRainfallChart({
  data,
  title,
  yAxisLabel,
  color = "#22d3ee",
  selectedDate,
  onDateSelect,
  children
}: InteractiveRainfallChartProps) {
  const [brushRange, setBrushRange] = useState<[number, number]>([0, data.length - 1])
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)
  const prevDataRef = useRef<any[]>([])
  const prevSelectedDateRef = useRef<string | undefined>()
  const chartRef = useRef<HTMLDivElement>(null)

  // Calculate brush range to show the full range by default
  const defaultBrushRange: [number, number] = useMemo(() => {
    return [0, Math.max(0, data.length - 1)]
  }, [data.length])

  // Initialize brush range
  useEffect(() => {
    setBrushRange(defaultBrushRange)
  }, [defaultBrushRange])

  const handleBrushChange = (range: any) => {
    if (range && range.startIndex !== undefined && range.endIndex !== undefined) {
      setBrushRange([range.startIndex, range.endIndex])
    }
  }

  const formatXAxisTick = (tickItem: any) => {
    if (data[tickItem]) {
      return data[tickItem].formattedDate
    }
    return ""
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground text-sm font-medium">{`Date: ${dataPoint.formattedDate}`}</p>
          <p className="text-primary text-sm">{`${yAxisLabel}: ${dataPoint.value.toFixed(2)}`}</p>
        </div>
      )
    }
    return null
  }

  const handlePointClick = (dataPoint: any) => {
    if (onDateSelect) {
      onDateSelect(dataPoint.date)
    }
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate visible data and Y domain
  const visibleData = data.slice(brushRange[0], brushRange[1] + 1)
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  let yDomain: [number, number] = [0, Math.max(1, ...data.map(d => d.value))]
  if (minValue === 0 && maxValue === 0) {
    yDomain = [0, 1]
  }

  return (
    <div className="w-full space-y-4 relative">
      {/* Controls above the chart */}
      {children && (
        <div className="flex gap-2 items-center">
          {children}
        </div>
      )}
      <Card className="bg-card border-border relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground text-lg">
                {title}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Interactive rainfall timeline with zoom and selection capabilities
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-muted-foreground text-sm">{yAxisLabel}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    handlePointClick(data.activePayload[0].payload)
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={yDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fill: "#94a3b8" },
                  }}
                  tickFormatter={(value) => Math.round(value).toString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: color, 
                    stroke: "#0891b2", 
                    strokeWidth: 2
                  }}
                  isAnimationActive={false}
                />
                {selectedDate && (
                  <ReferenceLine 
                    x={data.find(d => d.date === selectedDate)?.formattedDate} 
                    stroke="#64748b" 
                    strokeDasharray="2 2" 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Scrubber */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <Brush
                  dataKey="formattedDate"
                  height={30}
                  stroke={color}
                  fill={`${color}20`}
                  startIndex={brushRange[0]}
                  endIndex={brushRange[1]}
                  onChange={handleBrushChange}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>


    </div>
  )
} 