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
    const body = await request.json()
    const { walletAddress, nftLevel } = body

    // Validation
    if (!walletAddress || !nftLevel) {
      return NextResponse.json({ error: "Wallet address and NFT level are required" }, { status: 400 })
    }

    if (!isValidEVMAddress(walletAddress)) {
      return NextResponse.json({ error: "Invalid EVM wallet address format" }, { status: 400 })
    }

    if (!ACHIEVEMENTS[nftLevel as keyof typeof ACHIEVEMENTS]) {
      return NextResponse.json({ error: "Invalid NFT level" }, { status: 400 })
    }

    // Get client info for analytics
    const userAgent = request.headers.get("user-agent") || null
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.ip || null

    const nftName = ACHIEVEMENTS[nftLevel as keyof typeof ACHIEVEMENTS].name

    // Check if address already exists for this level
    const existingAddress = await sql`
      SELECT id FROM addresses 
      WHERE wallet_address = ${walletAddress} AND nft_level = ${nftLevel}
    `

    if (existingAddress.length > 0) {
      return NextResponse.json({ error: "Address already submitted for this NFT level" }, { status: 409 })
    }

    // Insert new address
    const result = await sql`
      INSERT INTO addresses (wallet_address, nft_level, nft_name, user_agent, ip_address)
      VALUES (${walletAddress}, ${nftLevel}, ${nftName}, ${userAgent}, ${ipAddress})
      RETURNING id, wallet_address, nft_level, nft_name, submitted_at
    `

    return NextResponse.json({
      success: true,
      message: `NFT claim submitted successfully for ${nftName}`,
      data: result[0],
    })
  } catch (error) {
    console.error("Error submitting address:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    let query = `
      SELECT id, wallet_address, nft_level, nft_name, submitted_at, created_at
      FROM addresses
    `
    const conditions = []
    const params: any[] = []

    if (level) {
      conditions.push(`nft_level = $${params.length + 1}`)
      params.push(Number.parseInt(level))
    }

    if (address) {
      conditions.push(`wallet_address = $${params.length + 1}`)
      params.push(address)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`
    }

    query += ` ORDER BY submitted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const addresses = await sql(query, params)

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM addresses"
    const countParams: any[] = []

    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(" AND ")}`
      // Use the same condition parameters (excluding limit/offset)
      for (let i = 0; i < params.length - 2; i++) {
        countParams.push(params[i])
      }
    }

    const countResult = await sql(countQuery, countParams)
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
    console.error("Error fetching addresses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
