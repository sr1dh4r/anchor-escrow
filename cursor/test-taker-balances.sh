#!/bin/bash
set -euo pipefail

# Load configuration
source /workspace/cursor/test-config.sh

# Setup Solana CLI config for taker wallet
mkdir -p /root/.config/solana
cp $TAKER_WALLET_FILE /root/.config/solana/id.json
solana config set --url devnet

WALLET_ADDR=$(solana address)

echo "🔍 Checking Taker Wallet Token Balances"
echo "======================================="
echo "Taker Wallet: $WALLET_ADDR"
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

echo "✅ Taker balance check complete!"
