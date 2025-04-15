use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{VestingAccount, ANCHOR_DISCRIMINATOR};

#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct CreateVestingAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = VestingAccount::INIT_SPACE + ANCHOR_DISCRIMINATOR,
        seeds = [company_name.as_bytes()],
        bump
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    /*
        un programa SPL Token gestiona todos los tokens, y cada token tiene:
        * Una cuenta de tipo `Mint`: esta es la definición del token, como si fuera su contrato o su identidad.
        * Muchas cuentas de tipo `TokenAccount`: estas son los saldos que tienen los usuarios de ese token.
    */
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = signer,
        seeds = [b"vesting_treasury", company_name.as_bytes()],
        bump,
        token::mint = mint,
        token::authority = treasury_token_account
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>, // token_program porque estamos creando un token, es como el system_program pero del token
}

pub fn create_vesting(ctx: Context<CreateVestingAccount>, company_name: String) -> Result<()> {
    ctx.accounts.vesting_account.set_inner(VestingAccount {
        owner: ctx.accounts.signer.key(),
        mint: ctx.accounts.mint.key(),
        treasury_token_account: ctx.accounts.treasury_token_account.key(),
        company_name,
        treasury_bump: ctx.bumps.treasury_token_account,
        bump: ctx.bumps.vesting_account,
    });

    Ok(())
}
