#!/bin/bash
set -e

# Load configuration
source /workspace/cursor/test-config.sh

echo "🔧 Setting Up Two-Wallet Escrow Test"
echo "===================================="

# Setup
mkdir -p /root/.config/solana
cp $DEV_WALLET_FILE /root/.config/solana/id.json
solana config set --url devnet

# Get addresses
INITIALIZER_ADDR=$(solana address)
TAKER_ADDR=$(solana address --keypair $TAKER_WALLET_FILE)

echo "Initializer (your wallet): $INITIALIZER_ADDR"
echo "Taker wallet: $TAKER_ADDR"

echo ""
echo "💰 Transferring SOL from your wallet to taker..."
solana transfer $TAKER_ADDR 1 --allow-unfunded-recipient

echo ""
echo "🏗️ Creating token accounts for taker..."
spl-token create-account $TOKEN_A_MINT $TAKER_WALLET_FILE || echo "Token A account already exists"
spl-token create-account $TOKEN_B_MINT $TAKER_WALLET_FILE || echo "Token B account already exists"

echo ""
echo "🔄 Transferring tokens to taker for exchange..."
# Transfer 0.3 Token A to taker
spl-token transfer $TOKEN_A_MINT 300000 $TAKER_ADDR --fund-recipient
# Transfer 0.3 Token B to taker  
spl-token transfer $TOKEN_B_MINT 300000 $TAKER_ADDR --fund-recipient

echo ""
echo "📊 Final Setup - Token Balances:"
echo "================================"
echo "Initializer (your wallet):"
echo "Token A: $(spl-token balance $TOKEN_A_MINT)"
echo "Token B: $(spl-token balance $TOKEN_B_MINT)"
echo ""
echo "Taker wallet:"
echo "Token A: $(spl-token balance $TOKEN_A_MINT --owner $TAKER_ADDR)"
echo "Token B: $(spl-token balance $TOKEN_B_MINT --owner $TAKER_ADDR)"

echo ""
echo "✅ Setup complete! Ready for escrow test."
echo ""
echo "🎯 Test Plan:"
echo "- Initializer: Deposit 0.1 Token A → wants 0.2 Token B"
echo "- Taker: Deposit 0.2 Token B → wants 0.1 Token A"
echo "- Exchange ratio: 1:2 (Token A : Token B)"
