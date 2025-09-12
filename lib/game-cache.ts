interface GameCache {
  currentLevel: number
  unlockedLevels: number
  levelStars: { [key: number]: number }
  claimedAchievements: number[]
  sessionId: string
  lastPlayed: string
  totalPlayTime: number
  gameStats: {
    totalMoves: number
    totalGamesPlayed: number
    totalGamesWon: number
    bestTime: number | null
    averageStars: number
  }
}

interface CacheOptions {
  maxAge?: number // in milliseconds
  compression?: boolean
  validation?: boolean
}

class GameCacheManager {
  private static instance: GameCacheManager
  private readonly CACHE_KEY = "puzzle-game-cache"
  private readonly CACHE_VERSION = "1.0.0"
  private readonly DEFAULT_MAX_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

  private constructor() {}

  static getInstance(): GameCacheManager {
    if (!GameCacheManager.instance) {
      GameCacheManager.instance = new GameCacheManager()
    }
    return GameCacheManager.instance
  }

  // Generate unique session ID for each visit
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get default cache structure
  private getDefaultCache(): GameCache {
    return {
      currentLevel: 1,
      unlockedLevels: 1,
      levelStars: {},
      claimedAchievements: [],
      sessionId: this.generateSessionId(),
      lastPlayed: new Date().toISOString(),
      totalPlayTime: 0,
      gameStats: {
        totalMoves: 0,
        totalGamesPlayed: 0,
        totalGamesWon: 0,
        bestTime: null,
        averageStars: 0,
      },
    }
  }

  // Validate cache data integrity
  private validateCache(cache: any): cache is GameCache {
    if (!cache || typeof cache !== "object") return false

    const requiredFields = [
      "currentLevel",
      "unlockedLevels",
      "levelStars",
      "claimedAchievements",
      "sessionId",
      "lastPlayed",
    ]

    return (
      requiredFields.every((field) => cache.hasOwnProperty(field)) &&
      typeof cache.currentLevel === "number" &&
      typeof cache.unlockedLevels === "number" &&
      typeof cache.levelStars === "object" &&
      Array.isArray(cache.claimedAchievements)
    )
  }

  // Check if cache is expired
  private isCacheExpired(cache: GameCache, maxAge: number = this.DEFAULT_MAX_AGE): boolean {
    const lastPlayed = new Date(cache.lastPlayed).getTime()
    const now = Date.now()
    return now - lastPlayed > maxAge
  }

  // Load cache from localStorage with validation
  loadCache(options: CacheOptions = {}): GameCache {
    if (typeof window === "undefined") {
      return this.getDefaultCache()
    }

    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) {
        return this.getDefaultCache()
      }

      const parsedCache = JSON.parse(cached)

      // Validate cache structure
      if (options.validation !== false && !this.validateCache(parsedCache)) {
        console.warn("[GameCache] Invalid cache structure, resetting to defaults")
        return this.getDefaultCache()
      }

      // Check cache expiration
      if (options.maxAge !== undefined && this.isCacheExpired(parsedCache, options.maxAge)) {
        console.info("[GameCache] Cache expired, resetting to defaults")
        return this.getDefaultCache()
      }

      // Update session ID for new visit but preserve data
      parsedCache.sessionId = this.generateSessionId()
      parsedCache.lastPlayed = new Date().toISOString()

      return parsedCache
    } catch (error) {
      console.error("[GameCache] Error loading cache:", error)
      return this.getDefaultCache()
    }
  }

  // Save cache to localStorage
  saveCache(cache: GameCache, options: CacheOptions = {}): boolean {
    if (typeof window === "undefined") {
      return false
    }

    try {
      // Update metadata
      cache.lastPlayed = new Date().toISOString()

      const cacheData = {
        ...cache,
        version: this.CACHE_VERSION,
        savedAt: Date.now(),
      }

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
      return true
    } catch (error) {
      console.error("[GameCache] Error saving cache:", error)

      // Try to clear some space and retry
      this.clearOldCaches()
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
        return true
      } catch (retryError) {
        console.error("[GameCache] Retry failed:", retryError)
        return false
      }
    }
  }

  // Update specific cache fields
  updateCache(updates: Partial<GameCache>): boolean {
    const currentCache = this.loadCache()
    const updatedCache = { ...currentCache, ...updates }
    return this.saveCache(updatedCache)
  }

  // Update game statistics
  updateGameStats(stats: Partial<GameCache["gameStats"]>): boolean {
    const currentCache = this.loadCache()
    currentCache.gameStats = { ...currentCache.gameStats, ...stats }

    // Calculate average stars
    const totalStars = Object.values(currentCache.levelStars).reduce((sum, stars) => sum + stars, 0)
    const levelsPlayed = Object.keys(currentCache.levelStars).length
    currentCache.gameStats.averageStars = levelsPlayed > 0 ? totalStars / levelsPlayed : 0

    return this.saveCache(currentCache)
  }

  // Clear cache
  clearCache(): boolean {
    if (typeof window === "undefined") {
      return false
    }

    try {
      localStorage.removeItem(this.CACHE_KEY)
      return true
    } catch (error) {
      console.error("[GameCache] Error clearing cache:", error)
      return false
    }
  }

  // Clear old/unused caches to free up space
  private clearOldCaches(): void {
    if (typeof window === "undefined") return

    try {
      // Remove old individual localStorage keys (migration cleanup)
      const oldKeys = [
        "puzzle-current-level",
        "puzzle-unlocked-levels",
        "puzzle-level-stars",
        "puzzle-claimed-achievements",
      ]

      oldKeys.forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error("[GameCache] Error clearing old caches:", error)
    }
  }

  // Get cache size in bytes (approximate)
  getCacheSize(): number {
    if (typeof window === "undefined") return 0

    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      return cached ? new Blob([cached]).size : 0
    } catch (error) {
      return 0
    }
  }

  // Export cache for backup
  exportCache(): string | null {
    const cache = this.loadCache()
    try {
      return JSON.stringify(cache, null, 2)
    } catch (error) {
      console.error("[GameCache] Error exporting cache:", error)
      return null
    }
  }

  // Import cache from backup
  importCache(cacheData: string): boolean {
    try {
      const parsedCache = JSON.parse(cacheData)
      if (this.validateCache(parsedCache)) {
        return this.saveCache(parsedCache)
      }
      return false
    } catch (error) {
      console.error("[GameCache] Error importing cache:", error)
      return false
    }
  }
}

// Export singleton instance
export const gameCache = GameCacheManager.getInstance()

// Hook for React components
export function useGameCache() {
  return {
    loadCache: (options?: CacheOptions) => gameCache.loadCache(options),
    saveCache: (cache: GameCache, options?: CacheOptions) => gameCache.saveCache(cache, options),
    updateCache: (updates: Partial<GameCache>) => gameCache.updateCache(updates),
    updateGameStats: (stats: Partial<GameCache["gameStats"]>) => gameCache.updateGameStats(stats),
    clearCache: () => gameCache.clearCache(),
    getCacheSize: () => gameCache.getCacheSize(),
    exportCache: () => gameCache.exportCache(),
    importCache: (data: string) => gameCache.importCache(data),
  }
}

export type { GameCache, CacheOptions }
