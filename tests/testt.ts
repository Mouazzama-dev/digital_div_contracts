import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testt } from "../target/types/testt";
import { PublicKey, SystemProgram, Keypair, Transaction, sendAndConfirmTransaction, clusterApiUrl, Connection } from "@solana/web3.js";
import bs58 from 'bs58';
import { TOKEN_PROGRAM_ID, MintLayout, createInitializeMintInstruction, getOrCreateAssociatedTokenAccount, createAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

describe("testt", () => {
  // Configure the client to use the devnet cluster.
  const connection = new Connection(clusterApiUrl("devnet"), "processed");
  const wallet = new anchor.Wallet(Keypair.generate());
  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment: "processed",
  });
  anchor.setProvider(provider);

  const program = anchor.workspace.Testt as Program<Testt>;
  const user = provider.wallet.publicKey;
  let feePda, feePdaBump;

  before(async () => {
    // Derive PDAs
    [feePda, feePdaBump] = await PublicKey.findProgramAddress(
      [Buffer.from("fee_pda")],
      program.programId
    );

    // Initialize the fee PDA
    await program.methods.initialize()
      .accounts({
        feePda,
        user,
        systemProgram: SystemProgram.programId,
      })
      .signers([provider.wallet.payer])
      .rpc();
  });
});
