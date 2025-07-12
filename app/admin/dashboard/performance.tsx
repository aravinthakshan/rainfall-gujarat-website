"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Database, AlertTriangle, CheckCircle } from "lucide-react"

interface ProcessingStats {
  totalUploads: number
  successfulUploads: number
  failedUploads: number
  averageProcessingTime: number
  lastUploadDate?: string
  lastUploadFile?: string
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<ProcessingStats>({
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    averageProcessingTime: 0
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, you'd fetch this from your backend
    // For now, we'll simulate some stats
    const mockStats: ProcessingStats = {
      totalUploads: 15,
      successfulUploads: 13,
      failedUploads: 2,
      averageProcessingTime: 4500, // 4.5 seconds
      lastUploadDate: "2024-01-15",
      lastUploadFile: "rainfall_report_15_01_2024.pdf"
    }
    
    setTimeout(() => {
      setStats(mockStats)
      setIsLoading(false)
    }, 1000)
  }, [])

  const successRate = stats.totalUploads > 0 
    ? ((stats.successfulUploads / stats.totalUploads) * 100).toFixed(1)
    : "0"

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successfulUploads}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failedUploads}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Success Rate</span>
          <Badge variant={parseFloat(successRate) > 90 ? "default" : "destructive"}>
            {successRate}%
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Processing Time</span>
          <span className="text-sm font-medium">
            {(stats.averageProcessingTime / 1000).toFixed(1)}s
          </span>
        </div>
        
        {stats.lastUploadDate && (
          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600">Last Upload</div>
            <div className="text-sm font-medium">{stats.lastUploadDate}</div>
            {stats.lastUploadFile && (
              <div className="text-xs text-gray-500 truncate">{stats.lastUploadFile}</div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>System operational</span>
        </div>
      </CardContent>
    </Card>
  )
} 