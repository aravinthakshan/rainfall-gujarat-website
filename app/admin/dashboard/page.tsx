"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Database, Calendar, LogOut, User } from "lucide-react"
import { useAuth } from "../../../research-blog/lib/auth-context"
import { uploadMarkdownPost, uploadCSVFile } from "./actions"

export default function AdminDashboard() {
  const [markdownFile, setMarkdownFile] = useState<File | null>(null)
  const [images, setImages] = useState<FileList | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvDate, setCsvDate] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const router = useRouter()

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

  const handleCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile || !csvDate) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("csv", csvFile)
    formData.append("date", csvDate)

    try {
      await uploadCSVFile(formData)
      alert("CSV file processed successfully!")
      setCsvFile(null)
      setCsvDate("")
    } catch (error) {
      alert("Error processing CSV file")
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
              <p className="text-gray-600 mt-1">Manage blog posts and data uploads</p>
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
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Blog Posts
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-5 h-4" />
              Data Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Upload className="w-5 h-5" />
                  Upload New Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMarkdownSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="markdown">Markdown File</Label>
                    <Input
                      id="markdown"
                      type="file"
                      accept=".md,.markdown"
                      onChange={(e) => setMarkdownFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">Supporting Images (optional)</Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setImages(e.target.files)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    <p className="text-sm text-gray-500">Upload images that are referenced in your markdown file</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={!markdownFile || isUploading}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    {isUploading ? "Uploading..." : "Upload Post"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <Database className="w-5 h-5" />
                  CSV Data Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCSVSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="csv">CSV File</Label>
                    <Input
                      id="csv"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Associated Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={csvDate}
                      onChange={(e) => setCsvDate(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!csvFile || !csvDate || isUploading}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    {isUploading ? "Processing..." : "Process CSV"}
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