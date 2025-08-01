"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Calendar, LogOut, User, FileText as FilePdf } from "lucide-react"
import { useAuth } from "../../../research-blog/lib/auth-context"
import { uploadMarkdownPost, uploadPDFFile } from "./actions"
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker"
import PerformanceMonitor from "./performance"

export default function AdminDashboard() {
  const [markdownFile, setMarkdownFile] = useState<File | null>(null)
  const [images, setImages] = useState<FileList | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfDate, setPdfDate] = useState<Date | undefined>(undefined)
  const [isUploading, setIsUploading] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvDate, setCsvDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  const handleMarkdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!markdownFile) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("markdown", markdownFile)

    if (images) {
      Array.from(images).forEach((image, index) => {
        formData.append(`image-${index}`, image)
      })
    }

    try {
      await uploadMarkdownPost(formData)
      alert("Post uploaded successfully!")
      setMarkdownFile(null)
      setImages(null)
    } catch (error) {
      alert("Error uploading post")
    } finally {
      setIsUploading(false)
    }
  }

  const handlePDFSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfFile || !pdfDate) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("pdf", pdfFile)
    
    // Convert date to DD/MM/YYYY format
    const day = pdfDate.getDate().toString().padStart(2, '0')
    const month = (pdfDate.getMonth() + 1).toString().padStart(2, '0')
    const year = pdfDate.getFullYear()
    const dateString = `${day}/${month}/${year}`
    formData.append("date", dateString)

    try {
      console.log(`Processing PDF: ${pdfFile.name}, Size: ${pdfFile.size} bytes, Date: ${dateString}`)
      const result = await uploadPDFFile(formData)
      alert(result.message)
      setPdfFile(null)
      setPdfDate(undefined)
    } catch (error) {
      console.error('PDF upload error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Error processing PDF file'
      if (error instanceof Error) {
        if (error.message.includes('Python is not available')) {
          errorMessage = 'Python is not available in the production environment. Please contact the administrator.'
        } else if (error.message.includes('Missing required Python package')) {
          errorMessage = 'Required Python packages are not installed. Please contact the administrator.'
        } else if (error.message.includes('PDF processing timed out')) {
          errorMessage = 'PDF processing took too long. Please try with a smaller file.'
        } else if (error.message.includes('PDF file size must be less than 10MB')) {
          errorMessage = 'PDF file is too large. Please use a file smaller than 10MB.'
        } else if (error.message.includes('File must be a PDF')) {
          errorMessage = 'Please upload a valid PDF file.'
        } else if (error.message.includes('read-only file system') || error.message.includes('EROFS')) {
          errorMessage = 'Serverless environment detected. PDF processing requires a writable environment. Please contact administrator to configure external PDF processing service.'
        } else if (error.message.includes('Production environment has read-only file system')) {
          errorMessage = 'PDF processing is not available in this environment. Please use CSV upload or contact administrator for alternative solutions.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage rainfall and reservoir data uploads</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>admin@research.com</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="pdf" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <FilePdf className="w-4 h-4" />
                  Rainfall PDF Upload
                </TabsTrigger>
                <TabsTrigger value="reservoir-csv" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Reservoir CSV Upload
                </TabsTrigger>
              </TabsList>

          <TabsContent value="pdf">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <FilePdf className="w-5 h-5" />
                  Rainfall PDF Upload
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Upload a rainfall PDF report to automatically parse and upload the data to MongoDB
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePDFSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="pdf">PDF File</Label>
                    <Input
                      id="pdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
                    />
                    <p className="text-sm text-gray-500">Upload a rainfall report PDF to parse and upload to database</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pdf-date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Report Date
                    </Label>
                    <CalendarDatePicker
                      selectedDate={pdfDate}
                      onDateChange={setPdfDate}
                      availableDates={[]}
                      allowAnyDate={true}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500">The date this rainfall report represents</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={!pdfFile || !pdfDate || isUploading}
                    className="bg-primary hover:bg-primary/80"
                  >
                    {isUploading ? "Processing..." : "Upload PDF to Database"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservoir-csv">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Upload className="w-5 h-5" />
                  Reservoir CSV Upload
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Upload a CSV file containing reservoir metadata. (This is a placeholder, logic not implemented yet.)
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="reservoir-csv">CSV File</Label>
                    <Input
                      id="reservoir-csv"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80"
                    />
                    <p className="text-sm text-gray-500">Upload a CSV file with reservoir data. (No backend logic yet.)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csv-date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Report Date
                    </Label>
                    <CalendarDatePicker
                      selectedDate={csvDate}
                      onDateChange={setCsvDate}
                      availableDates={[]}
                      allowAnyDate={true}
                      className="max-w-xs"
                    />
                    <p className="text-sm text-gray-500">The date this reservoir CSV represents</p>
                  </div>
                  <Button type="button" disabled className="bg-muted cursor-not-allowed">
                    Upload CSV (Coming Soon)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="lg:col-span-1">
        <PerformanceMonitor />
      </div>
    </div>
      </main>
    </div>
  )
} 