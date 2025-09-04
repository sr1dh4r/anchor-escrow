#!/bin/bash
# Centralized configuration for escrow testing

# Wallet addresses
INITIALIZER_WALLET="8EiCwjqc561w1JXe1wdhkHQXkH8tW3SxMeHwh8KT2gjj"
TAKER_WALLET="DZYRaySJEXFsCRMrBRFTigX6VHVMxHLiP7BBtWUAoBCD"
PLATFORM_WALLET="CkjSZdXopqgh7jkPFn8MxdU7QKwfYdjQNNwbYABFpCx2"

# Token mints
TOKEN_A_MINT="J1UjsVLRwGcpoCjexjDaHWVoj9F3TbdCpwVYNUYkww6y"
TOKEN_B_MINT="5HNMvuKR4feePQ68UQMGt6XGhdbo18MuFG1XaYritJHT"

# Token ATAs for initializer (your wallet)
INITIALIZER_TOKEN_A_ATA="G18KD2UqM8Er98EY89ESfB1yvmepVmMfVSmkWfTw1Gf8"
INITIALIZER_TOKEN_B_ATA="AuxLmhwCSKJTpqvAqLm5489qiYeSR23C8Sbw7FoiMKjo"

# Token ATAs for taker wallet
TAKER_TOKEN_A_ATA="FxNgzWmhFsBf4HiRkMHH9kEDqecWBFgE3Cgr7GmMShAs"
TAKER_TOKEN_B_ATA="EwBqUHScQmTPaLv4h67yNTpXbgjqpQRHYSe3hwPLW7qn"

# Escrow amounts (in smallest units)
ESCROW_AMOUNT_A=100000  # 0.1 Token A
ESCROW_AMOUNT_B=200000  # 0.2 Token B

# File paths
DEV_WALLET_FILE="/workspace/cursor/wallet-dev.json"
TAKER_WALLET_FILE="/workspace/cursor/wallet-taker.json"

# Display configuration
echo "🔧 Escrow Configuration Loaded"
echo "=============================="
echo "Initializer: $INITIALIZER_WALLET"
echo "Taker: $TAKER_WALLET"
echo "Token A: $TOKEN_A_MINT"
echo "Token B: $TOKEN_B_MINT"
echo "Escrow: $ESCROW_AMOUNT_A Token A ↔ $ESCROW_AMOUNT_B Token B"
echo ""
