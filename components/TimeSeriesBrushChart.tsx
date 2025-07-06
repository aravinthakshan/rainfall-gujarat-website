"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"

interface DataPoint {
  date: Date
  value: number
}

interface TimeSeriesBrushChartProps {
  data: DataPoint[]
  title: string
  yAxisLabel: string
  color: string
  dataId: string
}

export function TimeSeriesBrushChart({ data, title, yAxisLabel, color, dataId }: TimeSeriesBrushChartProps) {
  const chartRef = useRef<SVGSVGElement>(null)
  const sliderRef = useRef<SVGSVGElement>(null)
  const [selectedRange, setSelectedRange] = useState({ start: 0.7, end: 1.0 })
  const [isDragging, setIsDragging] = useState<"start" | "end" | "middle" | null>(null)
  const [dragStart, setDragStart] = useState(0)

  const chartWidth = 800
  const chartHeight = 300
  const sliderHeight = 60
  const margin = { top: 20, right: 60, bottom: 40, left: 60 }

  // Calculate scales
  const { xScale, yScale, minY, maxY } = useMemo(() => {
    if (data.length === 0) {
      return {
        xScale: (date: Date) => margin.left,
        yScale: (value: number) => chartHeight - margin.bottom,
        minY: 0,
        maxY: 1,
      }
    }
    const minDate = Math.min(...data.map((d) => d.date.getTime()))
    const maxDate = Math.max(...data.map((d) => d.date.getTime()))
    const minY = Math.min(...data.map((d) => d.value)) - 2
    const maxY = Math.max(...data.map((d) => d.value)) + 2

    const xScale = (date: Date) =>
      margin.left + ((date.getTime() - minDate) / (maxDate - minDate)) * (chartWidth - margin.left - margin.right)

    const yScale = (value: number) =>
      chartHeight - margin.bottom - ((value - minY) / (maxY - minY)) * (chartHeight - margin.top - margin.bottom)

    return { xScale, yScale, minY, maxY }
  }, [data, chartWidth, chartHeight, margin])

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    const startIndex = Math.floor(selectedRange.start * data.length)
    const endIndex = Math.ceil(selectedRange.end * data.length)
    return data.slice(startIndex, endIndex)
  }, [data, selectedRange])

  // Generate path for main chart
  const mainPath = useMemo(() => {
    if (filteredData.length === 0) return ""

    return filteredData
      .map((point, index) => {
        const x = xScale(point.date)
        const y = yScale(point.value)
        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }, [filteredData, xScale, yScale])

  // Generate path for slider overview
  const sliderPath = useMemo(() => {
    if (data.length === 0) return ""

    const sliderXScale = (date: Date) => {
      const minDate = Math.min(...data.map((d) => d.date.getTime()))
      const maxDate = Math.max(...data.map((d) => d.date.getTime()))
      return 20 + ((date.getTime() - minDate) / (maxDate - minDate)) * (chartWidth - 40)
    }

    const sliderYScale = (value: number) => {
      return sliderHeight - 10 - ((value - minY) / (maxY - minY)) * (sliderHeight - 20)
    }

    return data
      .map((point, index) => {
        const x = sliderXScale(point.date)
        const y = sliderYScale(point.value)
        return `${index === 0 ? "M" : "L"} ${x} ${y}`
      })
      .join(" ")
  }, [data, minY, maxY, chartWidth, sliderHeight])

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const tickCount = 8
    const ticks = []
    for (let i = 0; i <= tickCount; i++) {
      const value = minY + (maxY - minY) * (i / tickCount)
      ticks.push({
        value: Math.round(value),
        y: yScale(value),
      })
    }
    return ticks
  }, [minY, maxY, yScale])

  // Generate X-axis ticks
  const xTicks = useMemo(() => {
    if (data.length === 0) return []
    const tickCount = 6
    const minDate = data[0].date.getTime()
    const maxDate = data[data.length - 1].date.getTime()
    return Array.from({ length: tickCount + 1 }, (_, i) => {
      const t = minDate + ((maxDate - minDate) * i) / tickCount
      return {
        date: new Date(t),
        x: xScale(new Date(t)),
      }
    })
  }, [data, xScale])

  // Handle slider interactions
  const handleSliderMouseDown = (e: React.MouseEvent, type: "start" | "end" | "middle") => {
    e.preventDefault()
    setIsDragging(type)
    setDragStart(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const normalizedX = Math.max(0, Math.min(1, (x - 20) / (chartWidth - 40)))

    if (isDragging === "start") {
      setSelectedRange((prev) => ({
        ...prev,
        start: Math.min(normalizedX, prev.end - 0.05),
      }))
    } else if (isDragging === "end") {
      setSelectedRange((prev) => ({
        ...prev,
        end: Math.max(normalizedX, prev.start + 0.05),
      }))
    } else if (isDragging === "middle") {
      const delta = (e.clientX - dragStart) / (chartWidth - 40)
      const rangeWidth = selectedRange.end - selectedRange.start

      setSelectedRange((prev) => {
        const newStart = Math.max(0, Math.min(1 - rangeWidth, prev.start + delta))
        return {
          start: newStart,
          end: newStart + rangeWidth,
        }
      })
      setDragStart(e.clientX)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-slate-300">
            {title} ({dataId})
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <Card className="bg-card border-border p-4">
        <svg ref={chartRef} width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

          {/* Y-axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={chartHeight - margin.bottom}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line x1={margin.left - 5} y1={tick.y} x2={margin.left} y2={tick.y} stroke="#64748b" strokeWidth="1" />
              <text x={margin.left - 10} y={tick.y + 4} textAnchor="end" className="fill-slate-400 text-xs">
                {tick.value}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={20}
            y={chartHeight / 2}
            textAnchor="middle"
            className="fill-slate-400 text-sm"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
          >
            {yAxisLabel}
          </text>

          {/* X-axis */}
          <line
            x1={margin.left}
            y1={chartHeight - margin.bottom}
            x2={chartWidth - margin.right}
            y2={chartHeight - margin.bottom}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* X-axis ticks and labels */}
          {xTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={tick.x}
                y1={chartHeight - margin.bottom}
                x2={tick.x}
                y2={chartHeight - margin.bottom + 5}
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={chartHeight - margin.bottom + 20}
                textAnchor="middle"
                className="fill-slate-400 text-xs"
              >
                {tick.date.getFullYear()}
              </text>
            </g>
          ))}

          {/* Data line */}
          <path d={mainPath} fill="none" stroke={color} strokeWidth="2" className="drop-shadow-sm" />

          {/* Data points */}
          {filteredData.map((point, index) => (
            <circle
              key={index}
              cx={xScale(point.date)}
              cy={yScale(point.value)}
              r="3"
              fill={color}
              className="drop-shadow-sm"
            />
          ))}
        </svg>
      </Card>

      {/* Slider */}
      <Card className="bg-card border-border p-2">
        <svg ref={sliderRef} width={chartWidth} height={sliderHeight} className="cursor-pointer">
          {/* Overview path */}
          <path d={sliderPath} fill="none" stroke="#64748b" strokeWidth="1" opacity="0.6" />

          {/* Selection area */}
          <rect
            x={20 + selectedRange.start * (chartWidth - 40)}
            y={5}
            width={(selectedRange.end - selectedRange.start) * (chartWidth - 40)}
            height={sliderHeight - 10}
            fill={color}
            opacity="0.2"
            className="cursor-move"
            onMouseDown={(e) => handleSliderMouseDown(e, "middle")}
          />

          {/* Selection handles */}
          <rect
            x={20 + selectedRange.start * (chartWidth - 40) - 3}
            y={5}
            width="6"
            height={sliderHeight - 10}
            fill={color}
            className="cursor-ew-resize"
            onMouseDown={(e) => handleSliderMouseDown(e, "start")}
          />
          <rect
            x={20 + selectedRange.end * (chartWidth - 40) - 3}
            y={5}
            width="6"
            height={sliderHeight - 10}
            fill={color}
            className="cursor-ew-resize"
            onMouseDown={(e) => handleSliderMouseDown(e, "end")}
          />

          {/* Current date indicator */}
          <text x={chartWidth - 20} y={sliderHeight - 5} textAnchor="end" className="fill-slate-400 text-xs">
            {data.length > 0 ? data[data.length - 1].date.toISOString().slice(0, 10) : ""}
          </text>
        </svg>
      </Card>
    </div>
  )
} 