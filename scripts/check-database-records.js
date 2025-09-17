const { neon } = require("@neondatabase/serverless")

async function checkDatabaseRecords() {
  try {
    console.log("[v0] Connecting to database...")
    const sql = neon(process.env.DATABASE_URL)

    // Check if the addresses table exists
    console.log("[v0] Checking if addresses table exists...")
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'addresses'
      );
    `
    console.log("[v0] Table exists:", tableExists[0].exists)

    // Get total count of records
    console.log("[v0] Getting total record count...")
    const totalCount = await sql`SELECT COUNT(*) as count FROM addresses`
    console.log("[v0] Total records in addresses table:", totalCount[0].count)

    // Check for the specific record with ID 942
    console.log("[v0] Looking for record with ID 942...")
    const specificRecord = await sql`
      SELECT * FROM addresses WHERE id = 942
    `
    console.log("[v0] Record 942:", specificRecord)

    // Get the last 10 records to see recent submissions
    console.log("[v0] Getting last 10 records...")
    const recentRecords = await sql`
      SELECT id, wallet_address, nft_level, nft_name, submitted_at 
      FROM addresses 
      ORDER BY id DESC 
      LIMIT 10
    `
    console.log("[v0] Recent records:", recentRecords)

    // Check for the specific wallet address from the logs
    console.log("[v0] Looking for wallet address 0x4FDf42F426546f40Cc3367Ed2555ADAaAAd3598d...")
    const walletRecord = await sql`
      SELECT * FROM addresses 
      WHERE wallet_address = '0x4FDf42F426546f40Cc3367Ed2555ADAaAAd3598d'
    `
    console.log("[v0] Wallet address records:", walletRecord)

    // Test a simple insert to verify database is writable
    console.log("[v0] Testing database write capability...")
    const testInsert = await sql`
      INSERT INTO addresses (wallet_address, nft_level, nft_name, session_id)
      VALUES ('0xTEST123', 1, 'Test NFT', 'test-session')
      RETURNING id
    `
    console.log("[v0] Test insert successful, ID:", testInsert[0].id)

    // Clean up test record
    await sql`DELETE FROM addresses WHERE wallet_address = '0xTEST123'`
    console.log("[v0] Test record cleaned up")
  } catch (error) {
    console.error("[v0] Database check error:", error)
    console.error("[v0] Error details:", error.message)
  }
}

checkDatabaseRecords()
