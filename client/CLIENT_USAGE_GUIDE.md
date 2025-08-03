# USDT-INR Escrow Program - Client Usage Guide

This guide explains how wallet users interact with your deployed USDT-INR escrow program.

## Prerequisites

- **Wallet**: Phantom, Solflare, or any Solana wallet
- **USDT**: User must have USDT tokens in their wallet
- **SOL**: For transaction fees
- **Program ID**: `3MS2fGZYpUG8BdTg1s1RzBbJyQe18foqAx9Y1AbBcAdW` (your deployed program)

## Program Instructions

### 1. Initialize Escrow (USDT Seller)

**Purpose**: USDT seller creates an escrow and deposits USDT

**Required Accounts**:
- `seller`: USDT seller's wallet (signer)
- `buyer`: INR buyer's wallet address
- `usdt_mint`: USDT mint address
- `seller_usdt_ata`: Seller's USDT token account
- `escrow`: PDA for escrow state
- `vault`: PDA for USDT vault
- `associated_token_program`: SPL Associated Token Program
- `token_program`: SPL Token Program
- `system_program`: System Program

**Parameters**:
- `seed`: Unique identifier (u64)
- `usdt_amount`: Amount of USDT to escrow (u64)
- `inr_amount`: Amount of INR to be paid (u64)

### 2. Confirm Payment (INR Buyer)

**Purpose**: INR buyer confirms off-chain payment was made

**Required Accounts**:
- `buyer`: INR buyer's wallet (signer)
- `escrow`: PDA for escrow state

**Parameters**: None

### 3. Release USDT (USDT Seller)

**Purpose**: USDT seller releases USDT to buyer after payment confirmation

**Required Accounts**:
- `seller`: USDT seller's wallet (signer)
- `buyer`: INR buyer's wallet address
- `usdt_mint`: USDT mint address
- `buyer_usdt_ata`: Buyer's USDT token account
- `escrow`: PDA for escrow state
- `vault`: PDA for USDT vault
- `associated_token_program`: SPL Associated Token Program
- `token_program`: SPL Token Program
- `system_program`: System Program

**Parameters**: None

### 4. Cancel Escrow (USDT Seller)

**Purpose**: USDT seller cancels escrow and gets USDT back

**Required Accounts**:
- `seller`: USDT seller's wallet (signer)
- `escrow`: PDA for escrow state
- `vault`: PDA for USDT vault
- `associated_token_program`: SPL Associated Token Program
- `token_program`: SPL Token Program
- `system_program`: System Program

**Parameters**: None

## Client-Side Implementation

### TypeScript/JavaScript Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { 
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

// Program setup
const programId = new PublicKey("3MS2fGZYpUG8BdTg1s1RzBbJyQe18foqAx9Y1AbBcAdW");
const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
const wallet = new anchor.Wallet(/* your wallet keypair */);
const provider = new anchor.AnchorProvider(connection, wallet, {});
const program = new anchor.Program(IDL, programId, provider);

// USDT mint address (replace with actual USDT mint on devnet)
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

