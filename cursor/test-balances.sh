#!/bin/bash
set -euo pipefail

# Load configuration
source /workspace/cursor/test-config.sh

# Setup Solana CLI config
mkdir -p /root/.config/solana
cp $DEV_WALLET_FILE /root/.config/solana/id.json
solana config set --url devnet

echo "🔍 Checking Token Balances"
echo "=========================="
echo "Wallet: $INITIALIZER_WALLET"
echo "Token A: $TOKEN_A_MINT"
echo "Token B: $TOKEN_B_MINT"
echo ""

echo "📊 Current Token Balances:"
echo "=========================="
echo "Token A Balance: $(spl-token balance "$TOKEN_A_MINT")"
echo "Token B Balance: $(spl-token balance "$TOKEN_B_MINT")"
echo ""

echo "🔗 Token Account Addresses:"
echo "==========================="
TOKEN_A_ATA=$(spl-token accounts "$TOKEN_A_MINT" --output json | jq -r '.accounts[0].address')
TOKEN_B_ATA=$(spl-token accounts "$TOKEN_B_MINT" --output json | jq -r '.accounts[0].address')
echo "Token A ATA: $TOKEN_A_ATA"
echo "Token B ATA: $TOKEN_B_ATA"
echo ""

echo "✅ Balance check complete!"
