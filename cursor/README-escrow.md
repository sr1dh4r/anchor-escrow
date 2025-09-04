# Solana One-Sided Escrow Program

This document explains the one-sided escrow program designed for USDT-INR trading with off-chain INR payments.

## 🎯 **Program Overview**

The escrow program enables secure token trading where:
- **Seller** deposits USDT (or any SPL token) on-chain
- **Buyer** pays INR off-chain via traditional payment methods
- **Escrow** holds USDT until INR payment is confirmed
- **Release** happens only after payment confirmation

## 🔄 **Escrow Sequence**

### **Step 1: Initialize Escrow**
```rust
pub fn initialize(
    ctx: Context<Initialize>,
    seed: u64,
    initializer_amount: u64,  // USDT amount (e.g., 100000 = 0.1 USDT)
    taker_amount: u64,        // Always 0 for one-sided escrow
) -> Result<()>
```

**What happens:**
- Seller deposits USDT into escrow vault
- Escrow state created with `payment_confirmed = false`
- No Token B required (taker_amount = 0)

**Signer:** Seller only

### **Step 2: Confirm Off-Chain Payment**
```rust
pub fn confirm_payment(ctx: Context<ConfirmPayment>) -> Result<()>
```

**What happens:**
- Buyer confirms INR payment made off-chain
- Sets `payment_confirmed = true` in escrow state
- Enables seller to release USDT

**Signer:** Buyer only

### **Step 3: Release Tokens**
```rust
pub fn exchange(ctx: Context<Exchange>) -> Result<()>
```

**What happens:**
- Seller releases USDT from vault to buyer
- Escrow account closed and vault emptied
- Only works if `payment_confirmed = true`

**Signer:** Seller only

### **Step 4: Cancel (Optional)**
```rust
pub fn cancel(ctx: Context<Cancel>) -> Result<()>
```

**What happens:**
- Seller cancels escrow before payment confirmation
- USDT returned to seller
- Escrow account closed

**Signer:** Seller only

## 🏗️ **Program Architecture**

### **Escrow State**
```rust
pub struct Escrow {
    pub seed: u64,
    pub bump: u8,
    pub initializer: Pubkey,        // Seller
    pub mint_a: Pubkey,            // USDT mint
    pub mint_b: Pubkey,            // Unused (kept for compatibility)
    pub initializer_amount: u64,   // USDT amount
    pub taker_amount: u64,         // Always 0
    pub payment_confirmed: bool,   // Payment confirmation flag
}
```

### **Key Accounts**
- **Escrow**: Program-derived address holding escrow state
- **Vault**: Associated token account holding USDT
- **Initializer ATA**: Seller's USDT account
- **Taker ATA**: Buyer's USDT account

## 🔐 **Security Features**

### **Payment Confirmation Required**
- USDT can only be released after `payment_confirmed = true`
- Prevents premature token release

### **Seller-Only Release**
- Only seller can release tokens (incentive alignment)
- Seller wants INR payment, so they'll release after confirmation

### **Atomic Operations**
- Each instruction is atomic (all-or-nothing)
- No partial state changes

### **Account Validation**
- All accounts validated through Anchor constraints
- Proper ownership and authority checks

## 💰 **Use Cases**

### **USDT-INR Trading**
- **Seller**: Has USDT, wants INR
- **Buyer**: Has INR, wants USDT
- **Process**: USDT locked → INR paid off-chain → USDT released

### **Any SPL Token Trading**
- **Generic Design**: Works with USDC, SOL, or any SPL token
- **Off-Chain Payment**: Any traditional payment method (bank transfer, UPI, etc.)

## 🧪 **Testing**

### **Test Workflow**
1. **Initialize**: Create escrow with 0.1 Token A
2. **Confirm**: Buyer confirms off-chain payment
3. **Release**: Seller releases tokens to buyer
4. **Verify**: Check balance changes

### **Expected Results**
- **Seller**: -0.1 Token A (deposited), +INR (off-chain)
- **Buyer**: +0.1 Token A (received), -INR (off-chain)

## 🚀 **Deployment**

### **Program ID**
```
Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW
```

### **Network**
- **Devnet**: For testing and development
- **Mainnet**: For production use

## 📊 **Transaction Examples**

### **Initialize Transaction**
```
https://explorer.solana.com/transaction/56eXu66AV2KcrJDRG82kM8dQj4b4nq1dEbDq7UACg2dtDArfSz24DH2h6WjZULhReVRRS7jgb6GWpscjY3Lnim4Q?cluster=devnet
```

### **Confirm Payment Transaction**
```
https://explorer.solana.com/transaction/4JoRvFjhPFtHQ2uNCXhzeS8pacU3SRwKRaiC2K7Lgsk74LGgvwSPgYqXQhTYtRLyesehUfqRpADAUJwMrmQDgpb1?cluster=devnet
```

### **Release Transaction**
```
https://explorer.solana.com/transaction/xzF3oXppwAFA6JXLDzwonWZw146981X9wfAauwstxCFV4JgobypCq6omHJRRtPmkbfJnbcWWiUUkeeHhSPWDQAL?cluster=devnet
```

## 🔧 **Integration**

### **Frontend Integration**
- **Initialize**: Seller calls `initialize` with USDT amount
- **Payment**: Buyer makes INR payment via UPI/Bank
- **Confirm**: Buyer calls `confirm_payment`
- **Release**: Seller calls `exchange` to release USDT

### **Backend Integration**
- **Payment Gateway**: Integrate with UPI/Bank APIs
- **Webhook**: Confirm payment automatically
- **Monitoring**: Track escrow states and payments

## ⚠️ **Important Notes**

### **Off-Chain Payment Risk**
- INR payment happens off-chain (not on Solana)
- Requires trust in payment confirmation
- Consider escrow services for large amounts

### **Dispute Resolution**
- No built-in dispute resolution
- Handle disputes off-chain
- Consider multi-sig for large amounts

### **Gas Costs**
- Each instruction costs SOL for transaction fees
- Factor in gas costs for small trades

## 🎉 **Success Criteria**

A successful one-sided escrow:
1. ✅ **USDT Deposited**: Seller deposits USDT into escrow
2. ✅ **Payment Confirmed**: Buyer confirms INR payment
3. ✅ **USDT Released**: Seller releases USDT to buyer
4. ✅ **Balances Updated**: Both parties have correct token balances
5. ✅ **Escrow Closed**: No remaining escrow state

The program is now ready for production use with real USDT-INR trading! 🚀
