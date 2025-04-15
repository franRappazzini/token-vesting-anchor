#![allow(clippy::result_large_err)]
pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

use anchor_lang::prelude::*;

pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use states::*;

declare_id!("Fmcb3arTrfLuJnzfLA6JeHhX93DKe63CuLBQMLcQnvDq");

#[program]
pub mod tokenvesting {
    use super::*;

    pub fn create_vesting_account(
        ctx: Context<CreateVestingAccount>,
        company_name: String,
    ) -> Result<()> {
        create_vesting_account::create_vesting(ctx, company_name)
    }

    pub fn create_employee_account(
        ctx: Context<CreateEmployeeAccount>,
        // beneficiary: Pubkey,
        start_time: i64,
        end_time: i64,
        cliff_time: i64,
        total_amount: u64,
    ) -> Result<()> {
        create_employee_account::create_employee(
            ctx,
            start_time,
            end_time,
            cliff_time,
            total_amount,
        )
    }

    pub fn claim_tokens_vesting(ctx: Context<ClaimTokens>, company_name: String) -> Result<()> {
        claim_tokens::claim_tokens(ctx, company_name)
    }
}
