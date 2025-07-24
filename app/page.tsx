"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Smartphone,
  Monitor,
  Palette,
  Settings,
  Zap,
  Shield,
  FileCheck,
  Clock,
  Type,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface ConversionResult {
  success: boolean
  filename: string
  content?: string
  error?: string
  subtitleCount?: number
}

export default function SRTtoASSConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const srtFile = files.find((file) => file.name.toLowerCase().endsWith(".srt"))

    if (srtFile) {
      setFile(srtFile)
      setResult(null)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".srt")) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const convertFile = async () => {
    if (!file) return

    setIsConverting(true)
    setResult(null)
    setConversionProgress(0)

    // Simulate instant progress for better UX
    const progressInterval = setInterval(() => {
      setConversionProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 100)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      })

      const result: ConversionResult = await response.json()

      // Complete the progress
      setConversionProgress(100)

      setTimeout(() => {
        setResult(result)
        clearInterval(progressInterval)
      }, 300)
    } catch (error) {
      clearInterval(progressInterval)
      setResult({
        success: false,
        filename: file.name,
        error: "Network error occurred during conversion",
      })
    } finally {
      setTimeout(() => {
        setIsConverting(false)
        setConversionProgress(0)
      }, 500)
    }
  }

  const downloadFile = () => {
    if (!result?.content) return

    const blob = new Blob([result.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = result.filename.replace(".srt", ".ass")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetConverter = () => {
    setFile(null)
    setResult(null)
    setIsConverting(false)
    setConversionProgress(0)
  }

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Instant Conversion",
      description: "Lightning-fast processing with real-time feedback",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Auto Encoding",
      description: "Detects and handles all text encodings automatically",
    },
    {
      icon: <Type className="w-5 h-5" />,
      title: "Smart Formatting",
      description: "Preserves styling and converts HTML tags properly",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Time Validation",
      description: "Fixes timing issues and validates subtitle sequences",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SRT → ASS</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Instant Subtitle Converter</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 hidden sm:flex">
              <Zap className="w-3 h-3 mr-1" />
              Instant
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Professional Subtitle Conversion</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Convert SRT to ASS Format</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Transform your subtitle files with advanced styling support, automatic encoding detection, and professional
            formatting.
          </p>
        </div>

        {/* Main Conversion Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            {!file ? (
              /* File Upload Zone */
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-purple-400 bg-purple-50 scale-[1.02]"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept=".srt" onChange={handleFileSelect} className="hidden" />

                <div className="space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    {dragActive && <div className="absolute inset-0 bg-purple-500/20 rounded-2xl animate-pulse" />}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {dragActive ? "Drop your SRT file here" : "Upload SRT File"}
                    </h3>
                    <p className="text-sm text-gray-500">Drag & drop or click to browse • Max 10MB</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={triggerFileSelect}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Mobile Friendly
                    </Button>
                  </div>

                  {/* Supported formats */}
                  <div className="flex flex-wrap justify-center gap-2 pt-4">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      <FileText className="w-3 h-3 mr-1" />
                      .srt
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      <FileCheck className="w-3 h-3 mr-1" />
                      .ass
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              /* File Selected State */
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800 truncate max-w-[200px] sm:max-w-none">{file.name}</p>
                      <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB • Ready to convert</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetConverter}
                    className="text-green-700 hover:bg-green-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Conversion Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={convertFile}
                    disabled={isConverting}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Convert to ASS
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetConverter}
                    size="lg"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
                  >
                    Choose Different File
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Progress */}
        {isConverting && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Converting subtitle file...</p>
                      <p className="text-sm text-gray-600">Processing encoding and formatting</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {Math.round(conversionProgress)}%
                  </Badge>
                </div>
                <Progress value={conversionProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {result.success ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Successfully converted {result.subtitleCount} subtitles to ASS format
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{result.filename.replace(".srt", ".ass")}</p>
                        <p className="text-sm text-green-600">Ready for download</p>
                      </div>
                    </div>
                    <Button
                      onClick={downloadFile}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download ASS File
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.error || "An unknown error occurred during conversion"}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:scale-[1.02]"
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Advanced Features */}
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Advanced Features
            </CardTitle>
            <CardDescription>Professional subtitle conversion with comprehensive support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <h4 className="font-medium">Encoding Detection</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Automatically detects UTF-8, Latin-1, CP1252, and other encodings
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h4 className="font-medium">Time Validation</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Fixes timing issues and validates subtitle sequences automatically
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-purple-500" />
                  <h4 className="font-medium">HTML Processing</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Converts HTML tags to proper ASS styling with formatting preservation
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <h4 className="font-medium">Style Support</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Includes Default, Title, and Italic styles with professional settings
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-medium">HD Ready</h4>
                </div>
                <p className="text-sm text-gray-600">Optimized for 1920x1080 resolution with scalable settings</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <h4 className="font-medium">Error Recovery</h4>
                </div>
                <p className="text-sm text-gray-600">Robust error handling for malformed subtitles and edge cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
