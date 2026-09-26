"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { dateToDmy, dmyToDate, fmt, prettyDate } from "@/lib/rain"

export type Point = { date: string; value: number | null }

// One slot per calendar day so gaps in reporting stay visible on the time axis
function fillDays(points: Point[]): Point[] {
  if (points.length < 2) return points
  const byDate = new Map(points.map((p) => [p.date, p.value]))
  const out: Point[] = []
  const end = dmyToDate(points[points.length - 1].date)
  for (let d = dmyToDate(points[0].date); d <= end; d.setDate(d.getDate() + 1)) {
    const key = dateToDmy(d)
    out.push({ date: key, value: byDate.has(key) ? byDate.get(key)! : null })
  }
  return out
}

type Props = {
  data: Point[]
  kind: "bar" | "area"
  unit: string
  selectedDate?: string
  onSelectDate?: (date: string) => void
  height?: number
}

const AXIS = { fontSize: 11, fill: "hsl(var(--muted-foreground))" }
// Compact axis numbers: 950, 2,800, 12k, 1.2M
function axisNumber(v: number) {
  const a = Math.abs(v)
  if (a >= 1e6) return `${+(v / 1e6).toFixed(1)}M`
  if (a >= 1e4) return `${+(v / 1e3).toFixed(0)}k`
  return fmt(v)
}

const PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "Season", days: Infinity },
]

export default function SeriesChart({ data: raw, kind, unit, selectedDate, onSelectDate, height = 220 }: Props) {
  const data = useMemo(() => fillDays(raw), [raw])
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 })
  const [preset, setPreset] = useState<number | null>(30)

  // Reset the window when the series changes (new taluka / metric)
  useEffect(() => {
    const end = Math.max(0, data.length - 1)
    setRange({ start: Math.max(0, end - 29), end })
    setPreset(30)
  }, [data])

  // Size the Y axis to its widest label instead of a fixed width
  const yWidth = useMemo(() => {
    const max = Math.max(0, ...data.map((p) => p.value ?? 0))
    return 14 + axisNumber(max * 1.1).length * 7
  }, [data])

  const visible = useMemo(() => data.slice(range.start, range.end + 1), [data, range])
  const summary = useMemo(() => {
    if (!visible.length) return null
    const reported = visible.filter((p) => p.value != null) as { date: string; value: number }[]
    if (!reported.length) return null
    const peak = reported.reduce((a, b) => (b.value > a.value ? b : a))
    const total = reported.reduce((s, p) => s + p.value, 0)
    return { peak, total }
  }, [visible])

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No history yet
      </div>
    )
  }

  const applyPreset = (days: number) => {
    const end = data.length - 1
    setRange({ start: days === Infinity ? 0 : Math.max(0, end - (days - 1)), end })
    setPreset(days)
  }

  const common = {
    data,
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
    onClick: (e: any) => {
      const d = e?.activePayload?.[0]?.payload?.date ?? (e?.activeLabel as string | undefined)
      if (d && onSelectDate) onSelectDate(d)
    },
  }

  const series =
    kind === "bar" ? (
      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
    ) : (
      <Area
        type="linear"
        dataKey="value"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        fill="url(#series-fill)"
        activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
        dot={false}
        connectNulls
        isAnimationActive={false}
      />
    )

  // Mini overview drawn inside the slider track
  const overview =
    kind === "bar" ? (
      <BarChart data={data}>
        <Bar dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.45} isAnimationActive={false} />
      </BarChart>
    ) : (
      <AreaChart data={data}>
        <Area dataKey="value" connectNulls stroke="hsl(var(--primary))" strokeOpacity={0.6} fill="hsl(var(--primary))" fillOpacity={0.12} dot={false} isAnimationActive={false} />
      </AreaChart>
    )

  const body = (
    <>
      <defs>
        <linearGradient id="series-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
      <XAxis
        dataKey="date"
        tickFormatter={(d) => prettyDate(d, false)}
        tick={AXIS}
        tickLine={false}
        axisLine={{ stroke: "hsl(var(--border))" }}
        minTickGap={28}
      />
      <YAxis
        tick={AXIS}
        tickLine={false}
        axisLine={false}
        width={yWidth}
        tickFormatter={axisNumber}
        domain={[0, "auto"]}
        allowDataOverflow
      />
      <Tooltip
        cursor={kind === "bar" ? { fill: "hsl(var(--muted))" } : { stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
        content={({ active, payload }) =>
          active && payload?.length ? (
            <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
              <div className="text-muted-foreground">{prettyDate(payload[0].payload.date)}</div>
              <div className="mt-0.5 font-medium tabular-nums text-foreground">
                {payload[0].payload.value == null ? "No report" : `${fmt(payload[0].value as number, 1)} ${unit}`}
              </div>
            </div>
          ) : null
        }
      />
      {selectedDate && <ReferenceLine x={selectedDate} stroke="hsl(var(--foreground))" strokeOpacity={0.35} strokeDasharray="3 3" />}
      {series}
      {data.length > 7 && (
        <Brush
          dataKey="date"
          height={36}
          travellerWidth={8}
          startIndex={range.start}
          endIndex={range.end}
          onChange={(r: any) => {
            if (r?.startIndex == null) return
            setRange({ start: r.startIndex, end: r.endIndex })
            setPreset(null)
          }}
          tickFormatter={(d) => prettyDate(d, false)}
          stroke="hsl(var(--primary))"
          fill="hsl(var(--muted))"
          className="series-brush"
        >
          {overview}
        </Brush>
      )}
    </>
  )

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {prettyDate(data[range.start]?.date)} – {prettyDate(data[range.end]?.date)}
          {summary && (
            <span className="ml-2 tabular-nums">
              · {kind === "bar" ? `total ${fmt(summary.total)} ${unit}, ` : ""}peak {fmt(summary.peak.value, 1)} {unit} on{" "}
              {prettyDate(summary.peak.date, false)}
            </span>
          )}
        </div>
        {data.length > 7 && (
          <div className="flex shrink-0 rounded-md border p-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium",
                  preset === p.days ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mb-1 text-[11px] text-muted-foreground">{unit}</div>
      <div style={{ height: height + (data.length > 7 ? 44 : 0) }} className={onSelectDate ? "cursor-pointer" : undefined}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart {...common} barCategoryGap={2}>
              {body}
            </BarChart>
          ) : (
            <AreaChart {...common}>{body}</AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
