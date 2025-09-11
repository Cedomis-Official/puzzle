import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET - Get address submission statistics
export async function GET() {
  try {
    // Get total addresses and breakdown by NFT level
    const stats = await sql`
      SELECT 
        COUNT(*) as total_addresses,
        COUNT(DISTINCT wallet_address) as unique_addresses,
        nft_level,
        nft_name,
        COUNT(*) as level_count
      FROM addresses 
      GROUP BY nft_level, nft_name
      ORDER BY nft_level
    `

    // Get recent submissions (last 24 hours)
    const recentSubmissions = await sql`
      SELECT COUNT(*) as recent_count
      FROM addresses 
      WHERE submitted_at >= NOW() - INTERVAL '24 hours'
    `

    // Get total unique wallets
    const uniqueWallets = await sql`
      SELECT COUNT(DISTINCT wallet_address) as unique_count
      FROM addresses
    `

    const levelBreakdown = stats.map((row) => ({
      level: row.nft_level,
      name: row.nft_name,
      count: Number.parseInt(row.level_count),
    }))

    const totalAddresses = stats.reduce((sum, row) => sum + Number.parseInt(row.level_count), 0)

    return NextResponse.json({
      success: true,
      data: {
        totalAddresses,
        uniqueWallets: Number.parseInt(uniqueWallets[0].unique_count),
        recentSubmissions: Number.parseInt(recentSubmissions[0].recent_count),
        levelBreakdown,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
