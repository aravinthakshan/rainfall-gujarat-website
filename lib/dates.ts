// All data is stored with dates as "DD/MM/YYYY" strings.

export function parseDMY(value: string): number {
  const m = value?.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
  if (!m) return NaN
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

export function sortDates(dates: string[]): string[] {
  return dates
    .filter((d) => !Number.isNaN(parseDMY(d)))
    .sort((a, b) => parseDMY(a) - parseDMY(b))
}
