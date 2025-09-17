const { neon } = require("@neondatabase/serverless")

async function testDatabase() {
  try {
    console.log("🔍 Testing database connection...")

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    const sql = neon(process.env.DATABASE_URL)

    // Test 1: Check if addresses table exists
    console.log("📋 Checking if addresses table exists...")
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'addresses'
    `

    if (tableCheck.length === 0) {
      console.log("❌ addresses table does not exist! Creating it...")

      // Create the addresses table
      await sql`
        CREATE TABLE addresses (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          nft_level INTEGER NOT NULL,
          nft_name VARCHAR(255) NOT NULL,
          user_agent TEXT,
          ip_address VARCHAR(45),
          session_id VARCHAR(255),
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(wallet_address, nft_level)
        )
      `

      console.log("✅ addresses table created successfully!")
    } else {
      console.log("✅ addresses table exists")
    }

    // Test 2: Check table structure
    console.log("🏗️ Checking table structure...")
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'addresses'
      ORDER BY ordinal_position
    `

    console.log("Table columns:", columns)

    // Test 3: Count existing records
    console.log("📊 Counting existing records...")
    const count = await sql`SELECT COUNT(*) as total FROM addresses`
    console.log(`Total addresses in database: ${count[0].total}`)

    // Test 4: Show recent records
    if (count[0].total > 0) {
      console.log("📝 Recent addresses:")
      const recent = await sql`
        SELECT id, wallet_address, nft_level, nft_name, submitted_at
        FROM addresses
        ORDER BY submitted_at DESC
        LIMIT 5
      `
      console.table(recent)
    }

    // Test 5: Test insertion
    console.log("🧪 Testing address insertion...")
    const testAddress = "0x1234567890123456789012345678901234567890"
    const testLevel = 10
    const testNftName = "Cedomis Bronze NFT"

    try {
      // First check if test address already exists
      const existing = await sql`
        SELECT id FROM addresses 
        WHERE wallet_address = ${testAddress} AND nft_level = ${testLevel}
      `

      if (existing.length > 0) {
        console.log("🔄 Test address already exists, deleting it first...")
        await sql`
          DELETE FROM addresses 
          WHERE wallet_address = ${testAddress} AND nft_level = ${testLevel}
        `
      }

      // Insert test address
      const insertResult = await sql`
        INSERT INTO addresses (wallet_address, nft_level, nft_name, submitted_at, created_at)
        VALUES (${testAddress}, ${testLevel}, ${testNftName}, NOW(), NOW())
        RETURNING id, wallet_address, nft_level, submitted_at
      `

      console.log("✅ Test insertion successful:", insertResult[0])

      // Verify the insertion
      const verification = await sql`
        SELECT * FROM addresses 
        WHERE wallet_address = ${testAddress} AND nft_level = ${testLevel}
      `

      if (verification.length > 0) {
        console.log("✅ Verification successful - record exists in database")
        console.log("Record details:", verification[0])
      } else {
        console.log("❌ Verification failed - record not found after insertion")
      }

      // Clean up test data
      await sql`
        DELETE FROM addresses 
        WHERE wallet_address = ${testAddress} AND nft_level = ${testLevel}
      `
      console.log("🧹 Test data cleaned up")
    } catch (insertError) {
      console.error("❌ Test insertion failed:", insertError)
    }

    console.log("🎉 Database test completed successfully!")
  } catch (error) {
    console.error("❌ Database test failed:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    })
  }
}

testDatabase()
