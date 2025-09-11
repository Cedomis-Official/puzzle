"use client"

import { useState } from "react"
import { PuzzleGame } from "@/components/puzzle-game"
import { GameHeader } from "@/components/game-header"
import { Onboarding } from "@/components/onboarding"

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(true)

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <GameHeader />
        <PuzzleGame />
      </div>
    </main>
  )
}
