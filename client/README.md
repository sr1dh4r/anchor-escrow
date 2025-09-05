# Solana Escrow API - JavaScript Client

A vanilla JavaScript client for interacting with the Solana escrow program. This API enables secure token trading with off-chain payment confirmation.

## 🎯 Overview

The Escrow API implements a one-sided escrow pattern for USDT-INR trading:
- **Seller** deposits USDT on-chain
- **Buyer** pays INR off-chain via traditional payment methods
- **Escrow** holds USDT until payment confirmation
- **Release** happens only after payment confirmation

## 📦 Dependencies

Before using this API, ensure you have the following dependencies loaded:

## ⚠️ Important: IDL File Management

The client uses a local IDL file (`anchor_escrow.json`) to interact with the Solana program. **This file must be kept in sync with the deployed program.**

### When to Update the IDL File:
- After any changes to the Solana program code
- After rebuilding the program with `anchor build`
- When deploying a new version of the program

### How to Update:
```bash
# After building the program, copy the new IDL file
cp target/idl/anchor_escrow.json client/anchor_escrow.json
```

### What Happens if IDL is Outdated:
- Transaction calls may fail with unexpected errors
- Account structures may not match the deployed program
- The client may not work correctly with the updated program

**Always ensure the IDL file matches your deployed program version!**

```html
<!-- Solana Web3.js -->
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>

<!-- Coral Anchor -->
<script src="https://unpkg.com/@coral-xyz/anchor@latest/dist/index.iife.min.js"></script>

<!-- SPL Token -->
<script src="https://unpkg.com/@solana/spl-token@latest/lib/index.iife.min.js"></script>
```

Or install via npm:
```bash
npm install @solana/web3.js @coral-xyz/anchor @solana/spl-token
```

## 🚀 Quick Start

### 1. Initialize the API

```javascript
// Create connection
const connection = new solanaWeb3.Connection('https://api.devnet.solana.com', 'confirmed');

// Initialize Escrow API
const escrowAPI = new EscrowAPI(
    connection, 
    'Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW', // Program ID
    'devnet' // Network
);
```

### 2. Basic Usage

```javascript
// Example token mint (USDT on devnet)
const tokenMint = new solanaWeb3.PublicKey('J1UjsVLRwGcpoCjexjDaHWVoj9F3TbdCpwVYNUYkww6y');

// Create escrow (Seller)
const createResult = await escrowAPI.escrowCreate(
    sellerWallet,    // Keypair
    buyerWallet,     // PublicKey
    tokenMint,       // PublicKey
    100000          // Amount (0.1 USDT)
);

// Confirm payment (Buyer)
const confirmResult = await escrowAPI.escrowConfirmPayment(
    buyerWallet,     // Keypair
    createResult.escrow, // PublicKey
    tokenMint        // PublicKey
);

// Release tokens (Seller)
const releaseResult = await escrowAPI.escrowRelease(
    sellerWallet,    // Keypair
    buyerWallet,     // PublicKey
    tokenMint,       // PublicKey
    createResult.escrow // PublicKey
);
```

## 📚 API Reference

### Constructor

```javascript
new EscrowAPI(connection, programId, network)
```

**Parameters:**
- `connection` (Connection): Solana connection object
- `programId` (string): Program ID of the escrow program
- `network` (string): Network name ('devnet' or 'mainnet')

### Methods

#### `escrowCreate(sellerWallet, buyerWallet, tokenMint, amount, seed)`

Creates a new escrow and deposits tokens.

**Parameters:**
- `sellerWallet` (Keypair): Seller's wallet keypair
- `buyerWallet` (PublicKey): Buyer's wallet public key
- `tokenMint` (PublicKey): Token mint address
- `amount` (number): Amount of tokens to escrow (in smallest unit)
- `seed` (number, optional): Random seed for escrow account

**Returns:**
```javascript
{
    success: true,
    signature: "transaction_signature",
    escrow: "escrow_account_address",
    vault: "vault_account_address",
    seed: 12345,
    amount: 100000,
    explorerUrl: "https://explorer.solana.com/transaction/..."
}
```

#### `escrowConfirmPayment(buyerWallet, escrow, tokenMint)`

Confirms off-chain payment made by buyer.

**Parameters:**
- `buyerWallet` (Keypair): Buyer's wallet keypair
- `escrow` (PublicKey): Escrow account address
- `tokenMint` (PublicKey): Token mint address

**Returns:**
```javascript
{
    success: true,
    signature: "transaction_signature",
    explorerUrl: "https://explorer.solana.com/transaction/..."
}
```

#### `escrowRelease(sellerWallet, buyerWallet, tokenMint, escrow)`

Releases tokens to buyer after payment confirmation.

**Parameters:**
- `sellerWallet` (Keypair): Seller's wallet keypair
- `buyerWallet` (PublicKey): Buyer's wallet public key
- `tokenMint` (PublicKey): Token mint address
- `escrow` (PublicKey): Escrow account address

**Returns:**
```javascript
{
    success: true,
    signature: "transaction_signature",
    explorerUrl: "https://explorer.solana.com/transaction/..."
}
```

#### `escrowCancel(sellerWallet, tokenMint, escrow)`

Cancels escrow and returns tokens to seller.

**Parameters:**
- `sellerWallet` (Keypair): Seller's wallet keypair
- `tokenMint` (PublicKey): Token mint address
- `escrow` (PublicKey): Escrow account address

