# Solana Escrow Program - Testing Guide

This guide explains how to test the Solana escrow program using the provided test scripts and real wallet integration.

## Overview

The escrow program enables two parties to exchange SPL tokens through a secure, on-chain escrow mechanism. This testing suite uses real wallets and tokens on Solana devnet to demonstrate the complete escrow workflow.

## Test Configuration

All test scripts use a centralized configuration file: `cursor/test-config.sh`

### Wallet Configuration
- **Initializer Wallet**: `8EiCwjqc561w1JXe1wdhkHQXkH8tW3SxMeHwh8KT2gjj`
- **Taker Wallet**: `DZYRaySJEXFsCRMrBRFTigX6VHVMxHLiP7BBtWUAoBCD`

### Token Configuration
- **Token A**: `J1UjsVLRwGcpoCjexjDaHWVoj9F3TbdCpwVYNUYkww6y`
- **Token B**: `5HNMvuKR4feePQ68UQMGt6XGhdbo18MuFG1XaYritJHT`

### Escrow Parameters
- **Exchange Amount**: 0.1 Token A ↔ 0.2 Token B
- **Exchange Ratio**: 1:2 (Token A : Token B)

## Test Scripts

### 1. Balance Checking

#### Check Your Wallet Balances
```bash
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 ./cursor/test-balances.sh
```

**Output:**
- Current Token A and Token B balances
- Associated Token Account (ATA) addresses
- Wallet address verification

#### Check Taker Wallet Balances
```bash
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 ./cursor/test-taker-balances.sh
```

**Output:**
- Taker's Token A and Token B balances
- Taker's ATA addresses
- Wallet address verification

### 2. Test Setup

#### Initialize Test Environment
```bash
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 ./cursor/test-setup.sh
```

**What it does:**
- Transfers SOL from your wallet to taker wallet
- Creates token accounts for taker wallet
- Transfers 0.3 of each token to taker for testing
- Displays final balance setup

**Expected Setup:**
- **Your Wallet**: ~0.7 Token A, ~0.7 Token B
- **Taker Wallet**: ~0.3 Token A, ~0.3 Token B

### 3. Complete Escrow Test

#### Run Full Escrow Workflow
```bash
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 ./cursor/test-escrow.sh
```

**Test Flow:**
1. **Before State**: Displays balances of both wallets
2. **Initialize**: Creates escrow with 0.1 Token A deposit
3. **Exchange**: Executes token swap (0.1 Token A ↔ 0.2 Token B)
4. **After State**: Shows final balances and changes
5. **Verification**: Confirms expected balance changes

## Expected Results

### Before Escrow
- **Initializer**: 700,000 Token A, 700,000 Token B
- **Taker**: 300,000 Token A, 300,000 Token B

### After Escrow
- **Initializer**: 699,999.9 Token A, 700,000.2 Token B
- **Taker**: 300,000.1 Token A, 299,999.8 Token B

### Balance Changes
- **Initializer**: -0.1 Token A, +0.2 Token B ✅
- **Taker**: +0.1 Token A, -0.2 Token B ✅

## Transaction Verification

Each test provides Solana Explorer links for transaction verification:

### Initialize Transaction
- **Purpose**: Creates escrow and deposits Token A
- **Signer**: Initializer wallet
- **Result**: Token A locked in escrow vault

### Exchange Transaction
- **Purpose**: Executes the token swap
- **Signer**: Taker wallet
- **Result**: Tokens exchanged between parties

## Test Architecture

### Real Wallet Integration
- Uses actual wallet keypairs (not generated test wallets)
- Operates on Solana devnet with real tokens
- Provides verifiable balance changes

### Test File Structure
```
tests/
├── anchor-escrow.ts          # Original Anchor test suite
└── real-escrow-test.ts       # Real wallet integration test
```

### Script Dependencies
- **Configuration**: `cursor/test-config.sh`
- **Wallet Files**: `cursor/dev-wallet.json`, `cursor/taker-wallet.json`
- **Environment**: Docker with Anchor v0.31.1

## Troubleshooting

### Common Issues

1. **Balance Mismatch**
   - Run `./cursor/test-setup.sh` to reset token distribution
   - Check if previous tests left escrow in unexpected state

2. **Transaction Failures**
   - Verify sufficient SOL for transaction fees
   - Check network connectivity to devnet
   - Ensure program is deployed and accessible

3. **Wallet Issues**
   - Verify wallet files exist in `cursor/` directory
   - Check wallet permissions and format
   - Ensure wallets have sufficient token balances

### Debug Commands

```bash
# Check current balances
./cursor/test-balances.sh
./cursor/test-taker-balances.sh

# Verify wallet addresses
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 bash -c "source /workspace/cursor/test-config.sh && echo 'Initializer: $INITIALIZER_WALLET' && echo 'Taker: $TAKER_WALLET'"

# Check Solana configuration
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 bash -c "solana config get"
```

## Success Criteria

A successful test run should show:

1. ✅ **Proper Initialization**: Escrow created with correct parameters
2. ✅ **Successful Exchange**: Tokens swapped between parties
3. ✅ **Balance Verification**: Expected balance changes in both wallets
4. ✅ **Transaction Links**: Valid Solana Explorer links for verification
5. ✅ **No Errors**: Clean execution without failures

## Next Steps

After successful testing:

1. **Deploy to Mainnet**: Use the same program for production
2. **Customize Parameters**: Modify exchange ratios and amounts
3. **Add Features**: Extend the escrow with additional functionality
4. **Integration**: Integrate with frontend applications

## Support

For testing issues:
1. Check the test output for specific error messages
2. Verify wallet balances and token availability
3. Ensure Docker environment is properly configured
4. Review Solana Explorer for transaction details
