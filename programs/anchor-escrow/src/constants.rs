use anchor_lang::prelude::*;

// Platform fee configuration - hardcoded in program
pub const PLATFORM_FEE_PERCENTAGE: u8 = 6; // 6% platform fee

// Platform wallet address - hardcoded in program
// This is the wallet that receives platform fees
pub const PLATFORM_WALLET: Pubkey = pubkey!("CkjSZdXopqgh7jkPFn8MxdU7QKwfYdjQNNwbYABFpCx2");
