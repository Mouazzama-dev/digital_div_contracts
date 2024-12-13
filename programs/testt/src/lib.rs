use anchor_lang::prelude::*;

// Declare the program ID
// Update the declare_id macro with your program ID
declare_id!("EcqYb1rcEm63cEZVykR3TuEv18Bpt9LnBvfE1Xdpri24");

#[program]
pub mod testt {
    use anchor_lang::system_program;

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
        

        msg!("Transaction processed. Fee collected: {}", fee);
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
    pub system_program: Program<'info, System>,
}

// PDA Structures
#[account]
pub struct FeePda {
    pub balance: u64, // Total collected fees
}

#[error_code]
pub enum CustomError {
    #[msg("Insufficient funds for transaction.")]
    InsufficientFunds,
}
