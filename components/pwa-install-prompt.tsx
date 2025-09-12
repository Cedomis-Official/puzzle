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
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem("pwa-install-dismissed")
    if (!hasSeenPrompt) {
      setShowInstallPrompt(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      if (!hasSeenPrompt) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt && isInstallable) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
        localStorage.setItem("pwa-install-dismissed", "true")
      }
    } else {
      alert(
        "To install this app:\n\n• Chrome/Edge: Look for the install icon in the address bar\n• Safari: Tap Share → Add to Home Screen\n• Firefox: Tap Menu → Install",
      )
      setShowInstallPrompt(false)
      localStorage.setItem("pwa-install-dismissed", "true")
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    const dismissedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    localStorage.setItem("pwa-install-dismissed", dismissedUntil.toString())
  }

  const handleLater = () => {
    setShowInstallPrompt(false)
    const showAgainAt = Date.now() + 24 * 60 * 60 * 1000 // 1 day
    localStorage.setItem("pwa-install-dismissed", showAgainAt.toString())
  }

  useEffect(() => {
    const dismissedUntil = localStorage.getItem("pwa-install-dismissed")
    if (dismissedUntil && dismissedUntil !== "true") {
      const dismissedTime = Number.parseInt(dismissedUntil)
      if (Date.now() > dismissedTime) {
        localStorage.removeItem("pwa-install-dismissed")
        setShowInstallPrompt(true)
      }
    }
  }, [])

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black/90 backdrop-blur-sm border border-red-600/20 rounded-lg p-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm mb-1">Install PUZZLE App</h3>
          <p className="text-gray-300 text-xs mb-3">
            Get the full experience with offline play, faster loading, and home screen access.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
            <Button
              onClick={handleLater}
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
