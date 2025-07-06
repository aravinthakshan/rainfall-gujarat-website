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
      const result = await uploadPDFFile(formData)
      alert(result.message)
      setPdfFile(null)
      setPdfDate(undefined)
    } catch (error) {
      alert(`Error processing PDF file: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
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
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
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
                    className="bg-gray-900 hover:bg-gray-800"
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
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
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
                  <Button type="button" disabled className="bg-gray-400 cursor-not-allowed">
                    Upload CSV (Coming Soon)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 