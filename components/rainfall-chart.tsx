"use client"

import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

const rainfallData = [
  { date: "Jan 15", rainfall: 12, label: "15" },
  { date: "Jan 20", rainfall: 8, label: "20" },
  { date: "Jan 25", rainfall: 25, label: "25" },
  { date: "Jan 30", rainfall: 45, label: "30" },
  { date: "Feb 5", rainfall: 32, label: "5" },
]

const COLORS = ["#3b82f6", "#ef4444"] // Blue and red colors

export function RainfallChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={rainfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value}mm`, "Rainfall"]} labelFormatter={(label) => `Date: ${label}`} />
          <Bar dataKey="rainfall" radius={[4, 4, 0, 0]}>
            {rainfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.rainfall > 30 ? COLORS[1] : COLORS[0]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
