use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken,  token_interface::{Mint,TokenAccount, TokenInterface,TransferChecked, transfer_checked}};

use crate::{ CustomErrors, EmployeeAccount, VestingAccount};

#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        mut, 
        seeds = [b"employee_vesting", beneficiary.key().as_ref(), vesting_account.key().as_ref()],
        bump = employee_account.bump,
        has_one = beneficiary,
        has_one = vesting_account   
    )]
    pub employee_account: Account<'info, EmployeeAccount>,

    #[account(
        mut,  
        seeds = [company_name.as_bytes()],
        bump = vesting_account.bump,
        has_one = mint,
        has_one = treasury_token_account,
    )]
    pub vesting_account: Account<'info, VestingAccount>,    
    
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = beneficiary,
        associated_token::mint = mint,
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program
    )]
    pub employee_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info,  System>,
    pub token_program : Interface<'info, TokenInterface>,
    pub associated_token_program : Program<'info, AssociatedToken>
}

pub fn claim_tokens(ctx: Context<ClaimTokens>, _company_name: String) -> Result<()> {
    // calculate total claimable amount
    let employee_account = &mut ctx.accounts.employee_account;
 
    let now = Clock::get()?.unix_timestamp;

    if now < employee_account.cliff_time {
        return  Err(CustomErrors::ClaimNotAvailableYet.into());
    }

    let time_since_start = now.saturating_sub(employee_account.start_time);
    let total_vesting_time = employee_account.end_time.saturating_sub(employee_account.start_time);


    if total_vesting_time == 0{
        // this should be in vestin creation maybe
        return Err(CustomErrors::InvalidVestingPeriod.into());
    }

    let vested_amount = if now >= employee_account.end_time {
        employee_account.total_amount
    }else{
        match employee_account.total_amount.checked_mul(time_since_start as u64) {
                Some(res)=> res / total_vesting_time as u64,
                None => return Err(CustomErrors::CalculationOverflow.into())
        }
    };

    let claimable_amount = vested_amount.saturating_sub(employee_account.total_withdrawn);

    if claimable_amount == 0{
        return Err(CustomErrors::NothingToClaim.into());
    }

    // transfer total claimable amount
    let acc = &ctx.accounts;


    let cpi_accounts = TransferChecked { 
        from: acc.treasury_token_account.to_account_info(),
        to: acc.employee_token_account.to_account_info(),
        mint: acc.mint.to_account_info(),
        authority: acc.treasury_token_account.to_account_info(),
    };


    // [b"vesting_treasury", company_name.as_bytes()],
    let signer_seeds: &[&[&[u8]]] = &[
        &[
            b"vesting_treasury",
            acc.vesting_account.company_name.as_bytes(),
            &[acc.vesting_account.treasury_bump],
        ]
    ]; 

    let cpi_context = CpiContext::new_with_signer(
        acc.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds
    );

    transfer_checked(cpi_context, claimable_amount, acc.mint.decimals)?;

    // update total withdrawn 
    ctx.accounts.employee_account.total_withdrawn += claimable_amount;
        
    Ok(())

}
