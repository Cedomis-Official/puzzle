const { neon } = require("@neondatabase/serverless")

async function checkTable() {
  try {
    console.log("[v0] Connecting to database...")
    const sql = neon(process.env.DATABASE_URL)

    console.log("[v0] Checking if addresses table exists...")

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'addresses'
      );
    `

    console.log("[v0] Table exists result:", tableExists[0].exists)

    if (!tableExists[0].exists) {
      console.log("[v0] ❌ ADDRESSES TABLE DOES NOT EXIST!")
      console.log("[v0] Creating addresses table...")

      await sql`
        CREATE TABLE addresses (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(42) NOT NULL,
          nft_level INTEGER NOT NULL,
          nft_name VARCHAR(255) NOT NULL,
          user_agent TEXT,
          ip_address VARCHAR(45),
          session_id VARCHAR(255),
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(wallet_address, nft_level)
        );
      `

      console.log("[v0] ✅ Addresses table created successfully!")
    } else {
      console.log("[v0] ✅ Addresses table exists")

      // Check table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'addresses'
        ORDER BY ordinal_position;
      `

      console.log("[v0] Table structure:")
      columns.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "NOT NULL" : "NULL"}`)
      })

      // Check recent records
      const recentRecords = await sql`
        SELECT id, wallet_address, nft_level, nft_name, submitted_at
        FROM addresses
        ORDER BY submitted_at DESC
        LIMIT 5;
      `

      console.log(`[v0] Recent records (${recentRecords.length}):`)
      recentRecords.forEach((record) => {
        console.log(
          `  - ID ${record.id}: ${record.wallet_address} (Level ${record.nft_level}) - ${record.submitted_at}`,
        )
      })

      // Get total count
      const totalCount = await sql`SELECT COUNT(*) as count FROM addresses;`
      console.log(`[v0] Total addresses in database: ${totalCount[0].count}`)
    }

    console.log("[v0] ✅ Database check completed successfully")
  } catch (error) {
    console.error("[v0] ❌ Database check failed:", error)
    console.error("[v0] Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    })
  }
}

checkTable()
