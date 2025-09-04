use anchor_lang::prelude::*;
mod contexts;
use contexts::*;
mod states;

declare_id!("Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW");
#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        initializer_amount: u64,
        taker_amount: u64,
    ) -> Result<()> {
        ctx.accounts
            .initialize_escrow(seed, &ctx.bumps, initializer_amount, taker_amount)?;
        ctx.accounts.deposit(initializer_amount)
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }

    pub fn confirm_payment(ctx: Context<ConfirmPayment>) -> Result<()> {
        ctx.accounts.confirm_payment()
    }

    pub fn exchange(ctx: Context<Exchange>) -> Result<()> {
        ctx.accounts.withdraw_and_close_vault()
    }
}
