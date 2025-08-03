use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked},
};

use crate::states::Escrow;

#[derive(Accounts)]
#[instruction(seed: u64, usdt_amount: u64, inr_amount: u64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,                    // USDT seller
    pub buyer: SystemAccount<'info>,              // INR buyer (doesn't need to sign for creation)
    pub usdt_mint: Account<'info, Mint>,          // USDT mint
    #[account(
        mut,
        constraint = seller_usdt_ata.amount >= usdt_amount,
        associated_token::mint = usdt_mint,
        associated_token::authority = seller
    )]
    pub seller_usdt_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = seller,
        space = Escrow::INIT_SPACE,
        seeds = [b"state".as_ref(), &seed.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = usdt_mint,
        associated_token::authority = escrow
    )]
    pub vault: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize_escrow(
        &mut self,
        seed: u64,
        bumps: &InitializeBumps,
        usdt_amount: u64,
        inr_amount: u64,
    ) -> Result<()> {
        self.escrow.set_inner(Escrow {
            seed,
            bump: bumps.escrow,
            seller: self.seller.key(),
            buyer: self.buyer.key(),
            usdt_mint: self.usdt_mint.key(),
            usdt_amount,
            inr_amount,
            is_paid: false,
            is_completed: false,
        });
        Ok(())
    }

    pub fn deposit(&mut self, usdt_amount: u64) -> Result<()> {
        transfer_checked(
            self.into_deposit_context(),
            usdt_amount,
            self.usdt_mint.decimals,
        )
    }

    fn into_deposit_context(&self) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            from: self.seller_usdt_ata.to_account_info(),
            mint: self.usdt_mint.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.seller.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}
