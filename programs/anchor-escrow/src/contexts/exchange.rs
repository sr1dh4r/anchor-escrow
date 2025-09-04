use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{
        close_account, transfer_checked, CloseAccount, Mint, Token, TokenAccount, TransferChecked,
    },
};

use crate::states::Escrow;
use crate::constants::{PLATFORM_FEE_PERCENTAGE, PLATFORM_WALLET};

#[derive(Accounts)]
pub struct Exchange<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub taker: SystemAccount<'info>,
    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = initializer,
        associated_token::mint = mint_a,
        associated_token::authority = taker
    )]
    pub taker_ata_a: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = initializer,
        associated_token::mint = mint_a,
        associated_token::authority = platform_wallet
    )]
    pub platform_ata_a: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        has_one = mint_a,
        constraint = escrow.payment_confirmed == true,
        close = initializer,
        seeds=[b"state", escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is the hardcoded platform wallet address
    #[account(address = PLATFORM_WALLET)]
    pub platform_wallet: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Exchange<'info> {
    pub fn withdraw_and_close_vault(&mut self) -> Result<()> {
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"state",
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        // Calculate platform fee and buyer amount using hardcoded constants
        let total_amount = self.escrow.initializer_amount;
        let platform_fee = (total_amount * PLATFORM_FEE_PERCENTAGE as u64) / 100;
        let buyer_amount = total_amount - platform_fee;

        // Transfer platform fee to platform wallet
        if platform_fee > 0 {
            transfer_checked(
                self.into_platform_fee_context().with_signer(&signer_seeds),
                platform_fee,
                self.mint_a.decimals,
            )?;
        }

        // Transfer remaining amount to buyer
        transfer_checked(
            self.into_withdraw_context().with_signer(&signer_seeds),
            buyer_amount,
            self.mint_a.decimals,
        )?;

        close_account(self.into_close_context().with_signer(&signer_seeds))
    }

    fn into_withdraw_context(&self) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_platform_fee_context(&self) -> CpiContext<'_, '_, '_, 'info, TransferChecked<'info>> {
        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.platform_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }

    fn into_close_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.initializer.to_account_info(),
            authority: self.escrow.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}
