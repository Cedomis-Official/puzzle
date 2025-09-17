import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get database stats
    const totalCount = await sql`SELECT COUNT(*) as count FROM addresses`
    const recentRecords = await sql`
      SELECT id, wallet_address, nft_level, nft_name, submitted_at 
      FROM addresses 
      ORDER BY id DESC 
      LIMIT 5
    `

    // Check for record 942 specifically
    const record942 = await sql`SELECT * FROM addresses WHERE id = 942`

    return NextResponse.json({
      success: true,
      totalRecords: totalCount[0].count,
      recentRecords,
      record942: record942.length > 0 ? record942[0] : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
