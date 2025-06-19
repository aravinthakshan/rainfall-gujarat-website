"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Info, FileText, Map, Database } from "lucide-react"

type CsvRow = Record<string, string>
type GeoJsonFeature = {
  properties: {
    Tehsil_new: string
    [key: string]: any
  }
  [key: string]: any
}

type GeoJson = {
  features: GeoJsonFeature[]
  [key: string]: any
}

type FileStatus = {
  filename: string
  status: 'success' | 'error' | 'loading'
  error?: string
  columns?: string[]
  rowCount?: number
}

type GeoJsonStatus = {
  status: 'success' | 'error' | 'loading'
  error?: string
  features?: GeoJsonFeature[]
  tehsilNames?: string[]
}

type MatchingAnalysis = {
  csvTehsils: string[]
  geojsonTehsils: string[]
  matching: string[]
  csvOnly: string[]
  geojsonOnly: string[]
  matchPercentage: number
}

const TestPage: React.FC = () => {
  const [csvFilesList, setCsvFilesList] = useState<string[]>([])
  const [csvFiles, setCsvFiles] = useState<FileStatus[]>([])
  const [geojsonStatus, setGeojsonStatus] = useState<GeoJsonStatus>({ status: 'loading' })
  const [matchingAnalysis, setMatchingAnalysis] = useState<MatchingAnalysis | null>(null)
  const [overallStatus, setOverallStatus] = useState<'loading' | 'success' | 'error'>('loading')

  // Fetch CSV file list from API on mount
  useEffect(() => {
    fetch('/api/csv-files')
      .then(res => res.json())
      .then(data => setCsvFilesList(data.files))
  }, [])

  // Load and analyze CSV files
  useEffect(() => {
    const loadCsvFiles = async () => {
      const fileStatuses: FileStatus[] = []
      for (const filename of csvFilesList) {
        try {
          const response = await fetch(`/${filename}`)
          if (!response.ok) {
            fileStatuses.push({
              filename,
              status: 'error',
              error: `HTTP ${response.status}: ${response.statusText}`
            })
            continue
          }
          const text = await response.text()
          const rows = text.split("\n").filter(Boolean)
          if (rows.length === 0) {
            fileStatuses.push({
              filename,
              status: 'error',
              error: 'Empty file'
            })
            continue
          }
          const headers = rows[0].split(",").map(h => h.trim())
          const data = rows.slice(1)
          fileStatuses.push({
            filename,
            status: 'success',
            columns: headers,
            rowCount: data.length
          })
        } catch (error) {
          fileStatuses.push({
            filename,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      setCsvFiles(fileStatuses)
    }
    if (csvFilesList.length > 0) {
      loadCsvFiles()
    }
  }, [csvFilesList])

  // Load and analyze GeoJSON
  useEffect(() => {
    const loadGeoJson = async () => {
      try {
        const response = await fetch("/gujarat_tehsil.geojson")
        if (!response.ok) {
          setGeojsonStatus({
            status: 'error',
            error: `HTTP ${response.status}: ${response.statusText}`
          })
          return
        }
        
        const geojson: GeoJson = await response.json()
        const tehsilNames = geojson.features?.map(f => f.properties.Tehsil_new) || []
        
        setGeojsonStatus({
          status: 'success',
          features: geojson.features,
          tehsilNames
        })
      } catch (error) {
        setGeojsonStatus({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    loadGeoJson()
  }, [])

  // Analyze matching between CSV and GeoJSON
  useEffect(() => {
    if (csvFiles.length > 0 && geojsonStatus.status === 'success') {
      // Use the first successful CSV file for comparison
      const firstCsv = csvFiles.find(f => f.status === 'success')
      if (!firstCsv) return
      
      // Load the first CSV to get tehsil names
      fetch(`/${firstCsv.filename}`)
        .then(res => res.text())
        .then(text => {
          const rows = text.split("\n").filter(Boolean)
          const headers = rows[0].split(",").map(h => h.trim())
          const data = rows.slice(1)
          
          const csvTehsils = data
            .map(row => {
              const values = row.split(",")
              const talukaIndex = headers.findIndex(h => h === 'taluka')
              return talukaIndex >= 0 ? values[talukaIndex]?.trim() : null
            })
            .filter(Boolean)
            .map(t => t?.toLowerCase())
            .filter(Boolean) as string[]
          
          const geojsonTehsils = geojsonStatus.tehsilNames?.map(t => t.toLowerCase()) || []
          
          const matching = csvTehsils.filter(t => geojsonTehsils.includes(t))
          const csvOnly = csvTehsils.filter(t => !geojsonTehsils.includes(t))
          const geojsonOnly = geojsonTehsils.filter(t => !csvTehsils.includes(t))
          
          const matchPercentage = geojsonTehsils.length > 0 
            ? (matching.length / geojsonTehsils.length) * 100 
            : 0
          
          setMatchingAnalysis({
            csvTehsils,
            geojsonTehsils,
            matching,
            csvOnly,
            geojsonOnly,
            matchPercentage
          })
        })
        .catch(error => {
          console.error('Error analyzing matching:', error)
        })
    }
  }, [csvFiles, geojsonStatus])

  // Update overall status
  useEffect(() => {
    const csvErrors = csvFiles.filter(f => f.status === 'error').length
    const hasGeoJsonError = geojsonStatus.status === 'error'
    
    if (csvErrors > 0 || hasGeoJsonError) {
      setOverallStatus('error')
    } else if (csvFiles.length > 0 && geojsonStatus.status !== 'loading') {
      setOverallStatus('success')
    }
  }, [csvFiles, geojsonStatus])

  const getStatusIcon = (status: 'success' | 'error' | 'loading') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'loading': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: 'success' | 'error' | 'loading') => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'loading': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Debug & Test Dashboard</h2>
          <p className="text-muted-foreground">Monitor data loading, file availability, and column matching</p>
        </div>

        {/* Overall Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(overallStatus)}>
              {overallStatus === 'loading' ? 'Loading...' : 
               overallStatus === 'success' ? 'All Systems Operational' : 
               'Issues Detected'}
            </Badge>
          </CardContent>
        </Card>

        {/* CSV Files Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Files Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {csvFiles.map((file) => (
                <div key={file.filename} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{file.filename}</h4>
                    {getStatusIcon(file.status)}
                  </div>
                  
                  {file.status === 'success' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Rows: {file.rowCount}</Badge>
                        <Badge variant="outline">Columns: {file.columns?.length}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {file.columns?.map((col, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{file.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* GeoJSON Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              GeoJSON Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>gujarat_tehsil.geojson</span>
              {getStatusIcon(geojsonStatus.status)}
            </div>
            
            {geojsonStatus.status === 'success' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Features: {geojsonStatus.features?.length}</Badge>
                  <Badge variant="outline">Tehsils: {geojsonStatus.tehsilNames?.length}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Sample Tehsil Names:</p>
                  <div className="flex flex-wrap gap-1">
                    {geojsonStatus.tehsilNames?.slice(0, 10).map((tehsil, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tehsil}
                      </Badge>
                    ))}
                    {geojsonStatus.tehsilNames && geojsonStatus.tehsilNames.length > 10 && (
                      <Badge variant="secondary" className="text-xs">
                        +{geojsonStatus.tehsilNames.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {geojsonStatus.status === 'error' && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>{geojsonStatus.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Matching Analysis */}
        {matchingAnalysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Matching Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {matchingAnalysis.matching.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Matching Tehsils</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {matchingAnalysis.csvOnly.length}
                    </div>
                    <div className="text-sm text-muted-foreground">CSV Only</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {matchingAnalysis.geojsonOnly.length}
                    </div>
                    <div className="text-sm text-muted-foreground">GeoJSON Only</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    Match Rate: {matchingAnalysis.matchPercentage.toFixed(1)}%
                  </div>
                </div>
                
                {matchingAnalysis.csvOnly.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tehsils in CSV but not in GeoJSON:</p>
                    <div className="flex flex-wrap gap-1">
                      {matchingAnalysis.csvOnly.slice(0, 20).map((tehsil, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tehsil}
                        </Badge>
                      ))}
                      {matchingAnalysis.csvOnly.length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{matchingAnalysis.csvOnly.length - 20} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {matchingAnalysis.geojsonOnly.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tehsils in GeoJSON but not in CSV:</p>
                    <div className="flex flex-wrap gap-1">
                      {matchingAnalysis.geojsonOnly.slice(0, 20).map((tehsil, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tehsil}
                        </Badge>
                      ))}
                      {matchingAnalysis.geojsonOnly.length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{matchingAnalysis.geojsonOnly.length - 20} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overallStatus === 'error' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Some files failed to load. Check that all CSV files and the GeoJSON file are present in the public directory.
                  </AlertDescription>
                </Alert>
              )}
              
              {matchingAnalysis && matchingAnalysis.matchPercentage < 80 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Low match rate between CSV and GeoJSON tehsil names. Consider standardizing tehsil name formats.
                  </AlertDescription>
                </Alert>
              )}
              
              {matchingAnalysis && matchingAnalysis.matchPercentage >= 80 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Good match rate between CSV and GeoJSON data. The map should display correctly.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TestPage 