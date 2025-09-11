-- Create addresses table to store user wallet submissions
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  nft_level INTEGER NOT NULL,
  nft_name VARCHAR(100) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_addresses_wallet ON addresses(wallet_address);
CREATE INDEX IF NOT EXISTS idx_addresses_level ON addresses(nft_level);
CREATE INDEX IF NOT EXISTS idx_addresses_submitted_at ON addresses(submitted_at);

-- Add comments for documentation
COMMENT ON TABLE addresses IS 'Stores wallet addresses submitted by users for NFT rewards';
COMMENT ON COLUMN addresses.wallet_address IS 'EVM wallet address (0x format)';
COMMENT ON COLUMN addresses.nft_level IS 'Level at which the NFT was earned (10, 25, 50, 80, 100)';
COMMENT ON COLUMN addresses.nft_name IS 'Name of the NFT reward (Bronze, Silver, Gold, Diamond, Legendary)';
COMMENT ON COLUMN addresses.submitted_at IS 'When the address was submitted';
COMMENT ON COLUMN addresses.user_agent IS 'Browser user agent for analytics';
COMMENT ON COLUMN addresses.ip_address IS 'IP address for security/analytics';
