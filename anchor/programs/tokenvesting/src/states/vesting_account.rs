use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VestingAccount {
    pub owner: Pubkey,
    pub mint: Pubkey, // token account
    pub treasury_token_account: Pubkey,
    #[max_len(24)]
    pub company_name: String,
    pub treasury_bump: u8, // treasury token account = los guarda para despues poder firmar por el
    pub bump: u8,          // vesting account bump
}
