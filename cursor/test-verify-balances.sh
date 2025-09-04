#!/bin/bash

# Master script to verify all wallet balances using test-balances.sh
# Usage: ./test-verify-balances.sh [before|after]

# Source configuration
source "$(dirname "$0")/test-config.sh"

# Get the phase (before or after)
PHASE=${1:-"current"}

echo "🔍 COMPREHENSIVE BALANCE VERIFICATION - $PHASE"
echo "============================================="
echo ""

# Run the main balance check script
echo "📊 Checking all wallet balances..."
echo "================================="
echo ""

# Use test-balances.sh to check all wallets
"$(dirname "$0")/test-balances.sh"

echo ""
echo "✅ Balance verification complete for $PHASE phase!"
echo ""

# Show usage examples
echo "💡 Usage Examples:"
echo "=================="
echo "Check all wallets:     ./test-balances.sh"
echo "Check seller only:     ./test-balances.sh seller"
echo "Check buyer only:      ./test-balances.sh buyer"
echo "Check platform only:   ./test-balances.sh platform"
echo "Verify before escrow:  ./test-verify-balances.sh before"
echo "Verify after escrow:   ./test-verify-balances.sh after"
