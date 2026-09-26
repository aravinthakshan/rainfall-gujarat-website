// Shared helpers for the maps page: metric definitions, colour classes and
// taluka-name matching between the boundary GeoJSON and the SEOC reports.

// Single-hue blue ramp (light -> dark) for sequential magnitude.
export const RAMP = ["#e6ecf3", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#1c5cab", "#0d366b"]
// Dark mode: low values recede toward the dark surface, high values glow.
export const RAMP_DARK = ["#2b3037", "#123a6b", "#184f95", "#256abf", "#3987e5", "#6da7ec", "#b7d3f6"]
// Point markers must stay visible against the basemap, so their darkest step
// can't recede into the dark surface.
export const RAMP_DARK_POINTS = ["#184f95", "#1c5cab", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"]
export const ramp = (dark: boolean, points = false) => (dark ? (points ? RAMP_DARK_POINTS : RAMP_DARK) : RAMP)
export const NO_DATA = "transparent"

export type RainMetric = "rain_last_24hrs" | "total_rainfall" | "percent_against_avg"

type MetricDef = {
  label: string
  short: string
  unit: string
  // thresholds between the 7 classes (6 values)
  thresholds: number[]
  classLabels: string[]
}

export const RAIN_METRICS: Record<RainMetric, MetricDef> = {
  rain_last_24hrs: {
    label: "Rain in last 24 hours",
    short: "24 hours",
    unit: "mm",
    // IMD daily rainfall intensity classes
    thresholds: [0.1, 2.5, 15.6, 64.5, 115.6, 204.5],
    classLabels: ["None", "Very light", "Light", "Moderate", "Heavy", "Very heavy", "Extremely heavy"],
  },
  total_rainfall: {
    label: "Season total",
    short: "Season total",
    unit: "mm",
    thresholds: [100, 250, 500, 750, 1000, 1500],
    classLabels: ["<100", "100–250", "250–500", "500–750", "750–1000", "1000–1500", "≥1500"],
  },
  percent_against_avg: {
    label: "% of annual average",
    short: "% of average",
    unit: "%",
    thresholds: [25, 50, 75, 100, 125, 150],
    classLabels: ["<25", "25–50", "50–75", "75–100", "100–125", "125–150", "≥150"],
  },
}

export type ReservoirMetric = "PercentageFilling" | "InflowinCusecs" | "OutflowRiverinCusecs"

export const RESERVOIR_METRICS: Record<ReservoirMetric, { label: string; short: string; unit: string }> = {
  PercentageFilling: { label: "Storage (% of design)", short: "% full", unit: "%" },
  InflowinCusecs: { label: "Inflow", short: "Inflow", unit: "cusecs" },
  OutflowRiverinCusecs: { label: "River outflow", short: "Outflow", unit: "cusecs" },
}

export const FILLING = {
  thresholds: [25, 50, 70, 80, 90, 100],
  classLabels: ["<25", "25–50", "50–70", "70–80", "80–90", "90–100", "Full"],
}

export function classify(value: number | null | undefined, thresholds: number[]) {
  if (value == null || Number.isNaN(value)) return -1
  let i = 0
  while (i < thresholds.length && value >= thresholds[i]) i++
  return i
}

export function colorFor(value: number | null | undefined, thresholds: number[], dark = false, points = false) {
  const i = classify(value, thresholds)
  return i < 0 ? NO_DATA : ramp(dark, points)[i]
}

// "24/09/2026" -> "24 Sep 2026"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
export function prettyDate(dmy?: string | null, withYear = true) {
  if (!dmy) return ""
  const [d, m, y] = dmy.split("/")
  if (!y) return dmy
  return `${Number(d)} ${MONTHS[Number(m) - 1]}${withYear ? ` ${y}` : ""}`
}

export function dmyToDate(dmy: string) {
  const [d, m, y] = dmy.split("/").map(Number)
  return new Date(y, m - 1, d)
}

export function dateToDmy(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

export function fmt(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return "–"
  return value.toLocaleString("en-IN", { maximumFractionDigits: digits })
}

// ---------------------------------------------------------------------------
// Boundary GeoJSON -> report taluka name
// The GeoJSON's District field is mangled (A -> '>', U -> '@', I -> '|').
// ---------------------------------------------------------------------------
function geoDistrict(raw: string) {
  return (raw || "").replace(/>/g, "A").replace(/@/g, "U").replace(/\|/g, "I").toUpperCase()
}

const DUPLICATES: Record<string, Record<string, string>> = {
  kalol: { GANDHINAGAR: "kalol(gandhinagar)" },
  mahuva: { BHAVNAGAR: "mahuva (bhavnagar)" },
  mangrol: { JUNAGADH: "mangrol(junagadh)" },
  maliya: { JUNAGADH: "maliya hatina" },
}

const ALIASES: Record<string, string> = {
  bansda: "vansada",
  valabhipur: "vallabhipur",
}

export function talukaKey(props: { Tehsil_new?: string; District?: string }) {
  const name = (props.Tehsil_new || "").trim().toLowerCase()
  const dup = DUPLICATES[name]?.[geoDistrict(props.District || "")]
  return dup ?? ALIASES[name] ?? name
}

export function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

// Scheme names vary in spacing between reports ("Ozat- Weir" vs "Ozat-Weir")
export function normalize(name: string) {
  return name.toLowerCase().replace(/\s+/g, "")
}
