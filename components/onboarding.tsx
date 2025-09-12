"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const screens = [
    {
      title: "PUZZLE",
      subtitle: "Master the Art of Sliding Puzzles",
      content:
        "Arrange numbered tiles in perfect order by sliding them into the empty space. Simple rules, endless challenge.",
      visual: (
        <div className="grid grid-cols-3 gap-1 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, ""].map((num, i) => (
            <div
              key={i}
              className={`border border-gray-600 flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                num === "" ? "bg-transparent" : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "100 LEVELS",
      subtitle: "Progressive Challenge System",
      content:
        "Start with simple 3x3 grids and advance to complex 8x8 puzzles. Each level tests your strategic thinking and patience.",
      visual: (
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 overflow-x-auto">
          <div className="text-center flex-shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border border-gray-600 bg-white text-black text-xs flex items-center justify-center font-bold mb-1">
              3x3
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">Level 1-29</div>
          </div>
          <div className="text-white text-lg sm:text-2xl">→</div>
          <div className="text-center flex-shrink-0">
            <div className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-600 bg-white text-black text-xs flex items-center justify-center font-bold mb-1">
              4x4
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">Level 30-59</div>
          </div>
          <div className="text-white text-lg sm:text-2xl">→</div>
          <div className="text-center flex-shrink-0">
            <div className="w-10 h-10 sm:w-16 sm:h-16 border border-gray-600 bg-white text-black text-xs flex items-center justify-center font-bold mb-1">
              5x5
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">Level 60-100</div>
          </div>
        </div>
      ),
    },
    {
      title: "CEDOMIS NFTS",
      subtitle: "Exclusive Digital Rewards",
      content:
        "Earn rare Cedomis NFTs at milestone levels. Submit your wallet address to receive these exclusive digital collectibles.",
      visual: (
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-w-xs mx-auto">
          {[
            { level: 10, name: "BRONZE", color: "bg-amber-600" },
            { level: 25, name: "SILVER", color: "bg-gray-400" },
            { level: 50, name: "GOLD", color: "bg-yellow-500" },
            { level: 80, name: "DIAMOND", color: "bg-blue-400" },
            { level: 100, name: "LEGENDARY", color: "bg-purple-500" },
          ].map((nft) => (
            <div key={nft.level} className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-300">Level {nft.level}</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 ${nft.color} rounded`}></div>
                <span className="text-white font-semibold">{nft.name}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]

  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1)
    } else {
      onComplete()
    }
  }

  const skipOnboarding = () => {
    onComplete()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div
        className={`w-full max-w-sm sm:max-w-md lg:max-w-lg transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Progress indicators */}
          <div className="flex justify-center space-x-2 sm:space-x-3">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ${
                  index === currentScreen
                    ? "w-6 sm:w-8 h-2 bg-white rounded-full"
                    : "w-2 h-2 bg-gray-600 rounded-full hover:bg-gray-500"
                }`}
              />
            ))}
          </div>

          {/* Screen content with animation */}
          <div
            className={`space-y-4 sm:space-y-6 transition-all duration-500 ${currentScreen >= 0 ? "opacity-100" : "opacity-0"}`}
          >
            {screens[currentScreen].visual}

            <div className="space-y-2 sm:space-y-3 px-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wider">
                {screens[currentScreen].title}
              </h1>
              <h2 className="text-sm sm:text-base lg:text-lg text-gray-400 font-medium">
                {screens[currentScreen].subtitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xs sm:max-w-md mx-auto text-balance">
                {screens[currentScreen].content}
              </p>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col gap-3 sm:gap-4 pt-6 sm:pt-8 px-2">
            <Button
              variant="outline"
              onClick={skipOnboarding}
              className="w-full border-gray-600 text-gray-400 hover:bg-gray-900 hover:text-white bg-transparent hover:border-gray-500 transition-all duration-200 py-3 sm:py-4"
            >
              Skip Intro
            </Button>
            <Button
              onClick={nextScreen}
              className="w-full bg-red-600 text-white hover:bg-red-700 font-bold text-base sm:text-lg py-4 sm:py-6 transition-all duration-200 hover:scale-105 border-0"
            >
              {currentScreen === screens.length - 1 ? "START PLAYING" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
