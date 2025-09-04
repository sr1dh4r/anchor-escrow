#!/bin/bash

# Source configuration
source "$(dirname "$0")/test-config.sh"

# Setup Solana CLI config
mkdir -p /root/.config/solana
cp $DEV_WALLET_FILE /root/.config/solana/id.json
solana config set --url devnet

# Function to check balance for a specific wallet
check_balance() {
    local wallet_name="$1"
    local wallet_address="$2"
    local ata_address="$3"
    
    echo "📊 $wallet_name Token A Balance:"
    echo "Wallet: $wallet_address"
    echo "Token A: $TOKEN_A_MINT"
    if [ -n "$ata_address" ]; then
        echo "ATA: $ata_address"
    fi
    echo "Balance:"
    spl-token balance $TOKEN_A_MINT --owner $wallet_address
    echo ""
}

# Check if specific wallet requested
if [ "$1" = "seller" ] || [ "$1" = "initializer" ]; then
    check_balance "Seller (Initializer)" "$INITIALIZER_WALLET" "$INITIALIZER_ATA_A"
elif [ "$1" = "buyer" ] || [ "$1" = "taker" ]; then
    check_balance "Buyer (Taker)" "$TAKER_WALLET" "$TAKER_ATA_A"
elif [ "$1" = "platform" ]; then
    check_balance "Platform" "$PLATFORM_WALLET" ""
else
    # Check all wallets by default
    echo "🔍 Checking Token A balances for all wallets..."
    echo "=============================================="
    echo ""
    
    check_balance "Seller (Initializer)" "$INITIALIZER_WALLET" "$INITIALIZER_ATA_A"
    check_balance "Buyer (Taker)" "$TAKER_WALLET" "$TAKER_ATA_A"
    check_balance "Platform" "$PLATFORM_WALLET" ""
    
    echo "✅ Balance check complete!"
fi
