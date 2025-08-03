use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked},
};
use crate::states::Escrow;

#[derive(Accounts)]
pub struct ReleaseUsdt<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    pub buyer: SystemAccount<'info>,
    pub usdt_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = usdt_mint,
        associated_token::authority = buyer
    )]
    pub buyer_usdt_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = escrow.seller == seller.key(),
        constraint = escrow.is_paid,
        constraint = !escrow.is_completed,
        seeds = [b"state".as_ref(), &escrow.seed.to_le_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = escrow
    )]
    pub vault: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> ReleaseUsdt<'info> {
    pub fn release_usdt(&mut self) -> Result<()> {
        // Transfer USDT from vault to buyer
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"state",
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        transfer_checked(
            self.into_transfer_context().with_signer(&signer_seeds),
            self.escrow.usdt_amount,
            self.usdt_mint.decimals,
        )?;

        // Mark escrow as completed
        self.escrow.is_completed = true;
        
        Ok(())
    }

    fn into_transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.usdt_mint.to_account_info(),
            to: self.buyer_usdt_ata.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
} 