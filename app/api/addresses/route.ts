import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Achievement levels mapping
const ACHIEVEMENTS = {
  10: { name: "Cedomis Bronze NFT", color: "from-amber-600 to-amber-800" },
  25: { name: "Cedomis Silver NFT", color: "from-gray-400 to-gray-600" },
  50: { name: "Cedomis Gold NFT", color: "from-yellow-400 to-yellow-600" },
  80: { name: "Cedomis Diamond NFT", color: "from-blue-400 to-purple-600" },
  100: { name: "Cedomis Legendary NFT", color: "from-purple-500 to-pink-600" },
}

// Validate EVM address format
function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// POST - Submit a new wallet address
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting address submission...")

    const body = await request.json()
    const { walletAddress, nftLevel, sessionId } = body

    console.log("[v0] Received data:", { walletAddress, nftLevel, sessionId })

    // Validation
    if (!walletAddress || !nftLevel) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Wallet address and NFT level are required" }, { status: 400 })
    }

    if (!isValidEVMAddress(walletAddress)) {
      console.log("[v0] Invalid address format:", walletAddress)
      return NextResponse.json({ error: "Invalid EVM wallet address format" }, { status: 400 })
    }

    if (!ACHIEVEMENTS[nftLevel as keyof typeof ACHIEVEMENTS]) {
      console.log("[v0] Invalid NFT level:", nftLevel)
      return NextResponse.json({ error: "Invalid NFT level" }, { status: 400 })
    }

    // Get client info for analytics
    const userAgent = request.headers.get("user-agent") || null
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.ip || null

    const nftName = ACHIEVEMENTS[nftLevel as keyof typeof ACHIEVEMENTS].name

    console.log("[v0] Checking for existing address...")

    const existingAddress = await sql`
      SELECT id FROM addresses 
      WHERE wallet_address = ${walletAddress} AND nft_level = ${nftLevel}
    `

    if (existingAddress.length > 0) {
      console.log("[v0] Address already exists for this level")
      return NextResponse.json({ error: "Address already submitted for this NFT level" }, { status: 409 })
    }

    console.log("[v0] Inserting new address...")

    const result = await sql`
      INSERT INTO addresses (wallet_address, nft_level, nft_name, user_agent, ip_address, session_id, submitted_at, created_at)
      VALUES (${walletAddress}, ${nftLevel}, ${nftName}, ${userAgent}, ${ipAddress}, ${sessionId || null}, NOW(), NOW())
      RETURNING id, wallet_address, nft_level, nft_name, submitted_at
    `

    console.log("[v0] Address submitted successfully:", result[0])

    return NextResponse.json({
      success: true,
      message: `NFT claim submitted successfully for ${nftName}`,
      data: result[0],
    })
  } catch (error) {
    console.error("[v0] Error submitting address:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}

// GET - Retrieve addresses (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const address = searchParams.get("address")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let baseQuery = `
      SELECT id, wallet_address, nft_level, nft_name, submitted_at, created_at
      FROM addresses
    `

    const conditions = []
    const params = []

    if (level) {
      conditions.push(`nft_level = ${Number.parseInt(level)}`)
    }

    if (address) {
      conditions.push(`wallet_address = '${address}'`)
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`
    }

    baseQuery += ` ORDER BY submitted_at DESC LIMIT ${limit} OFFSET ${offset}`

    const addresses = await sql(baseQuery)

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM addresses"
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(" AND ")}`
    }

    const countResult = await sql(countQuery)
    const total = Number.parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      data: addresses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching addresses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
