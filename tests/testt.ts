import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Testt } from "../target/types/testt";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, createMint, createAccount, mintTo, transfer, MintLayout } from "@solana/spl-token";


describe("cintract_testing", () => {
  // Configure the client to use the devnet cluster.
  const connection = new anchor.web3.Connection(
    anchor.web3.clusterApiUrl("devnet"),
    "confirmed"
  );
  const provider = anchor.AnchorProvider.local("https://api.devnet.solana.com");
  anchor.setProvider(provider);
  const wallet = provider.wallet;


  const program = anchor.workspace.Testt as Program<Testt>;
  let feePda: PublicKey;
  let feePdaBump: number;
  let sender: Keypair;

  // Hardcoded values
  const mint = new PublicKey("mnt29LjVewYdA5qgvgkVhMm4MNhZhQeTesYdUnfV7RH");
  const mintTokenAccount = new PublicKey("DNwLxSDrum8sixpi4Y13xNDpEKTZS3GPhCedaesUyrzP");
  const userTokenAccount = new PublicKey("WFx3sB6W8wuQHdvbmn7vN4utGMxWXiFCajDXHiMvBhV");
  const authorityPrivateKey = new Uint8Array([104, 100, 79, 213, 109, 206, 175, 202, 155, 59, 175, 26, 155, 163, 121, 89, 186, 179, 234, 27, 136, 61, 24, 93, 194, 187, 10, 222, 236, 71, 44, 234, 9, 98, 12, 196, 212, 190, 158, 29, 130, 7, 135, 60, 74, 148, 79, 194, 52, 106, 211, 124, 54, 73, 227, 162, 198, 92, 2, 54, 167, 202, 95, 109]);
  const authority = Keypair.fromSecretKey(authorityPrivateKey);


  before(async () => {
    sender = anchor.web3.Keypair.generate();

    // Derive the Fee PDA
    [feePda, feePdaBump] = await PublicKey.findProgramAddress(
      [Buffer.from("fee_pda")],
      program.programId
    );

  });

  it("should initialize feePda only if not already initialized", async () => {
    // Check if the feePda already has a balance or if any specific data exists
    const preInitializationAccountInfo = await provider.connection.getAccountInfo(feePda);
  
    if (preInitializationAccountInfo === null) {
      console.log("feePda does not exist, initializing...");
  
      try {
        await program.methods.initialize()
        .accounts({
          feePda,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([provider.wallet.payer])
        .rpc();

        // Check the post-initialization state or balance to confirm success
        const postInitializationAccountInfo = await provider.connection.getAccountInfo(feePda);
        if (postInitializationAccountInfo !== null) {
          console.log("feePda initialized successfully.");
        } else {
          console.error("Failed to initialize feePda.");
        }
      } catch (error) {
        console.error("Initialization Error:", error);
      }
    } else {
      console.log("feePda already exists, no need to initialize.");
    }
  });
  

  it("should handle transactions correctly", async () => {
    const amount = new anchor.BN(5000000000); // 5000 tokens assuming 9 decimal places

    // Log information to verify correctness
    console.log(`Authority Public Key: ${authority.publicKey}`);
    console.log(`Token Program ID: ${TOKEN_2022_PROGRAM_ID.toString()}`);
    const beforeBalance = await provider.connection.getTokenAccountBalance(userTokenAccount);
    console.log(`Balance before claim: ${beforeBalance.value.uiAmount}`);
    console.log(mintTokenAccount)
    console.log(`fee pda: ${feePda}`)


    try {
      await program.rpc.handleTransaction(amount, {
        accounts: {
          feePda,
          associatedTokenAccount: mintTokenAccount,
          userTokenAccount, // Make sure this is correct or set to a valid recipient token account
          mint,
          authority: authority.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
        signers: [authority],
      });
    } catch (error) {
      console.error("Transaction Error:", error);
    }
  });

});
