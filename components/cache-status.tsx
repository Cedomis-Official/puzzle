"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameCache } from "@/lib/game-cache"
import { Download, Upload, Trash2, Info, HardDrive } from "lucide-react"

export function CacheStatus() {
  const cacheManager = useGameCache()
  const [cacheSize, setCacheSize] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setCacheSize(cacheManager.getCacheSize())
  }, [])

  const handleExport = () => {
    const exportData = cacheManager.exportCache()
    if (exportData) {
      const blob = new Blob([exportData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `puzzle-game-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          if (cacheManager.importCache(content)) {
            alert("Game data imported successfully! Please refresh the page.")
          } else {
            alert("Failed to import game data. Please check the file format.")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear all game progress? This cannot be undone.")) {
      if (cacheManager.clearCache()) {
        alert("Game data cleared successfully! Please refresh the page.")
      } else {
        alert("Failed to clear game data.")
      }
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (!showDetails) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(true)}
        className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm border border-border/50 text-xs"
      >
        <HardDrive className="w-3 h-3 mr-1" />
        Game Data
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Info className="w-4 h-4" />
          Game Cache
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)} className="h-6 w-6 p-0">
          ×
        </Button>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground mb-3">
        <div>Size: {formatBytes(cacheSize)}</div>
        <div>Status: Active & Persistent</div>
        <div>Auto-saves progress locally</div>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} className="text-xs bg-transparent">
          <Download className="w-3 h-3 mr-1" />
          Export Backup
        </Button>

        <Button variant="outline" size="sm" onClick={handleImport} className="text-xs bg-transparent">
          <Upload className="w-3 h-3 mr-1" />
          Import Backup
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          className="text-xs bg-transparent text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear All Data
        </Button>
      </div>
    </Card>
  )
}
