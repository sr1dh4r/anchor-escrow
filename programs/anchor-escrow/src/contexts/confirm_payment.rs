use anchor_lang::prelude::*;
use crate::states::Escrow;

#[derive(Accounts)]
pub struct ConfirmPayment<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(
        mut,
        has_one = mint_a,
        seeds=[b"state", escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    pub mint_a: Account<'info, anchor_spl::token::Mint>,
}

impl<'info> ConfirmPayment<'info> {
    pub fn confirm_payment(&mut self) -> Result<()> {
        self.escrow.payment_confirmed = true;
        Ok(())
    }
}
