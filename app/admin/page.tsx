"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Users, Trophy, Calendar, ExternalLink, Loader2, RefreshCw } from "lucide-react"

interface Address {
  id: number
  wallet_address: string
  nft_level: number
  nft_name: string
  submitted_at: string
  created_at: string
}

interface Stats {
  totalAddresses: number
  uniqueWallets: number
  recentSubmissions: number
  levelBreakdown: Array<{
    level: number
    name: string
    count: number
  }>
}

const ACHIEVEMENTS = {
  10: { name: "Cedomis Bronze NFT", color: "bg-amber-600", icon: "🥉" },
  25: { name: "Cedomis Silver NFT", color: "bg-gray-400", icon: "🥈" },
  50: { name: "Cedomis Gold NFT", color: "bg-yellow-500", icon: "🥇" },
  80: { name: "Cedomis Diamond NFT", color: "bg-blue-500", icon: "💎" },
  100: { name: "Cedomis Legendary NFT", color: "bg-purple-500", icon: "👑" },
}

export default function AdminPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/addresses/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchAddresses = async (reset = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: "50",
        offset: reset ? "0" : (currentPage * 50).toString(),
      })

      if (selectedLevel) {
        params.append("level", selectedLevel.toString())
      }

      if (searchTerm.trim()) {
        params.append("address", searchTerm.trim())
      }

      const response = await fetch(`/api/addresses?${params}`)
      const data = await response.json()

      if (data.success) {
        if (reset) {
          setAddresses(data.data)
          setCurrentPage(0)
        } else {
          setAddresses((prev) => [...prev, ...data.data])
        }
        setHasMore(data.pagination.hasMore)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchAddresses(true)
  }, [selectedLevel, searchTerm])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const handleLevelFilter = (level: number | null) => {
    setSelectedLevel(level)
    setCurrentPage(0)
  }

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1)
    fetchAddresses(false)
  }

  const exportToCSV = () => {
    if (addresses.length === 0) return

    const headers = ["ID", "Wallet Address", "NFT Level", "NFT Name", "Submitted At"]
    const csvContent = [
      headers.join(","),
      ...addresses.map((addr) =>
        [
          addr.id,
          addr.wallet_address,
          addr.nft_level,
          `"${addr.nft_name}"`,
          new Date(addr.submitted_at).toISOString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `puzzle-addresses-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Address Management</h1>
            <p className="text-muted-foreground">Manage wallet addresses submitted for NFT rewards</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchStats()
                fetchAddresses(true)
              }}
              className="bg-transparent"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} disabled={addresses.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{stats.totalAddresses}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique Wallets</p>
                  <p className="text-2xl font-bold">{stats.uniqueWallets}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last 24h</p>
                  <p className="text-2xl font-bold">{stats.recentSubmissions}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Trophy className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NFT Types</p>
                  <p className="text-2xl font-bold">{stats.levelBreakdown.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Level Breakdown */}
        {stats && stats.levelBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">NFT Level Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.levelBreakdown.map((item) => (
                <div key={item.level} className="text-center p-3 bg-background/50 rounded-lg">
                  <div className="text-2xl mb-1">{ACHIEVEMENTS[item.level as keyof typeof ACHIEVEMENTS]?.icon}</div>
                  <p className="text-sm font-medium">Level {item.level}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.name}</p>
                  <p className="text-lg font-bold text-primary">{item.count}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet address..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedLevel === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleLevelFilter(null)}
                className={selectedLevel === null ? "" : "bg-transparent"}
              >
                All Levels
              </Button>
              {Object.entries(ACHIEVEMENTS).map(([level, achievement]) => (
                <Button
                  key={level}
                  variant={selectedLevel === Number.parseInt(level) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLevelFilter(Number.parseInt(level))}
                  className={selectedLevel === Number.parseInt(level) ? "" : "bg-transparent"}
                >
                  {achievement.icon} {level}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Addresses Table */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Submitted Addresses</h3>
            <Badge variant="secondary">{addresses.length} addresses</Badge>
          </div>

          {loading && addresses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading addresses...
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No addresses found matching your criteria.</div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background/50 rounded-lg border"
                >
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <div className="text-2xl">{ACHIEVEMENTS[address.nft_level as keyof typeof ACHIEVEMENTS]?.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {truncateAddress(address.wallet_address)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(address.wallet_address)}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.nft_name} • Level {address.nft_level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(address.submitted_at)}</p>
                    <p className="text-xs text-muted-foreground">ID: {address.id}</p>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading} className="bg-transparent">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