async function initializeEscrow(
  seller: Keypair,
  buyer: PublicKey,
  usdtAmount: number,
  inrAmount: number
) {
  const seed = Math.floor(Math.random() * 1000000);
  
  // Generate PDAs
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), new anchor.BN(seed).toArrayLike(Buffer, "le", 8)],
    programId
  );
  
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [escrowPda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  const sellerUsdtAta = getAssociatedTokenAddressSync(USDT_MINT, seller.publicKey);
  const buyerUsdtAta = getAssociatedTokenAddressSync(USDT_MINT, buyer);
  
  try {
    const tx = await program.methods
      .initialize(new anchor.BN(seed), new anchor.BN(usdtAmount), new anchor.BN(inrAmount))
      .accounts({
        seller: seller.publicKey,
        buyer: buyer,
        usdtMint: USDT_MINT,
        sellerUsdtAta: sellerUsdtAta,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([seller])
      .rpc();
    
    console.log("Escrow initialized:", tx);
    return { escrowPda, vaultPda, seed };
  } catch (error) {
    console.error("Error initializing escrow:", error);
    throw error;
  }
}

async function confirmPayment(buyer: Keypair, escrowPda: PublicKey) {
  try {
    const tx = await program.methods
      .confirmPayment()
      .accounts({
        buyer: buyer.publicKey,
        escrow: escrowPda,
      })
      .signers([buyer])
      .rpc();
    
    console.log("Payment confirmed:", tx);
    return tx;
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw error;
  }
}

async function releaseUsdt(
  seller: Keypair,
  buyer: PublicKey,
  escrowPda: PublicKey,
  vaultPda: PublicKey
) {
  const buyerUsdtAta = getAssociatedTokenAddressSync(USDT_MINT, buyer);
  
  try {
    const tx = await program.methods
      .releaseUsdt()
      .accounts({
        seller: seller.publicKey,
        buyer: buyer,
        usdtMint: USDT_MINT,
        buyerUsdtAta: buyerUsdtAta,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([seller])
      .rpc();
    
    console.log("USDT released:", tx);
    return tx;
  } catch (error) {
    console.error("Error releasing USDT:", error);
    throw error;
  }
}

async function cancelEscrow(
  seller: Keypair,
  escrowPda: PublicKey,
  vaultPda: PublicKey
) {
  try {
    const tx = await program.methods
      .cancel()
      .accounts({
        seller: seller.publicKey,
        escrow: escrowPda,
        vault: vaultPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([seller])
      .rpc();
    
    console.log("Escrow cancelled:", tx);
    return tx;
  } catch (error) {
    console.error("Error cancelling escrow:", error);
    throw error;
  }
}
```

## Frontend Integration Examples

### React Hook Example

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export function useEscrowProgram() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const createEscrow = async (buyerAddress: string, usdtAmount: number, inrAmount: number) => {
    if (!publicKey) throw new Error("Wallet not connected");
    
    setLoading(true);
    try {
      const buyer = new PublicKey(buyerAddress);
      const result = await initializeEscrow(
        /* your wallet keypair */,
        buyer,
        usdtAmount,
        inrAmount
      );
      return result;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (escrowPda: string) => {
    if (!publicKey) throw new Error("Wallet not connected");
    
    setLoading(true);
    try {
      const escrow = new PublicKey(escrowPda);
      return await confirmPayment(/* your wallet keypair */, escrow);
    } finally {
      setLoading(false);
    }
  };

  return {
    createEscrow,
    confirmPayment,
    loading
  };
}
```

## Web3.js Integration

```javascript
const web3 = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@coral-xyz/anchor');

// Setup connection
const connection = new web3.Connection('https://api.devnet.solana.com');
const wallet = new web3.Keypair(); // Replace with actual wallet
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(IDL, PROGRAM_ID, provider);

// Example usage
async function createEscrow() {
  const seed = Math.floor(Math.random() * 1000000);
  const buyer = new web3.PublicKey('buyer_public_key_here');
  
  const [escrowPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('state'), new BN(seed).toArrayLike(Buffer, 'le', 8)],
    program.programId
  );
  
  await program.methods
    .initialize(new BN(seed), new BN(1000000), new BN(75000))
    .accounts({
      seller: wallet.publicKey,
      buyer: buyer,
      // ... other accounts
    })
    .rpc();
}
```

## Testing with Solana Playground

1. **Deploy Program**: Use Solana Playground to deploy your program
2. **Test Instructions**: Use the "Test" tab to call instructions
3. **Account Setup**: Ensure all required accounts are properly initialized
4. **Transaction Logs**: Monitor transaction logs for debugging

## Common Issues & Solutions

### 1. Insufficient USDT Balance
- **Error**: "Insufficient funds"
- **Solution**: Ensure seller has enough USDT in their token account

### 2. Wrong Signer
- **Error**: "Invalid signer"
- **Solution**: Ensure the correct wallet is signing the transaction

### 3. PDA Mismatch
- **Error**: "Invalid PDA"
- **Solution**: Double-check seed generation and PDA derivation

### 4. Account Not Found
- **Error**: "Account not found"
- **Solution**: Ensure all required accounts are created and funded

## Security Considerations

1. **Seed Generation**: Use cryptographically secure random seeds
2. **Account Validation**: Always validate account ownership
3. **Amount Checks**: Verify amounts before transactions
4. **State Verification**: Check escrow state before operations

## Next Steps

1. **Create Frontend**: Build a web interface for users
2. **Add Error Handling**: Implement comprehensive error handling
3. **Testing**: Test all scenarios thoroughly
4. **Documentation**: Create user-friendly documentation
5. **Monitoring**: Add transaction monitoring and alerts 