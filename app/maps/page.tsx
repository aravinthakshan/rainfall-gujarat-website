"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "@/components/theme-provider"
import "leaflet/dist/leaflet.css"
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker"
import SeriesChart, { type Point } from "@/components/maps/series-chart"
import { cn } from "@/lib/utils"
import {
  FILLING,
  RAIN_METRICS,
  ramp,
  RESERVOIR_METRICS,
  dateToDmy,
  dmyToDate,
  fmt,
  normalize,
  prettyDate,
  titleCase,
  type RainMetric,
  type ReservoirMetric,
} from "@/lib/rain"

const ChoroplethMap = dynamic(() => import("@/components/maps/choropleth-map"), { ssr: false, loading: () => <MapSkeleton /> })
const ReservoirMap = dynamic(() => import("@/components/maps/reservoir-map"), { ssr: false, loading: () => <MapSkeleton /> })

const getJSON = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${url}`))))

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------
function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "md",
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  size?: "sm" | "md"
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-medium transition-colors",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border bg-card", className)}>{children}</div>
}

function Stat({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {note && <div className="mt-0.5 truncate text-xs text-muted-foreground">{note}</div>}
    </Card>
  )
}

function Legend({ title, labels, points = false }: { title: string; labels: string[]; points?: boolean }) {
  const { resolvedTheme } = useTheme()
  const colors = ramp(resolvedTheme === "dark", points)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-3">
      <span className="text-xs text-muted-foreground">{title}</span>
      <div className="flex">
        {labels.map((l, i) => (
          <div key={l} className="flex w-[60px] flex-col gap-1 sm:w-[72px]">
            <div className={cn("h-2", i === 0 && "rounded-l", i === labels.length - 1 && "rounded-r")} style={{ background: colors[i] }} />
            <span className="text-[10px] leading-tight text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MapSkeleton() {
  return <div className="h-full w-full animate-pulse bg-muted" />
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function EmptyState({ error }: { error?: boolean }) {
  return (
    <Card className="px-6 py-16 text-center">
      <p className="font-medium">{error ? "Data is temporarily unavailable" : "No data yet"}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {error ? "The database could not be reached. Please try again shortly." : "Reports appear here once the daily ingest has run."}
      </p>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Rainfall
// ---------------------------------------------------------------------------
function RainfallView({ geojson }: { geojson: any }) {
  const [dates, setDates] = useState<string[] | null>(null)
  const [date, setDate] = useState<string>("")
  const [rows, setRows] = useState<any[]>([])
  const [metric, setMetric] = useState<RainMetric>("rain_last_24hrs")
  const [selected, setSelected] = useState<string | null>(null)
  const [series, setSeries] = useState<any[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    getJSON("/api/rainfall-dates")
      .then((d: string[]) => {
        setDates(d)
        if (d.length) setDate(d[d.length - 1])
      })
      .catch(() => {
        setDates([])
        setError(true)
      })
  }, [])

  useEffect(() => {
    if (!date) return
    getJSON(`/api/rainfall-data?date=${encodeURIComponent(date)}`).then(setRows).catch(console.error)
  }, [date])

  const byKey = useMemo(() => new Map(rows.map((r) => [String(r.taluka).toLowerCase(), r])), [rows])
  const values = useMemo(() => new Map(rows.map((r) => [String(r.taluka).toLowerCase(), Number(r[metric])])), [rows, metric])

  const wettest = useMemo(
    () => [...rows].sort((a, b) => b[metric] - a[metric]).slice(0, 8),
    [rows, metric],
  )

  // default selection: wettest taluka in the last 24 h
  useEffect(() => {
    if (!selected && rows.length) {
      const top = rows.reduce((a, b) => (b.rain_last_24hrs > a.rain_last_24hrs ? b : a))
      setSelected(String(top.taluka).toLowerCase())
    }
  }, [rows, selected])

  const current = selected ? byKey.get(selected) : null
  useEffect(() => {
    if (!current?.taluka) return
    getJSON(`/api/rainfall-data?taluka=${encodeURIComponent(current.taluka)}`).then(setSeries).catch(console.error)
  }, [current?.taluka])

  const points: Point[] = useMemo(
    () =>
      series
        .map((r) => ({ date: r.date, value: Number(r[metric]) || 0 }))
        .sort((a, b) => dmyToDate(a.date).getTime() - dmyToDate(b.date).getTime()),
    [series, metric],
  )

  if (dates === null) return <MapSkeletonBlock />
  if (!dates.length) return <EmptyState error={error} />

  const m = RAIN_METRICS[metric]
  const mean = (k: string) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0) / (rows.length || 1)
  const top24 = rows.length ? rows.reduce((a, b) => (b.rain_last_24hrs > a.rain_last_24hrs ? b : a)) : null
  const aboveAvg = rows.filter((r) => r.percent_against_avg >= 100).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDatePicker
          selectedDate={date ? dmyToDate(date) : undefined}
          onDateChange={(d) => d && setDate(dateToDmy(d))}
          availableDates={dates}
          className="w-auto"
        />
        <Segmented
          value={metric}
          onChange={setMetric}
          options={(Object.keys(RAIN_METRICS) as RainMetric[]).map((k) => ({ value: k, label: RAIN_METRICS[k].short }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="State average, last 24 h" value={fmt(mean("rain_last_24hrs"), 1)} unit="mm" note={`${rows.length} talukas reporting`} />
        <Stat label="Wettest taluka, last 24 h" value={fmt(top24?.rain_last_24hrs, 0)} unit="mm" note={top24 ? `${top24.taluka}, ${top24.district}` : ""} />
        <Stat label="Average season total" value={fmt(mean("total_rainfall"))} unit="mm" note={`${fmt(mean("percent_against_avg"))}% of annual average`} />
        <Stat label="At or above annual average" value={fmt(aboveAvg)} unit={`/ ${rows.length}`} note="talukas" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="isolate overflow-hidden">
          <div className="h-[460px] sm:h-[560px]">
            {geojson && (
              <ChoroplethMap
                geojson={geojson}
                values={values}
                thresholds={m.thresholds}
                unit={m.unit}
                selected={selected}
                onSelect={setSelected}
              />
            )}
          </div>
          <Legend title={`${m.label} (${m.unit})`} labels={m.classLabels} />
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            {current ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{current.taluka}</h2>
                    <p className="text-sm text-muted-foreground">
                      {current.district} · {current.region}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{prettyDate(date)}</span>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3">
                  <Detail label="Last 24 h" value={`${fmt(current.rain_last_24hrs, 1)} mm`} />
                  <Detail label="Season total" value={`${fmt(current.total_rainfall)} mm`} />
                  <Detail label="% of average" value={`${fmt(current.percent_against_avg, 1)}%`} />
                </dl>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground">Click a day to view it on the map</span>
                </div>
                <div className="mt-2">
                  <SeriesChart
                    data={points}
                    kind={metric === "rain_last_24hrs" ? "bar" : "area"}
                    unit={m.unit}
                    selectedDate={date}
                    onSelectDate={setDate}
                  />
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Select a taluka on the map</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium">Highest {m.short.toLowerCase()}</h3>
            <ol className="mt-2 divide-y">
              {wettest.map((r, i) => {
                const key = String(r.taluka).toLowerCase()
                return (
                  <li key={key}>
                    <button
                      onClick={() => setSelected(key)}
                      className={cn(
                        "flex w-full items-center gap-3 py-2 text-left text-sm hover:text-primary",
                        key === selected && "text-primary",
                      )}
                    >
                      <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 truncate">
                        {r.taluka} <span className="text-muted-foreground">· {r.district}</span>
                      </span>
                      <span className="tabular-nums">
                        {fmt(r[metric], metric === "percent_against_avg" ? 1 : 0)} {m.unit}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reservoirs
// ---------------------------------------------------------------------------
const SEVERITY: Record<string, number> = { "HIGH ALERT": 3, ALERT: 2, WARNING: 1 }
const SEVERITY_STYLE: Record<string, string> = {
  "HIGH ALERT": "bg-red-500/10 text-red-700 dark:text-red-400",
  ALERT: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  WARNING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
}
const TYPES: Record<string, string> = { G: "Gated", UG: "Ungated", FG: "Fuse gate" }

function warningOf(r: any) {
  return String(r?.Warning ?? "").toUpperCase().replace(/\s+/g, " ").trim()
}

function WarningBadge({ w }: { w: string }) {
  if (!SEVERITY[w]) return null
  return <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", SEVERITY_STYLE[w])}>{titleCase(w.toLowerCase())}</span>
}

function ReservoirView({ points, boundary }: { points: any; boundary: any }) {
  const [dates, setDates] = useState<string[] | null>(null)
  const [date, setDate] = useState("")
  const [rows, setRows] = useState<any[]>([])
  const [metric, setMetric] = useState<ReservoirMetric>("PercentageFilling")
  const [selected, setSelected] = useState<string | null>(null)
  const [series, setSeries] = useState<any[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    getJSON("/api/reservoir-dates")
      .then((d: string[]) => {
        setDates(d)
        if (d.length) setDate(d[d.length - 1])
      })
      .catch(() => {
        setDates([])
        setError(true)
      })
  }, [])

  useEffect(() => {
    if (!date) return
    getJSON(`/api/reservoir-data?date=${encodeURIComponent(date)}`).then(setRows).catch(console.error)
  }, [date])

  const byName = useMemo(() => new Map(rows.map((r) => [normalize(String(r["Name of Schemes"])), r])), [rows])
  const alerts = useMemo(
    () => rows.filter((r) => SEVERITY[warningOf(r)]).sort((a, b) => SEVERITY[warningOf(b)] - SEVERITY[warningOf(a)] || b.PercentageFilling - a.PercentageFilling),
    [rows],
  )

  useEffect(() => {
    if (!selected && rows.length) {
      const first = alerts[0] ?? rows.reduce((a, b) => (b.PercentageFilling > a.PercentageFilling ? b : a))
      setSelected(first["Name of Schemes"])
    }
  }, [rows, alerts, selected])

  const current = selected ? byName.get(normalize(selected)) : null
  useEffect(() => {
    if (!current) return
    getJSON(`/api/reservoir-data?reservoir=${encodeURIComponent(current["Name of Schemes"])}`).then(setSeries).catch(console.error)
  }, [current])

  const chartPoints: Point[] = useMemo(
    () =>
      series
        .map((r) => ({ date: r.date, value: Number(r[metric]) || 0 }))
        .sort((a, b) => dmyToDate(a.date).getTime() - dmyToDate(b.date).getTime()),
    [series, metric],
  )

  if (dates === null) return <MapSkeletonBlock />
  if (!dates.length) return <EmptyState error={error} />

  const design = rows.reduce((s, r) => s + (Number(r.DesignGross) || 0), 0)
  const present = rows.reduce((s, r) => s + (Number(r.PresentGross) || 0), 0)
  const statePct = design ? (present / design) * 100 : rows.reduce((s, r) => s + (Number(r.PercentageFilling) || 0), 0) / (rows.length || 1)
  const over90 = rows.filter((r) => r.PercentageFilling >= 90).length
  const inflow = rows.reduce((s, r) => s + (Number(r.InflowinCusecs) || 0), 0)
  const rm = RESERVOIR_METRICS[metric]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDatePicker
          selectedDate={date ? dmyToDate(date) : undefined}
          onDateChange={(d) => d && setDate(dateToDmy(d))}
          availableDates={dates}
          className="w-auto"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Statewide storage"
          value={fmt(statePct, 1)}
          unit="%"
          note={design ? `${fmt(present)} of ${fmt(design)} MCM` : `${rows.length} dams`}
        />
        <Stat label="Dams 90% full or more" value={fmt(over90)} unit={`/ ${rows.length}`} />
        <Stat label="Dams on alert" value={fmt(alerts.length)} note={`${alerts.filter((a) => warningOf(a) === "HIGH ALERT").length} on high alert`} />
        <Stat label="Total inflow" value={fmt(inflow)} unit="cusecs" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="isolate overflow-hidden">
          <div className="h-[460px] sm:h-[560px]">
            {points && <ReservoirMap points={points} boundary={boundary} rows={byName} selected={selected} onSelect={setSelected} />}
          </div>
          <Legend title="Storage (% of design)" labels={FILLING.classLabels} points />
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            {current ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{current["Name of Schemes"]}</h2>
                    <p className="text-sm text-muted-foreground">
                      {[current.Taluka, current.District].filter(Boolean).join(", ")}
                      {current.Type ? ` · ${TYPES[current.Type] ?? current.Type}` : ""}
                    </p>
                  </div>
                  <WarningBadge w={warningOf(current)} />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3">
                  <Detail label="Storage" value={`${fmt(current.PercentageFilling, 1)}%`} />
                  <Detail label="Inflow" value={`${fmt(current.InflowinCusecs)} cusecs`} />
                  <Detail label="River outflow" value={`${fmt(current.OutflowRiverinCusecs)} cusecs`} />
                  {current.DesignGross != null && (
                    <>
                      <Detail label="Present / design" value={`${fmt(current.PresentGross, 1)} / ${fmt(current.DesignGross, 1)} MCM`} />
                      <Detail label="Water level" value={`${fmt(current.PWL, 2)} m`} />
                      <Detail label="Full level" value={`${fmt(current.FRL, 2)} m`} />
                    </>
                  )}
                </dl>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <Segmented
                    size="sm"
                    value={metric}
                    onChange={setMetric}
                    options={(Object.keys(RESERVOIR_METRICS) as ReservoirMetric[]).map((k) => ({ value: k, label: RESERVOIR_METRICS[k].short }))}
                  />
                </div>
                <div className="mt-3">
                  <SeriesChart data={chartPoints} kind="area" unit={rm.unit} selectedDate={date} onSelectDate={setDate} />
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Select a dam on the map</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium">Alerts {alerts.length > 0 && <span className="text-muted-foreground">· {alerts.length}</span>}</h3>
            {alerts.length ? (
              <ul className="mt-2 max-h-[280px] divide-y overflow-y-auto">
                {alerts.map((r) => (
                  <li key={r["Name of Schemes"]}>
                    <button
                      onClick={() => setSelected(r["Name of Schemes"])}
                      className="flex w-full items-center gap-3 py-2 text-left text-sm hover:text-primary"
                    >
                      <span className="flex-1 truncate">
                        {r["Name of Schemes"]} {r.District && <span className="text-muted-foreground">· {r.District}</span>}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{fmt(r.PercentageFilling, 0)}%</span>
                      <WarningBadge w={warningOf(r)} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No dams on alert.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function MapSkeletonBlock() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-[560px] animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

// ---------------------------------------------------------------------------
export default function MapsPage() {
  const [tab, setTab] = useState<"rainfall" | "reservoir">("rainfall")
  const [talukas, setTalukas] = useState<any>(null)
  const [reservoirPoints, setReservoirPoints] = useState<any>(null)
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    getJSON("/gujarat_tehsil.geojson").then(setTalukas).catch(console.error)
    getJSON("/Reservoir_ID_Location.geojson").then(setReservoirPoints).catch(console.error)
    getJSON("/api/status").then(setStatus).catch(() => {})
  }, [])

  const updated = tab === "rainfall" ? status?.rainfall?.latest : status?.reservoir?.latest

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Gujarat monsoon monitor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Taluka rainfall and reservoir storage from official state reports, updated daily.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updated && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Latest report {prettyDate(updated)}
            </span>
          )}
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "rainfall", label: "Rainfall" },
              { value: "reservoir", label: "Reservoirs" },
            ]}
          />
        </div>
      </div>

      {tab === "rainfall" ? <RainfallView geojson={talukas} /> : reservoirPoints && <ReservoirView points={reservoirPoints} boundary={talukas} />}

      <p className="mt-8 text-xs text-muted-foreground">
        Sources: State Emergency Operation Centre, Gujarat (taluka rainfall) · Narmada, Water Resources, Water Supply &amp;
        Kalpsar Department (dam storage). Rainfall intensity classes follow IMD.
      </p>
    </div>
  )
}
