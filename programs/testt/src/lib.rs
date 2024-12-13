use anchor_lang::prelude::*;
use anchor_spl::token_interface:: *;


// Declare the program ID
// Update the declare_id macro with your program ID
declare_id!("EcqYb1rcEm63cEZVykR3TuEv18Bpt9LnBvfE1Xdpri24");

#[program]
pub mod testt {
    use anchor_lang::system_program;
    use anchor_spl::token_interface;


    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);

        // Initialize Fee PDA
        let fee_pda = &mut ctx.accounts.fee_pda;
        fee_pda.balance = 0;

        msg!("PDAs initialized successfully!");
        Ok(())
    }

    pub fn handle_transaction(ctx: Context<HandleTransaction>, amount: u64) -> Result<()> {
        msg!("Handling transaction of amount: {}", amount);
    
        // Calculate 1% fee
        let fee = amount / 100;
    
        // Transfer 1% fee to Fee PDA
        let fee_transfer_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sender.to_account_info().clone(),
                to: ctx.accounts.fee_pda.to_account_info().clone(),
            },
        );
        system_program::transfer(fee_transfer_context, fee)?;
        // Update the balance of the Fee PDA account
        let fee_pda = &mut ctx.accounts.fee_pda;
        fee_pda.balance += fee;

        // Transfer tokens from the associated token account to the user's token account
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.associated_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        token_interface::transfer_checked(cpi_context, amount, ctx.accounts.mint.decimals)?;

        

        msg!("Transaction processed. Fee collected: {}", fee);
        Ok(())
    }

        // Method to take a snapshot of user balances
        pub fn snapshot_balance(ctx: Context<SnapshotBalance>, balance: u64) -> Result<()> {
            let user_snapshot = &mut ctx.accounts.user_snapshot;
            user_snapshot.balances.push(balance);
            msg!("Snapshot taken: {}", balance);
            Ok(())
        }
    
        // Method to distribute rewards
        pub fn distribute_rewards(ctx: Context<DistributeRewards>) -> Result<()> {
            let snapshot = &ctx.accounts.user_snapshot;
            let total_balance: u64 = snapshot.balances.iter().sum();
            let total_rewards = 10000; // Example total rewards
            let reward_per_unit = total_rewards / total_balance;
    
            let user_reward = snapshot.balances.last().unwrap_or(&0) * reward_per_unit;
            msg!("Reward distributed: {}", user_reward);
    
            // Logic for transferring rewards (not implemented)
            Ok(())
        }
    
    }

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [b"fee_pda"],
        bump,
        payer = user,
        space = 8 + 8 // Space for balance (u64)
    )]
    pub fee_pda: Account<'info, FeePda>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct HandleTransaction<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(
        mut,
        seeds = [b"fee_pda"],
        bump
    )]
    pub fee_pda: Account<'info, FeePda>,
    pub associated_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_program: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SnapshotBalance<'info> {
    #[account(
        init,
        seeds = [b"user", user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 32 + (100 * 8) // Owner + Vec<u64> for balances
    )]
    pub user_snapshot: Account<'info, UserSnapshot>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_snapshot: Account<'info, UserSnapshot>,
    pub user: Signer<'info>,

    // Include accounts for token transfer
}

#[account]
pub struct UserSnapshot {
    pub owner: Pubkey,
    pub balances: Vec<u64>,
}

#[account]
pub struct FeePda {
    pub balance: u64,
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient funds for transaction.")]
    InsufficientFunds,
}
