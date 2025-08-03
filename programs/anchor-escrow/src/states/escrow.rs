use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    pub seed: u64,
    pub bump: u8,
    pub seller: Pubkey,           // USDT seller
    pub buyer: Pubkey,            // INR buyer
    pub usdt_mint: Pubkey,        // USDT mint
    pub usdt_amount: u64,         // Amount of USDT being sold
    pub inr_amount: u64,          // Amount of INR to be paid (off-chain)
    pub is_paid: bool,            // Whether INR payment has been confirmed
    pub is_completed: bool,       // Whether USDT has been released to buyer
}

impl Space for Escrow {
    // First 8 Bytes are Discriminator (u64)
    const INIT_SPACE: usize = 8 + 8 + 1 + 32 + 32 + 32 + 8 + 8 + 1 + 1;
}
