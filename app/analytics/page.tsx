"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart } from "@/components/charts"
import { DashboardHeader } from "@/components/dashboard-header"
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts"

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
  const COLORS = ["#3b82f6", "#ef4444"] // blue, red
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

export default function AnalyticsPage() {
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
    <div className="flex flex-col">
      <DashboardHeader />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold">Rainfall Report</h3>
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
        </div>
        <Tabs defaultValue="adherence" className="space-y-4">
          <TabsList>
            <TabsTrigger value="adherence">Adherence Analysis</TabsTrigger>
            <TabsTrigger value="agent">Agent Performance</TabsTrigger>
            <TabsTrigger value="customer">Customer Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          <TabsContent value="adherence" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Adherence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87.5%</div>
                  <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Adherence Issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Script Deviation</div>
                  <p className="text-xs text-muted-foreground">35% of all issues</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12.3%</div>
                  <p className="text-xs text-muted-foreground">Quarter-over-quarter</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Adherence by Script Section</CardTitle>
                  <CardDescription>Breakdown of adherence by script section</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <BarChart />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Adherence Reasons</CardTitle>
                  <CardDescription>Common reasons for non-adherence</CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="agent" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Emily Davis</div>
                  <p className="text-xs text-muted-foreground">94% adherence rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Michael Brown</div>
                  <p className="text-xs text-muted-foreground">68% adherence rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Most Improved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Sarah Johnson</div>
                  <p className="text-xs text-muted-foreground">+15% improvement</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Agent Performance Comparison</CardTitle>
                  <CardDescription>Performance metrics by agent</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <BarChart />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Agent Improvement Trends</CardTitle>
                  <CardDescription>Performance improvement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="customer" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Positive</div>
                  <p className="text-xs text-muted-foreground">65% of all calls</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Customer Issue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Billing Questions</div>
                  <p className="text-xs text-muted-foreground">28% of all calls</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-muted-foreground">+3% from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Customer Sentiment Trends</CardTitle>
                  <CardDescription>Sentiment analysis over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Customer Issues</CardTitle>
                  <CardDescription>Distribution of customer issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Call Volume Trends</CardTitle>
                  <CardDescription>Call volume over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <LineChart />
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Performance Metrics Over Time</CardTitle>
                  <CardDescription>Key metrics trending</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Comparison</CardTitle>
                <CardDescription>Performance comparison by quarter</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <BarChart />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
