"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RainfallChart } from "@/components/rainfall-chart"
import { RegionalTable } from "@/components/regional-table"
import { DashboardHeader } from "@/components/dashboard-header"
import { Cloud, Droplets, TrendingUp, AlertTriangle } from "lucide-react"
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

const csvFilesList = [
  "13th June.csv",
  "14th June.csv",
  "15th June.csv",
  "16th June.csv",
  "17th June.csv",
]

const REGION_LABELS = [
  { key: "KUTCHH", match: ["Kachchh", "Kutchh", "Kutch"] },
  { key: "NORTH GUJARAT", match: ["North Gujarat"] },
  { key: "EAST CENTRAL", match: ["East Central Gujarat", "East-CENTRAL GUJARAT"] },
  { key: "SAURASHTRA", match: ["Saurashtra"] },
  { key: "SOUTH GUJARAT", match: ["South Gujarat"] },
]

function parseCSV(text: string): any[] {
  const rows = text.split("\n").filter(Boolean)
  const headers = rows[0].split(",")
  return rows.slice(1).map((row: string) => {
    const values = row.split(",")
    const obj: Record<string, string> = {}
    headers.forEach((h: string, i: number) => (obj[h.trim()] = values[i]?.trim()))
    return obj
  })
}

function aggregateRainfallByRegion(data: any[]): { region: string; rainfall: number; percent: number }[] {
  // For each region, sum total_rainfall and percent_against_avg
  return REGION_LABELS.map(region => {
    const regionRows = data.filter((row: any) => region.match.some((m: string) => row.region?.toLowerCase().includes(m.toLowerCase())))
    // Only use rows with numeric total_rainfall and percent_against_avg
    const totalRainfall = regionRows.reduce((sum: number, row: any) => sum + (parseFloat(row.total_rainfall) || 0), 0)
    const percentAgainstAvg = regionRows.reduce((sum: number, row: any) => sum + (parseFloat(row.percent_against_avg) || 0), 0)
    return {
      region: region.key,
      rainfall: Number(totalRainfall.toFixed(2)),
      percent: Number(percentAgainstAvg.toFixed(2)),
    }
  })
}

function RainfallReportChart({ data }: { data: { region: string; rainfall: number; percent: number }[] }) {
  const COLORS = ["#2563eb", "#f87171"] // blue, red
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fontSize: 14, fontWeight: 600 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value, name) => name === "rainfall" ? [`${value} mm`, "Total Avg. Rainfall"] : [`${value}`, "% Against Avrg Rain"]} />
          <Legend formatter={v => v === "rainfall" ? <span style={{color:COLORS[0]}}>Total Avg. Rainfall (m.m)</span> : <span style={{color:COLORS[1]}}>% Against Avrg Rain</span>} />
          <Bar dataKey="rainfall" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          <Bar dataKey="percent" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(csvFilesList[0])
  const [csvData, setCsvData] = useState<any[]>([])
  const [rainfallData, setRainfallData] = useState<{ region: string; rainfall: number; percent: number }[]>([])

  useEffect(() => {
    fetch(`/${selectedDate}`)
      .then(res => res.text())
      .then(text => {
        const data = parseCSV(text)
        setCsvData(data)
        setRainfallData(aggregateRainfallByRegion(data))
      })
  }, [selectedDate])

  return (
    <div className="flex flex-col w-full">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-green-600">+2 from last year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rainfall (24h)</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22.67mm</div>
              <p className="text-xs text-red-600">-8% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10.46%</div>
              <p className="text-xs text-green-600">+5.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+0.3 from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="regional">Regional</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Rainfall Report</CardTitle>
                  <CardDescription>Region-wise rainfall and % against average (select date)</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    >
                      {csvFilesList.map(f => (
                        <option key={f} value={f}>{f.replace(/\.csv$/, "")}</option>
                      ))}
                    </select>
                  </div>
                  <RainfallReportChart data={rainfallData} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Regional Distribution</CardTitle>
                  <CardDescription>Rainfall distribution across regions</CardDescription>
                </CardHeader>
                <CardContent>
                  <RegionalTable />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regional" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Regional Analysis</CardTitle>
                <CardDescription>Detailed regional rainfall data</CardDescription>
              </CardHeader>
              <CardContent>
                <RegionalTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and data quality metrics</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <RainfallChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Current weather alerts and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Heavy Rainfall Warning</p>
                      <p className="text-sm text-muted-foreground">North Gujarat - Expected 50mm+ in next 24h</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs">
                      High
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Moderate Rainfall</p>
                      <p className="text-sm text-muted-foreground">East Central - 20-30mm expected</p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs">
                      Medium
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Light Showers</p>
                      <p className="text-sm text-muted-foreground">Saurashtra - Light rainfall expected</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                      Low
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
