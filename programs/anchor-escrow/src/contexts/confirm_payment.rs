use anchor_lang::prelude::*;
use crate::states::Escrow;

#[derive(Accounts)]
pub struct ConfirmPayment<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        constraint = escrow.buyer == buyer.key(),
        constraint = !escrow.is_paid,
        seeds = [b"state".as_ref(), &escrow.seed.to_le_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
}

impl<'info> ConfirmPayment<'info> {
    pub fn confirm_payment(&mut self) -> Result<()> {
        self.escrow.is_paid = true;
        Ok(())
    }
} 