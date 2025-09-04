#!/bin/bash
set -euo pipefail

# Load configuration
source /workspace/cursor/test-config.sh

echo "🚀 Starting Real Escrow Test"
echo "============================"

# Setup Solana CLI
mkdir -p /root/.config/solana
cp $DEV_WALLET_FILE /root/.config/solana/id.json
solana config set --url devnet

echo ""
echo "📊 BEFORE ESCROW - Token Balances:"
echo "=================================="
echo "Initializer (your wallet):"
INITIALIZER_A_BEFORE=$(spl-token balance $TOKEN_A_MINT)
INITIALIZER_B_BEFORE=$(spl-token balance $TOKEN_B_MINT)
echo "Token A: $INITIALIZER_A_BEFORE"
echo "Token B: $INITIALIZER_B_BEFORE"
echo ""
echo "Taker wallet:"
TAKER_A_BEFORE=$(spl-token balance $TOKEN_A_MINT --owner $TAKER_WALLET)
TAKER_B_BEFORE=$(spl-token balance $TOKEN_B_MINT --owner $TAKER_WALLET)
echo "Token A: $TAKER_A_BEFORE"
echo "Token B: $TAKER_B_BEFORE"

echo ""
echo "🎯 Running Anchor Test with Real Wallets..."
echo "==========================================="

# Run the real escrow test
yarn install --ignore-engines
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=/root/.config/solana/id.json
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/anchor-escrow.ts

echo ""
echo "📊 AFTER ESCROW - Token Balances:"
echo "================================="
echo "Initializer (your wallet):"
INITIALIZER_A_AFTER=$(spl-token balance $TOKEN_A_MINT)
INITIALIZER_B_AFTER=$(spl-token balance $TOKEN_B_MINT)
echo "Token A: $INITIALIZER_A_AFTER"
echo "Token B: $INITIALIZER_B_AFTER"
echo ""
echo "Taker wallet:"
TAKER_A_AFTER=$(spl-token balance $TOKEN_A_MINT --owner $TAKER_WALLET)
TAKER_B_AFTER=$(spl-token balance $TOKEN_B_MINT --owner $TAKER_WALLET)
echo "Token A: $TAKER_A_AFTER"
echo "Token B: $TAKER_B_AFTER"

echo ""
echo "📈 Balance Changes:"
echo "=================="
echo "Initializer changes:"
echo "Token A: $INITIALIZER_A_BEFORE → $INITIALIZER_A_AFTER"
echo "Token B: $INITIALIZER_B_BEFORE → $INITIALIZER_B_AFTER"
echo ""
echo "Taker changes:"
echo "Token A: $TAKER_A_BEFORE → $TAKER_A_AFTER"
echo "Token B: $TAKER_B_BEFORE → $TAKER_B_AFTER"

echo ""
echo "✅ Escrow test complete!"
