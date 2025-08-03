# USDT-INR Escrow System

This is a modified version of the Anchor Escrow program that supports USDT sellers and INR buyers with off-chain INR payment confirmation.

## Overview

The escrow system allows:
- **USDT Seller**: Deposits USDT into an escrow vault
- **INR Buyer**: Confirms INR payment has been made off-chain
- **Seller Confirmation**: Seller releases USDT to buyer after payment confirmation

## Key Features

### 1. Escrow Creation (`initialize`)
- USDT seller creates an escrow with a unique seed
- Specifies USDT amount and INR amount
- Deposits USDT into escrow vault
- Buyer doesn't need to sign during creation

### 2. Payment Confirmation (`confirm_payment`)
- INR buyer confirms that INR payment has been made off-chain
- Only the buyer can call this instruction
- Marks the escrow as `is_paid = true`

### 3. USDT Release (`release_usdt`)
- USDT seller releases USDT to buyer after payment confirmation
- Only works if `is_paid = true` and `is_completed = false`
- Transfers USDT from vault to buyer's account
- Marks escrow as `is_completed = true`

### 4. Escrow Cancellation (`cancel`)
- USDT seller can cancel the escrow before completion
- Returns USDT from vault back to seller
- Closes the escrow account

## Escrow State Structure

```rust
pub struct Escrow {
    pub seed: u64,                    // Unique identifier
    pub bump: u8,                     // PDA bump
    pub seller: Pubkey,               // USDT seller
    pub buyer: Pubkey,                // INR buyer
    pub usdt_mint: Pubkey,            // USDT mint address
    pub usdt_amount: u64,             // Amount of USDT
    pub inr_amount: u64,              // Amount of INR (off-chain)
    pub is_paid: bool,                // INR payment confirmed
    pub is_completed: bool,           // USDT released to buyer
}
```

## Workflow

1. **Seller creates escrow**: Deposits USDT, specifies INR amount
2. **Buyer confirms payment**: Marks INR payment as received (off-chain)
3. **Seller releases USDT**: Transfers USDT to buyer after payment confirmation
4. **Alternative**: Seller can cancel escrow anytime before completion

## Security Features

- Only the seller can cancel the escrow
- Only the buyer can confirm payment
- Only the seller can release USDT (after payment confirmation)
- USDT is held in a PDA vault until released
- All transfers use `transfer_checked` for safety

## Usage Example

```typescript
// 1. Seller creates escrow
await program.methods
  .initialize(seed, usdtAmount, inrAmount)
  .accounts({
    seller: seller.publicKey,
    buyer: buyer.publicKey,
    usdtMint: usdtMint,
    sellerUsdtAta: sellerUsdtAta,
    escrow: escrowPda,
    vault: vaultPda,
    // ... other accounts
  })
  .signers([seller])
  .rpc();

// 2. Buyer confirms INR payment
await program.methods
  .confirmPayment()
  .accounts({
    buyer: buyer.publicKey,
    escrow: escrowPda,
  })
  .signers([buyer])
  .rpc();

// 3. Seller releases USDT
await program.methods
  .releaseUsdt()
  .accounts({
    seller: seller.publicKey,
    buyer: buyer.publicKey,
    usdtMint: usdtMint,
    buyerUsdtAta: buyerUsdtAta,
    escrow: escrowPda,
    vault: vaultPda,
    // ... other accounts
  })
  .signers([seller])
  .rpc();
```

## Backward Compatibility

The original `exchange` instruction is still available for the old token-to-token escrow functionality. 