import * as anchor from "@coral-xyz/anchor";
import { AnchorEscrow } from "../target/types/anchor_escrow";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { randomBytes } from "crypto";

describe("real-escrow-test", () => {
  // 0. Set provider, connection and program
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const program = anchor.workspace.AnchorEscrow as anchor.Program<AnchorEscrow>;

  // 1. Use real wallets from config
  const initializer = Keypair.fromSecretKey(new Uint8Array([
    195,182,92,154,227,12,22,211,41,164,15,62,240,161,178,89,41,219,106,247,71,45,172,255,132,74,69,208,4,153,61,27,107,132,243,96,152,160,150,155,14,221,156,205,69,220,81,171,193,126,31,204,62,51,83,27,21,202,208,29,47,200,134,242
  ]));
  const taker = Keypair.fromSecretKey(new Uint8Array([
    223,166,19,26,23,57,196,105,222,202,209,251,202,246,62,48,134,15,228,82,168,249,190,160,245,169,245,60,76,136,95,244,186,162,92,48,122,55,188,182,162,171,246,193,111,90,158,168,176,58,123,1,169,101,9,244,170,155,116,124,140,214,201,82
  ]));
  
  // Real token mints
  const mintA = new PublicKey("J1UjsVLRwGcpoCjexjDaHWVoj9F3TbdCpwVYNUYkww6y");
  const mintB = new PublicKey("5HNMvuKR4feePQ68UQMGt6XGhdbo18MuFG1XaYritJHT");
  
  // Real token accounts
  const initializerAtaA = new PublicKey("G18KD2UqM8Er98EY89ESfB1yvmepVmMfVSmkWfTw1Gf8");
  const initializerAtaB = new PublicKey("AuxLmhwCSKJTpqvAqLm5489qiYeSR23C8Sbw7FoiMKjo");
  const takerAtaA = new PublicKey("FxNgzWmhFsBf4HiRkMHH9kEDqecWBFgE3Cgr7GmMShAs");
  const takerAtaB = new PublicKey("EwBqUHScQmTPaLv4h67yNTpXbgjqpQRHYSe3hwPLW7qn");
  
  // Platform wallet (hardcoded in program - derived automatically)
  const platformWallet = new PublicKey("CkjSZdXopqgh7jkPFn8MxdU7QKwfYdjQNNwbYABFpCx2");
  const platformAtaA = getAssociatedTokenAddressSync(mintA, platformWallet);
  

  // Determined Escrow and Vault addresses
  const seed = new anchor.BN(randomBytes(8));
  const escrow = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), seed.toArrayLike(Buffer, "le", 8)],
    program.programId
  )[0];
  const vault = getAssociatedTokenAddressSync(mintA, escrow, true);

  // Account Wrapper
  const accounts = {
    initializer: initializer.publicKey,
    taker: taker.publicKey,
    mintA: mintA,
    mintB: mintB,
    initializerAtaA: initializerAtaA,
    initializerAtaB: initializerAtaB,
    takerAtaA,
    takerAtaB,
    platformAtaA,
    escrow,
    vault,
    platformWallet,
    associatedTokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  };

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=devnet`
    );
    return signature;
  };

  it("Initialize one-sided escrow", async () => {
    console.log("🎯 Initializing one-sided escrow...");
    console.log("Initializer (Seller):", initializer.publicKey.toString());
    console.log("Taker (Buyer):", taker.publicKey.toString());
    console.log("Token A:", mintA.toString());
    console.log("Token B:", mintB.toString());
    
    const initializerAmount = 100000;  // 0.1 Token A (USDT)
    const takerAmount = 0;             // 0 Token B (no Token B needed)
    
    await program.methods
      .initialize(seed, new anchor.BN(initializerAmount), new anchor.BN(takerAmount))
      .accounts({ ...accounts })
      .signers([initializer])
      .rpc()
      .then(confirm)
      .then(log);
      
    console.log("✅ One-sided escrow initialized successfully!");
  });

  it("Confirm off-chain payment", async () => {
    console.log("💳 Confirming off-chain payment...");
    
    await program.methods
      .confirmPayment()
      .accounts({
        taker: taker.publicKey,
        escrow,
        mintA: mintA,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log);

    console.log("✅ Payment confirmed successfully!");
  });

  it("Release tokens to buyer", async () => {
    console.log("🔄 Releasing tokens to buyer...");
    
    await program.methods
      .exchange()
      .accounts({ ...accounts })
      .signers([initializer])  // Only seller signs
      .rpc()
      .then(confirm)
      .then(log);

    console.log("✅ Tokens released successfully!");
  });
});
