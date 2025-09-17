"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
  RotateCcw,
  Trophy,
  Info,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { isValidEVMAddress } from "@/lib/utils"
import { useGameCache, type GameCache } from "@/lib/game-cache"

type PuzzleState = (number | null)[]

const WINNING_STATE = [1, 2, 3, 4, 5, 6, 7, 8, null]

const generateLevelConfig = () => {
  const levels = []
  for (let i = 1; i <= 100; i++) {
    const baseShuffles = Math.min(10 + i * 3 + Math.floor((i * i) / 20), 500)

    let baseTimeLimit = 180 // Start with 3 minutes instead of 2
    if (i <= 10)
      baseTimeLimit = Math.max(180 - i * 6, 120) // 3min to 2min
    else if (i <= 25)
      baseTimeLimit = Math.max(120 - (i - 10) * 3, 90) // 2min to 1.5min
    else if (i <= 50)
      baseTimeLimit = Math.max(90 - (i - 25) * 2, 60) // 1.5min to 1min
    else if (i <= 75)
      baseTimeLimit = Math.max(60 - (i - 50) * 1, 45) // 1min to 45sec
    else baseTimeLimit = Math.max(45 - (i - 75) * 1, 30) // 45sec to 30sec

    let baseMaxMoves = 150
    if (i <= 5) baseMaxMoves = Math.max(150 - i * 10, 100)
    else if (i <= 15) baseMaxMoves = Math.max(100 - (i - 5) * 5, 60)
    else if (i <= 30) baseMaxMoves = Math.max(60 - (i - 15) * 2, 40)
    else if (i <= 50) baseMaxMoves = Math.max(40 - Math.floor((i - 30) / 2), 25)
    else if (i <= 75) baseMaxMoves = Math.max(25 - Math.floor((i - 50) / 3), 18)
    else baseMaxMoves = Math.max(18 - Math.floor((i - 75) / 5), 12)

    let gridSize = 3
    if (i >= 30) gridSize = 4 // 4x4 grid from level 30 instead of 20
    if (i >= 70) gridSize = 5 // 5x5 grid from level 70 instead of 60
    if (i >= 95) gridSize = 6 // 6x6 grid from level 95 instead of 90

    let name = "Tutorial"
    if (i <= 3) name = "Tutorial"
    else if (i <= 8) name = "Beginner"
    else if (i <= 15) name = "Challenging"
    else if (i <= 25) name = "Hard"
    else if (i <= 40) name = "Very Hard"
    else if (i <= 55) name = "Extreme"
    else if (i <= 70) name = "Nightmare"
    else if (i <= 85) name = "Insane"
    else if (i <= 95) name = "Impossible"
    else name = "Legendary"

    levels.push({
      level: i,
      name: `${name} ${i}`,
      shuffles: baseShuffles,
      timeLimit: Math.floor(baseTimeLimit),
      gridSize: gridSize,
      maxMoves: baseMaxMoves,
    })
  }
  return levels
}

const LEVEL_CONFIG = generateLevelConfig()

const getWinningState = (gridSize: number) => {
  const totalTiles = gridSize * gridSize
  const state = []
  for (let i = 1; i < totalTiles; i++) {
    state.push(i)
  }
  state.push(null) // Empty tile at the end
  return state
}

const ACHIEVEMENTS = {
  10: { name: "Cedomis Bronze NFT", color: "from-amber-600 to-amber-800", icon: "🥉" },
  25: { name: "Cedomis Silver NFT", color: "from-gray-400 to-gray-600", icon: "🥈" },
  50: { name: "Cedomis Gold NFT", color: "from-yellow-400 to-yellow-600", icon: "🥇" },
  80: { name: "Cedomis Diamond NFT", color: "from-blue-400 to-purple-600", icon: "💎" },
  100: { name: "Cedomis Legendary NFT", color: "from-purple-500 to-pink-600", icon: "👑" },
}