**Returns:**
```javascript
{
    success: true,
    signature: "transaction_signature",
    explorerUrl: "https://explorer.solana.com/transaction/..."
}
```

#### `getEscrowData(escrow)`

Fetches escrow account data.

**Parameters:**
- `escrow` (PublicKey): Escrow account address

**Returns:**
```javascript
{
    seed: "12345",
    bump: 255,
    initializer: "seller_wallet_address",
    mintA: "token_mint_address",
    mintB: "token_mint_address",
    initializerAmount: "100000",
    takerAmount: "0",
    paymentConfirmed: true
}
```

#### `getTokenBalance(wallet, tokenMint)`

Gets token balance for a wallet.

**Parameters:**
- `wallet` (PublicKey): Wallet public key
- `tokenMint` (PublicKey): Token mint address

**Returns:**
- `number`: Token balance in smallest unit

#### `getSolBalance(wallet)`

Gets SOL balance for a wallet.

**Parameters:**
- `wallet` (PublicKey): Wallet public key

**Returns:**
- `number`: SOL balance in lamports

## 🔄 Complete Workflow Example

```javascript
async function completeEscrowWorkflow() {
    try {
        // 1. Initialize API
        const connection = new solanaWeb3.Connection('https://api.devnet.solana.com', 'confirmed');
        const escrowAPI = new EscrowAPI(connection, 'Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW');
        
        // 2. Define participants and token
        const sellerWallet = solanaWeb3.Keypair.generate(); // In real app, use user's wallet
        const buyerWallet = solanaWeb3.Keypair.generate();
        const tokenMint = new solanaWeb3.PublicKey('J1UjsVLRwGcpoCjexjDaHWVoj9F3TbdCpwVYNUYkww6y');
        
        // 3. Create escrow (Seller deposits USDT)
        console.log('Creating escrow...');
        const createResult = await escrowAPI.escrowCreate(
            sellerWallet,
            buyerWallet.publicKey,
            tokenMint,
            100000 // 0.1 USDT
        );
        console.log('Escrow created:', createResult.escrow);
        
        // 4. Confirm payment (Buyer confirms INR payment)
        console.log('Confirming payment...');
        const confirmResult = await escrowAPI.escrowConfirmPayment(
            buyerWallet,
            createResult.escrow,
            tokenMint
        );
        console.log('Payment confirmed');
        
        // 5. Release tokens (Seller releases USDT to buyer)
        console.log('Releasing tokens...');
        const releaseResult = await escrowAPI.escrowRelease(
            sellerWallet,
            buyerWallet.publicKey,
            tokenMint,
            createResult.escrow
        );
        console.log('Tokens released');
        
        // 6. Verify final balances
        const sellerBalance = await escrowAPI.getTokenBalance(sellerWallet.publicKey, tokenMint);
        const buyerBalance = await escrowAPI.getTokenBalance(buyerWallet.publicKey, tokenMint);
        
        console.log('Final balances:');
        console.log('Seller:', sellerBalance);
        console.log('Buyer:', buyerBalance);
        
    } catch (error) {
        console.error('Escrow workflow failed:', error);
    }
}
```

## 🔐 Security Features

### Payment Confirmation Required
- USDT can only be released after `payment_confirmed = true`
- Prevents premature token release

### Platform Fee
- **Fee Percentage**: 6% (hardcoded in program)
- **Platform Wallet**: `CkjSZdXopqgh7jkPFn8MxdU7QKwfYdjQNNwbYABFpCx2`
- **Automatic Distribution**: Fee collected before releasing to buyer

### Atomic Operations
- Each instruction is atomic (all-or-nothing)
- No partial state changes

## 🌐 Network Configuration

### Devnet (Testing)
```javascript
const connection = new solanaWeb3.Connection('https://api.devnet.solana.com', 'confirmed');
const programId = 'Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW';
```

### Mainnet (Production)
```javascript
const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const programId = 'Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW';
```

## 🧪 Testing

The API is designed to work with the test suite in the parent directory:

```bash
# Run complete test suite
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 ./cursor/test-escrow.sh
```

## ⚠️ Important Notes

### Off-Chain Payment Risk
- INR payment happens off-chain (not on Solana)
- Requires trust in payment confirmation
- Consider escrow services for large amounts

### Gas Costs
- Each instruction costs SOL for transaction fees
- Factor in gas costs for small trades

### Wallet Integration
- This API works with any Solana wallet
- For production, integrate with Phantom, Solflare, etc.

## 🐛 Error Handling

All methods include proper error handling and will throw descriptive errors:

```javascript
try {
    const result = await escrowAPI.escrowCreate(sellerWallet, buyerWallet, tokenMint, amount);
    console.log('Success:', result);
} catch (error) {
    console.error('Error:', error.message);
    // Handle specific error types
    if (error.message.includes('insufficient funds')) {
        // Handle insufficient funds
    } else if (error.message.includes('account not found')) {
        // Handle missing account
    }
}
```

## 📞 Support

For issues and questions:
1. Check the Solana Explorer links for transaction details
2. Verify wallet balances and token availability
3. Ensure proper network configuration
4. Review the program logs for specific error messages

## 🎉 Success Criteria

A successful escrow transaction should show:
1. ✅ **Proper Initialization**: Escrow created with correct parameters
2. ✅ **Payment Confirmation**: Buyer confirms off-chain payment
3. ✅ **Token Release**: Seller releases tokens to buyer
4. ✅ **Balance Verification**: Expected balance changes in both wallets
5. ✅ **Platform Fee**: 6% fee collected by platform wallet
