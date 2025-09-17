const { neon } = require("@neondatabase/serverless")

async function testAddressSubmission() {
  console.log("🧪 Testing Address Submission System...\n")

  try {
    // Test database connection
    console.log("1. Testing database connection...")
    const sql = neon(process.env.DATABASE_URL)

    const testQuery = await sql`SELECT NOW() as current_time`
    console.log("✅ Database connected successfully")
    console.log(`   Current time: ${testQuery[0].current_time}\n`)

    // Check table structure
    console.log("2. Checking addresses table structure...")
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      ORDER BY ordinal_position
    `

    if (tableInfo.length === 0) {
      console.log("❌ addresses table does not exist!")
      return
    }

    console.log("✅ Table structure:")
    tableInfo.forEach((col) => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "not null"})`)
    })
    console.log("")

    // Test API endpoint
    console.log("3. Testing API endpoint...")
    const testAddress = "0x1234567890123456789012345678901234567890"
    const testLevel = 10

    const response = await fetch("http://localhost:3000/api/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress: testAddress,
        nftLevel: testLevel,
        sessionId: "test-session-" + Date.now(),
      }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log("✅ API endpoint working correctly")
      console.log(`   Response: ${JSON.stringify(result, null, 2)}\n`)

      // Verify the record was actually inserted
      console.log("4. Verifying database insertion...")
      const insertedRecord = await sql`
        SELECT * FROM addresses 
        WHERE wallet_address = ${testAddress} AND nft_level = ${testLevel}
        ORDER BY created_at DESC 
        LIMIT 1
      `

      if (insertedRecord.length > 0) {
        console.log("✅ Record successfully inserted into database")
        console.log(`   Record ID: ${insertedRecord[0].id}`)
        console.log(`   Wallet: ${insertedRecord[0].wallet_address}`)
        console.log(`   Level: ${insertedRecord[0].nft_level}`)
        console.log(`   Created: ${insertedRecord[0].created_at}\n`)

        // Clean up test record
        await sql`DELETE FROM addresses WHERE id = ${insertedRecord[0].id}`
        console.log("🧹 Test record cleaned up")
      } else {
        console.log("❌ Record was not found in database after API call!")
        console.log("   This indicates a transaction rollback or connection issue")
      }
    } else {
      console.log("❌ API endpoint failed")
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${JSON.stringify(result, null, 2)}`)
    }

    // Show current database stats
    console.log("\n5. Current database statistics...")
    const stats = await sql`
      SELECT 
        COUNT(*) as total_addresses,
        COUNT(DISTINCT wallet_address) as unique_wallets,
        COUNT(DISTINCT nft_level) as different_levels,
        MIN(created_at) as first_submission,
        MAX(created_at) as latest_submission
      FROM addresses
    `

    console.log("📊 Database Statistics:")
    console.log(`   Total addresses: ${stats[0].total_addresses}`)
    console.log(`   Unique wallets: ${stats[0].unique_wallets}`)
    console.log(`   Different levels: ${stats[0].different_levels}`)
    console.log(`   First submission: ${stats[0].first_submission || "None"}`)
    console.log(`   Latest submission: ${stats[0].latest_submission || "None"}`)

    // Show recent submissions
    if (stats[0].total_addresses > 0) {
      console.log("\n6. Recent submissions:")
      const recent = await sql`
        SELECT id, wallet_address, nft_level, nft_name, created_at
        FROM addresses
        ORDER BY created_at DESC
        LIMIT 5
      `

      recent.forEach((record, index) => {
        console.log(
          `   ${index + 1}. ID ${record.id}: ${record.wallet_address} (Level ${record.nft_level}) - ${record.created_at}`,
        )
      })
    }

    console.log("\n🎉 Address submission system test completed!")
  } catch (error) {
    console.error("❌ Test failed:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    })
  }
}

testAddressSubmission()
