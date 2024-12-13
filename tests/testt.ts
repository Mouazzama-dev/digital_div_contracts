import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testt } from "../target/types/testt";

describe("testt", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Testt as Program<Testt>;
  const provider = anchor.AnchorProvider.env();
  const user = provider.wallet.publicKey;

  let feePda, feePdaBump;

  before(async () => {
    // Derive PDAs
    [feePda, feePdaBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("fee_pda")],
      program.programId
    );

    // Initialize the fee PDA
    await program.methods.initialize()
      .accounts({
        feePda,
        user,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([provider.wallet.payer])
      .rpc();
  });

  it("Handles transactions and updates Fee PDA balance", async () => {
    // Setup a sender account
    const sender = anchor.web3.Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      sender.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL // Airdrop some SOL to the sender
    );
    await provider.connection.confirmTransaction(airdropSignature);

    // Handle a transaction of 100 LAMPORTS
    const tx = await program.methods.handleTransaction(new anchor.BN(100))
      .accounts({
        sender: sender.publicKey,
        feePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sender]) // The sender must sign the transaction
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch and verify Fee PDA account's balance
    const feePdaAccount = await program.account.feePda.fetch(feePda);
    console.log("Updated Fee PDA balance:", feePdaAccount.balance.toNumber());

    // Assertions
    // expect(feePdaAccount.balance.toNumber()).toBe(1); // Check if 1% of 100 LAMPORTS is added to the balance
  });

});
