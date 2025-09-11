"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black/90 backdrop-blur-sm border border-red-600/20 rounded-lg p-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1">Install PUZZLE3</h3>
          <p className="text-gray-300 text-xs mb-3">
            Install the app for a better gaming experience and offline access.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Later
            </Button>
          </div>
        </div>
        <Button onClick={handleDismiss} size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1 h-auto">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
