use anchor_lang::prelude::*;
mod contexts;
use contexts::*;
mod states;

declare_id!("BTcQwA3QqmkzaqTAMiKcnwAVNRpSNP1KdMUN5dXNLEUg");
#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        usdt_amount: u64,
        inr_amount: u64,
    ) -> Result<()> {
        ctx.accounts
            .initialize_escrow(seed, &ctx.bumps, usdt_amount, inr_amount)?;
        ctx.accounts.deposit(usdt_amount)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }

    pub fn confirm_payment(ctx: Context<ConfirmPayment>) -> Result<()> {
        ctx.accounts.confirm_payment()
    }

    pub fn release_usdt(ctx: Context<ReleaseUsdt>) -> Result<()> {
        ctx.accounts.release_usdt()
    }

    // Keep the old exchange instruction for backward compatibility
    pub fn exchange(ctx: Context<Exchange>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw_and_close_vault()
    }
}
