"use client"

import { Badge } from "@/components/ui/badge"

const regionalData = [
  {
    region: "KUTCHH",
    districts: "1 districts • 10 talukas",
    rainfall24h: "51.2mm",
    totalAvg: "84.8mm",
    percentage: "17.6%",
    status: "good",
  },
  {
    region: "NORTH GUJARAT",
    districts: "7 districts • 45 talukas",
    rainfall24h: "14.0mm",
    totalAvg: "41.3mm",
    percentage: "-5.8%",
    status: "poor",
  },
  {
    region: "EAST CENTRAL",
    districts: "4 districts • 28 talukas",
    rainfall24h: "18.6mm",
    totalAvg: "78.6mm",
    percentage: "-9.8%",
    status: "moderate",
  },
  {
    region: "SAURASHTRA",
    districts: "11 districts • 87 talukas",
    rainfall24h: "32.5mm",
    totalAvg: "143.4mm",
    percentage: "19.2%",
    status: "good",
  },
  {
    region: "SOUTH GUJARAT",
    districts: "5 districts • 35 talukas",
    rainfall24h: "14.6mm",
    totalAvg: "81.2mm",
    percentage: "-5.5%",
    status: "poor",
  },
]

export function RegionalTable() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground pb-2">
        <div>Region</div>
        <div>24h Rainfall</div>
        <div>Total Avg</div>
        <div>% vs Avg</div>
        <div>Status</div>
      </div>

      {regionalData.map((region, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 items-center py-3 border-b border-border/50">
          <div>
            <p className="font-medium">{region.region}</p>
            <p className="text-xs text-muted-foreground">{region.districts}</p>
          </div>
          <div className="font-medium">{region.rainfall24h}</div>
          <div className="text-muted-foreground">{region.totalAvg}</div>
          <div className={`font-medium ${region.percentage.startsWith("-") ? "text-red-600" : "text-green-600"}`}>
            {region.percentage}
          </div>
          <div>
            <Badge
              variant={
                region.status === "good" ? "default" : region.status === "moderate" ? "secondary" : "destructive"
              }
              className="text-xs"
            >
              {region.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