export function PuzzleGame() {
  const cacheManager = useGameCache()

  const [gameData, setGameData] = useState<GameCache>(() => {
    return cacheManager.loadCache({ validation: true })
  })

  const currentLevel = gameData.currentLevel
  const unlockedLevels = gameData.unlockedLevels
  const levelStars = gameData.levelStars
  const claimedAchievements = gameData.claimedAchievements

  const updateGameData = (updates: Partial<GameCache>) => {
    const newData = { ...gameData, ...updates }
    setGameData(newData)
    const saveSuccess = cacheManager.saveCache(newData)
    if (!saveSuccess) {
      console.warn("[v0] Failed to save game progress to localStorage")
    }
  }

  const setCurrentLevel = (level: number) => {
    updateGameData({ currentLevel: level })
  }

  const setUnlockedLevels = (levels: number) => {
    updateGameData({ unlockedLevels: levels })
  }

  const setLevelStars = (stars: { [key: number]: number }) => {
    updateGameData({ levelStars: stars })
  }

  const setClaimedAchievements = (achievements: number[]) => {
    updateGameData({ claimedAchievements: achievements })
  }

  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [pendingNFTLevel, setPendingNFTLevel] = useState<number | null>(null)
  const [walletError, setWalletError] = useState("")
  const [isWalletValid, setIsWalletValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentLevelConfig = LEVEL_CONFIG[currentLevel - 1]
  const winningState = useMemo(() => getWinningState(currentLevelConfig.gridSize), [currentLevelConfig.gridSize])

  const [puzzle, setPuzzle] = useState<PuzzleState>(winningState)
  const [moves, setMoves] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [showHints, setShowHints] = useState(false)

  useEffect(() => {
    const newWinningState = getWinningState(currentLevelConfig.gridSize)
    setPuzzle(newWinningState)
    resetGame()
  }, [currentLevel])

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && gameStarted && !isWon && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameOver(true)
    }
  }, [timeLeft, gameStarted, isWon, gameOver])

  // Save progress every 30 seconds during active gameplay
  useEffect(() => {
    if (gameStarted && !isWon && !gameOver) {
      const interval = setInterval(() => {
        const currentData = {
          ...gameData,
          totalPlayTime: gameData.totalPlayTime + 30,
          lastPlayed: new Date().toISOString(),
        }
        cacheManager.saveCache(currentData)
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [gameStarted, isWon, gameOver, gameData, cacheManager])

  const moveTile = (index: number) => {
    if (isWon || gameOver) return

    const emptyIndex = puzzle.indexOf(null)
    const neighbors = getNeighbors(emptyIndex, currentLevelConfig.gridSize)

    if (neighbors.includes(index)) {
      const newPuzzle = [...puzzle]
      newPuzzle[emptyIndex] = newPuzzle[index]
      newPuzzle[index] = null

      setPuzzle(newPuzzle)
      const newMoves = moves + 1
      setMoves(newMoves)

      cacheManager.updateGameStats({
        totalMoves: gameData.gameStats.totalMoves + 1,
        totalGamesPlayed: gameData.gameStats.totalGamesPlayed + (newMoves === 1 ? 1 : 0),
      })

      if (currentLevelConfig.maxMoves && newMoves >= currentLevelConfig.maxMoves) {
        setGameOver(true)
      }
    }
  }

  const getNeighbors = (index: number, gridSize: number): number[] => {
    const neighbors = []
    const row = Math.floor(index / gridSize)
    const col = index % gridSize

    if (row > 0) neighbors.push(index - gridSize) // Up
    if (row < gridSize - 1) neighbors.push(index + gridSize) // Down
    if (col > 0) neighbors.push(index - 1) // Left
    if (col < gridSize - 1) neighbors.push(index + 1) // Right

    return neighbors
  }

  const shufflePuzzle = () => {
    const newPuzzle = [...puzzle]
    const gridSize = currentLevelConfig.gridSize

    for (let i = 0; i < currentLevelConfig.shuffles; i++) {
      const emptyIndex = newPuzzle.indexOf(null)
      const neighbors = getNeighbors(emptyIndex, gridSize)
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)]

      const temp = newPuzzle[emptyIndex]
      newPuzzle[emptyIndex] = newPuzzle[randomNeighbor]
      newPuzzle[randomNeighbor] = temp
    }

    setPuzzle(newPuzzle)
    setMoves(0)
    setIsWon(false)
    setGameStarted(true)
    setGameOver(false)
    setTimeLeft(currentLevelConfig.timeLimit)
  }

  const resetGame = () => {
    const newWinningState = getWinningState(currentLevelConfig.gridSize)
    setPuzzle(newWinningState)
    setMoves(0)
    setIsWon(false)
    setGameStarted(false)
    setGameOver(false)
    setTimeLeft(null)
    setShowConfetti(false)
    setWalletError("")
    setIsWalletValid(false)
  }

  const proceedToNextLevel = () => {
    if (currentLevel < unlockedLevels && currentLevel < 100) {
      setCurrentLevel(currentLevel + 1)
      resetGame()
    }
  }

  const calculateStars = (moves: number, timeUsed: number | null): number => {
    const maxMoves = currentLevelConfig.maxMoves || 50
    const timeLimit = currentLevelConfig.timeLimit || 120

    let stars = 1 // Base star for completion

    if (moves <= maxMoves * 0.6) stars++ // Must use 60% or fewer moves (was 40%)
    if (timeUsed === null || timeUsed <= timeLimit * 0.5) stars++ // Must use 50% or less time (was 30%)

    return Math.min(stars, 3)
  }

  const handleAchievementClaim = (level: number) => {
    setPendingNFTLevel(level)
    setShowWalletModal(true)
  }

  const handleWalletChange = (value: string) => {
    setWalletAddress(value)

    if (!value.trim()) {
      setWalletError("")
      setIsWalletValid(false)
      return
    }

    if (!value.startsWith("0x")) {
      setWalletError("Address must start with 0x")
      setIsWalletValid(false)
      return
    }

    if (!isValidEVMAddress(value)) {
      setWalletError("Invalid EVM wallet address format")
      setIsWalletValid(false)
      return
    }

    setWalletError("")
    setIsWalletValid(true)
  }

  const handleWalletSubmission = async () => {
    if (!isWalletValid || !pendingNFTLevel || isSubmitting) return

    setIsSubmitting(true)
    setWalletError("")

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          nftLevel: pendingNFTLevel,
          sessionId: gameData.sessionId, // Include session ID for tracking
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit address")
      }

      const newAchievements = [...claimedAchievements, pendingNFTLevel]
      setClaimedAchievements(newAchievements)

      // Show success message with more details
      alert(
        `🎉 NFT Claimed Successfully!\n\nYour ${ACHIEVEMENTS[pendingNFTLevel as keyof typeof ACHIEVEMENTS]?.name} submission has been recorded.\n\nWallet: ${walletAddress}\nSubmission ID: ${data.data.id}\n\nYour NFT will be sent to this address soon!`,
      )

      // Reset modal state
      setShowWalletModal(false)
      setWalletAddress("")
      setPendingNFTLevel(null)
      setWalletError("")
      setIsWalletValid(false)
    } catch (error) {
      console.error("Error submitting wallet address:", error)

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("already submitted")) {
          setWalletError("This address has already been submitted for this NFT level")
        } else {
          setWalletError(error.message)
        }
      } else {
        setWalletError("Failed to submit address. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const isWinning = puzzle.every((tile, index) => tile === winningState[index])
    if (isWinning && gameStarted && !gameOver) {
      setIsWon(true)
      setShowConfetti(true)

      const timeUsed = currentLevelConfig.timeLimit ? currentLevelConfig.timeLimit - (timeLeft || 0) : null
      const stars = calculateStars(moves, timeUsed)

      const newLevelStars = {
        ...levelStars,
        [currentLevel]: Math.max(levelStars[currentLevel] || 0, stars),
      }
      setLevelStars(newLevelStars)

      const updatedStats = {
        totalGamesWon: gameData.gameStats.totalGamesWon + 1,
        totalMoves: gameData.gameStats.totalMoves + moves,
        bestTime:
          timeUsed && (!gameData.gameStats.bestTime || timeUsed < gameData.gameStats.bestTime)
            ? timeUsed
            : gameData.gameStats.bestTime,
      }

      cacheManager.updateGameStats(updatedStats)

      if (currentLevel < 100) {
        const newUnlockedLevels = Math.max(unlockedLevels, currentLevel + 1)
        setUnlockedLevels(newUnlockedLevels)

        updateGameData({
          unlockedLevels: newUnlockedLevels,
          levelStars: newLevelStars,
        })
      }

      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [puzzle, gameStarted, moves, timeLeft, currentLevel, gameOver, winningState])

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force save current game state before page unload
      const finalData = {
        ...gameData,
        lastPlayed: new Date().toISOString(),
      }
      cacheManager.saveCache(finalData)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [gameData, cacheManager])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Save when app goes to background
        const finalData = {
          ...gameData,
          lastPlayed: new Date().toISOString(),
        }
        cacheManager.saveCache(finalData)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [gameData, cacheManager])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const goToLevel = (level: number) => {
    if (level >= 1 && level <= 100 && level <= unlockedLevels) {
      setCurrentLevel(level)
      resetGame()
    }
  }

  const getGridSize = () => {
    const gridSize = currentLevelConfig.gridSize
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640

    if (gridSize === 3) {
      return isMobile ? { grid: "240px", tile: "w-20 h-20 text-lg" } : { grid: "300px", tile: "w-24 h-24 text-xl" }
    } else if (gridSize === 4) {
      return isMobile ? { grid: "280px", tile: "w-16 h-16 text-sm" } : { grid: "320px", tile: "w-18 h-18 text-lg" }
    } else if (gridSize === 5) {
      return isMobile ? { grid: "300px", tile: "w-14 h-14 text-xs" } : { grid: "350px", tile: "w-16 h-16 text-sm" }
    } else {
      // 6x6
      return isMobile ? { grid: "320px", tile: "w-12 h-12 text-xs" } : { grid: "360px", tile: "w-14 h-14 text-xs" }
    }
  }

  const gridSize = getGridSize()

  return (
    <div className="text-center relative px-4 py-6 max-w-4xl mx-auto">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-80"></div>
            </div>
          ))}
          {[...Array(30)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
            </div>
          ))}
        </div>
      )}

      {showWalletModal && pendingNFTLevel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 bg-card border-border shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{ACHIEVEMENTS[pendingNFTLevel as keyof typeof ACHIEVEMENTS]?.icon}</div>
              <h3 className="text-xl font-bold mb-2">
                Claim Your {ACHIEVEMENTS[pendingNFTLevel as keyof typeof ACHIEVEMENTS]?.name}!
              </h3>
              <p className="text-sm text-muted-foreground">Submit your EVM wallet address to receive your NFT reward</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-left">EVM Wallet Address</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => handleWalletChange(e.target.value)}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    disabled={isSubmitting}
                    className={`pr-10 ${
                      walletError
                        ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                        : isWalletValid
                          ? "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                          : ""
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isSubmitting && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    {!isSubmitting && walletError && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {!isSubmitting && isWalletValid && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                </div>

                {walletError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {walletError}
                  </p>
                )}

                {isWalletValid && !walletError && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Valid EVM address
                  </p>
                )}

                <p className="text-xs text-muted-foreground">Enter a valid Ethereum wallet address starting with 0x</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWalletModal(false)
                    setWalletAddress("")
                    setPendingNFTLevel(null)
                    setWalletError("")
                    setIsWalletValid(false)
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWalletSubmission}
                  disabled={!isWalletValid || isSubmitting}
                  className={`flex-1 bg-gradient-to-r ${ACHIEVEMENTS[pendingNFTLevel as keyof typeof ACHIEVEMENTS].color} text-white text-xs sm:text-sm py-2 sm:py-3`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Claim NFT"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showHints && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card border-border shadow-2xl">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-card pb-2 border-b border-border/50">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <span className="hidden sm:inline">NFT Rewards</span>
                <span className="sm:hidden">NFTs</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHints(false)}
                className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(ACHIEVEMENTS).map(([level, achievement]) => (
                <div key={level} className="flex items-center justify-between p-2 sm:p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="text-lg sm:text-2xl flex-shrink-0">{achievement.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="hidden sm:inline">Level {level} - Submit wallet address to claim</span>
                        <span className="sm:hidden">Lvl {level} - Submit wallet</span>
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                      claimedAchievements.includes(Number(level))
                        ? "bg-green-500/20 text-green-400"
                        : currentLevel >= Number(level)
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {claimedAchievements.includes(Number(level))
                      ? "Claimed"
                      : currentLevel >= Number(level)
                        ? "Available"
                        : "Locked"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 sm:hidden">
              <Button variant="outline" onClick={() => setShowHints(false)} className="w-full bg-transparent">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToLevel(currentLevel - 1)}
            disabled={currentLevel <= 1}
            className="bg-transparent p-2 sm:px-3"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center flex-1 max-w-xs">
            <h2 className="text-lg sm:text-xl font-bold text-primary">Level {currentLevel}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{currentLevelConfig.name}</p>
            <p className="text-xs text-muted-foreground">
              {currentLevelConfig.gridSize}×{currentLevelConfig.gridSize} Grid
            </p>
            <div className="flex justify-center gap-1 mt-1">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    (levelStars[currentLevel] || 0) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToLevel(currentLevel + 1)}
            disabled={!(currentLevel < unlockedLevels && currentLevel < 100)}
            className="bg-transparent p-2 sm:px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {gameStarted && timeLeft !== null && (
          <div className="mb-4">
            <Card className="inline-block px-4 py-2 bg-card/80 border-border">
              <div className="flex items-center justify-center gap-4 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${timeLeft <= 10 ? "bg-red-500 animate-pulse" : timeLeft <= 30 ? "bg-orange-500" : "bg-green-500"}`}
                  ></div>
                  <span
                    className={`font-mono font-semibold ${timeLeft <= 10 ? "text-red-400" : timeLeft <= 30 ? "text-orange-400" : "text-foreground"}`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Moves:{" "}
                  <span
                    className={`font-semibold ${currentLevelConfig.maxMoves && moves >= currentLevelConfig.maxMoves * 0.8 ? "text-orange-400" : "text-foreground"}`}
                  >
                    {moves}
                  </span>
                  {currentLevelConfig.maxMoves && <span className="text-xs">/{currentLevelConfig.maxMoves}</span>}
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHints(true)}
            className="bg-transparent text-xs sm:text-sm px-3 py-2"
          >
            <Info className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">NFT Rewards</span>
            <span className="sm:hidden">NFTs</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          {currentLevelConfig.timeLimit && (
            <div
              className={`text-center sm:text-left ${currentLevelConfig.timeLimit <= 30 ? "text-red-400 font-semibold" : ""}`}
            >
              <div className="font-medium">Time Limit</div>
              <div>{formatTime(currentLevelConfig.timeLimit)}</div>
            </div>
          )}
          {currentLevelConfig.maxMoves && (
            <div
              className={`text-center sm:text-left ${currentLevelConfig.maxMoves <= 15 ? "text-red-400 font-semibold" : ""}`}
            >
              <div className="font-medium">Max Moves</div>
              <div>{currentLevelConfig.maxMoves}</div>
            </div>
          )}
          <div
            className={`text-center sm:text-left col-span-2 sm:col-span-1 ${currentLevelConfig.shuffles >= 100 ? "text-orange-400 font-semibold" : ""}`}
          >
            <div className="font-medium">Difficulty</div>
            <div>{currentLevelConfig.shuffles} shuffles</div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Goal: Arrange numbers 1-{currentLevelConfig.gridSize * currentLevelConfig.gridSize - 1} in order
            </h3>
          </div>
          <Card className="inline-block p-4 bg-card/50 border-border/50">
            <div
              className={`grid gap-1`}
              style={{
                gridTemplateColumns: `repeat(${currentLevelConfig.gridSize}, 1fr)`,
                width: `${currentLevelConfig.gridSize * 30}px`,
                height: `${currentLevelConfig.gridSize * 30}px`,
              }}
            >
              {winningState.map((tile, index) => (
                <div
                  key={index}
                  className={`
                    w-7 h-7 rounded-md border font-semibold text-xs flex items-center justify-center
                    ${
                      tile === null
                        ? "bg-background/50 border-border/50"
                        : "bg-secondary/70 text-secondary-foreground border-border/50"
                    }
                  `}
                >
                  {tile}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Hide Preview
            </Button>
          </Card>
        </div>
      )}

      {!showPreview && !gameStarted && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Eye className="w-3 h-3 mr-1" />
            Show Goal
          </Button>
        </div>
      )}

      <Card className="inline-block p-3 sm:p-6 bg-card border-border">
        {!gameStarted && !isWon && !gameOver && (
          <div className="mb-6">
            <h3 className="font-semibold text-primary mb-2 text-sm sm:text-base">
              🎉 Ready to start Level {currentLevel}?
            </h3>
            {currentLevel >= 15 && (
              <p className="text-xs text-orange-400 mb-3 font-medium px-2">
                ⚠️ {currentLevelConfig.gridSize > 3 ? "Larger grid! " : ""}
                {currentLevelConfig.timeLimit <= 60 ? "Limited time! " : ""}
                {currentLevelConfig.maxMoves <= 20 ? "Very few moves allowed!" : ""}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button onClick={shufflePuzzle} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Play className="w-4 h-4" />
                Start Game
              </Button>
              {currentLevel > 1 && (
                <Button
                  variant="outline"
                  onClick={resetGame}
                  className="flex items-center justify-center gap-2 bg-transparent w-full sm:w-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        )}

        <div
          className={`grid gap-2 mb-6`}
          style={{
            gridTemplateColumns: `repeat(${currentLevelConfig.gridSize}, 1fr)`,
            width: gridSize.grid,
            height: gridSize.grid,
          }}
        >
          {puzzle.map((tile, index) => (
            <button
              key={index}
              onClick={() => moveTile(index)}
              className={`
                ${gridSize.tile} rounded-lg border-2 font-bold transition-all duration-200
                ${
                  tile === null
                    ? "bg-background border-border cursor-default"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-primary hover:text-primary-foreground cursor-pointer transform hover:scale-105"
                }
              `}
              disabled={tile === null || isWon || gameOver || !gameStarted}
            >
              {tile}
            </button>
          ))}
        </div>

        {isWon && (
          <div className="mt-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-primary mb-2 text-sm sm:text-base">🎉 Level {currentLevel} Complete!</h3>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    (levelStars[currentLevel] || 0) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Completed in {moves} moves
              {timeLeft !== null && ` and ${formatTime(currentLevelConfig.timeLimit! - timeLeft)}`}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              {ACHIEVEMENTS[currentLevel as keyof typeof ACHIEVEMENTS] &&
              !claimedAchievements.includes(currentLevel) ? (
                <Button
                  onClick={() => handleAchievementClaim(currentLevel)}
                  className={`w-full bg-gradient-to-r ${ACHIEVEMENTS[currentLevel as keyof typeof ACHIEVEMENTS].color} text-white text-xs sm:text-sm py-2 sm:py-3`}
                >
                  {ACHIEVEMENTS[currentLevel as keyof typeof ACHIEVEMENTS].icon} Submit Wallet for{" "}
                  <span className="hidden sm:inline">
                    {ACHIEVEMENTS[currentLevel as keyof typeof ACHIEVEMENTS].name}
                  </span>
                  <span className="sm:hidden">NFT</span>
                </Button>
              ) : (
                <div className="text-center p-3 bg-background/50 rounded">
                  <p className="text-xs text-muted-foreground mb-1">
                    {Object.keys(ACHIEVEMENTS).find((level) => Number(level) > currentLevel)
                      ? `Next NFT reward at level ${Object.keys(ACHIEVEMENTS).find((level) => Number(level) > currentLevel)}`
                      : "All NFT rewards claimed!"}
                  </p>
                  <div className="text-xs text-muted-foreground">Progress: {currentLevel}/100</div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={resetGame} className="flex-1 bg-transparent text-xs sm:text-sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Play Again
                </Button>
                {currentLevel < 100 && currentLevel < unlockedLevels && (
                  <Button onClick={proceedToNextLevel} className="flex-1 text-xs sm:text-sm">
                    Next Level →
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {gameOver && !isWon && (
          <div className="mt-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h3 className="font-semibold text-red-400 mb-2 text-sm sm:text-base">Level Failed!</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              {timeLeft === 0 ? "Time's up!" : "Move limit exceeded!"}
            </p>
            <Button onClick={shufflePuzzle} className="w-full text-xs sm:text-sm">
              <Play className="w-4 h-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
