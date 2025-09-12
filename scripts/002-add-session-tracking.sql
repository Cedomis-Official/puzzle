-- Adding session tracking to addresses table while keeping it lean
-- This only stores wallet addresses and session IDs, not game progress data

ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

-- Add index for session tracking queries
CREATE INDEX IF NOT EXISTS idx_addresses_session_id ON addresses(session_id);

-- Add index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_addresses_wallet_level ON addresses(wallet_address, nft_level);

-- Update table comment
COMMENT ON TABLE addresses IS 'Stores only wallet addresses for NFT claims - game progress is cached locally';
COMMENT ON COLUMN addresses.session_id IS 'User session ID for analytics - game progress stored in browser cache';
