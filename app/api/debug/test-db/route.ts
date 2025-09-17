import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Testing database connection...")

    // Test basic connection
    const connectionTest = await sql`SELECT NOW() as current_time`
    console.log("[v0] Connection test successful:", connectionTest[0])

    // Check if addresses table exists and get structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'addresses' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("[v0] Table structure:", tableInfo)

    // Get recent addresses to see what's actually in the database
    const recentAddresses = await sql`
      SELECT id, wallet_address, nft_level, nft_name, submitted_at, created_at
      FROM addresses 
      ORDER BY created_at DESC 
      LIMIT 10
    `
    console.log("[v0] Recent addresses:", recentAddresses)

    // Get total count
    const totalCount = await sql`SELECT COUNT(*) as total FROM addresses`
    console.log("[v0] Total addresses:", totalCount[0])

    return NextResponse.json({
      success: true,
      connection: connectionTest[0],
      tableStructure: tableInfo,
      recentAddresses: recentAddresses,
      totalCount: totalCount[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Testing address insertion...")

    const testAddress = "0x" + Math.random().toString(16).substring(2, 42).padStart(40, "0")
    const testLevel = 10
    const testName = "Test NFT"

    console.log("[v0] Inserting test address:", testAddress)

    const result = await sql`
      INSERT INTO addresses (wallet_address, nft_level, nft_name, submitted_at, created_at)
      VALUES (${testAddress}, ${testLevel}, ${testName}, NOW(), NOW())
      RETURNING id, wallet_address, nft_level, nft_name, submitted_at, created_at
    `

    console.log("[v0] Test insertion successful:", result[0])

    // Verify it was actually inserted
    const verification = await sql`
      SELECT * FROM addresses WHERE id = ${result[0].id}
    `

    console.log("[v0] Verification query result:", verification[0])

    return NextResponse.json({
      success: true,
      inserted: result[0],
      verified: verification[0],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Test insertion failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
