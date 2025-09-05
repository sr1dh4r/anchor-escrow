/**
 * Solana Escrow API - Vanilla JavaScript Client
 * 
 * This file provides JavaScript APIs for interacting with the Solana escrow program.
 * It implements the one-sided escrow pattern for USDT-INR trading with off-chain payments.
 * 
 * Program ID: Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW
 * Network: Devnet (configurable)
 */

// Dependencies - These need to be loaded before this script
// @solana/web3.js
// @coral-xyz/anchor
// @solana/spl-token

class EscrowAPI {
    constructor(connection, programId, network = 'devnet') {
        this.connection = connection;
        this.programId = new PublicKey(programId);
        this.network = network;
        this.program = null;
        this.provider = null;
        
        // Platform wallet (hardcoded in program)
        this.platformWallet = new PublicKey('CkjSZdXopqgh7jkPFn8MxdU7QKwfYdjQNNwbYABFpCx2');
        
        // Initialize Anchor program
        this.initializeProgram();
    }

    /**
     * Initialize the Anchor program
     */
    async initializeProgram() {
        try {
            // Set up Anchor provider
            this.provider = new anchor.AnchorProvider(
                this.connection,
                window.solana, // Phantom wallet adapter
                { commitment: 'confirmed' }
            );
            anchor.setProvider(this.provider);
            
            // Load the program
            const idl = await anchor.Program.fetchIdl(this.programId, this.provider);
            this.program = new anchor.Program(idl, this.programId, this.provider);
            
            console.log('✅ Escrow API initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Escrow API:', error);
            throw error;
        }
    }

    /**
     * Create a new escrow (Initialize)
     * 
     * @param {Keypair} sellerWallet - Seller's wallet keypair
     * @param {PublicKey} buyerWallet - Buyer's wallet public key
     * @param {PublicKey} tokenMint - Token mint address (e.g., USDT)
     * @param {number} amount - Amount of tokens to escrow (in smallest unit)
     * @param {number} seed - Random seed for escrow account
     * @returns {Promise<Object>} Transaction result with escrow details
     */
    async escrowCreate(sellerWallet, buyerWallet, tokenMint, amount, seed = null) {
        try {
            console.log('🎯 Creating escrow...');
            
            // Generate random seed if not provided
            if (!seed) {
                seed = Math.floor(Math.random() * 0xFFFFFFFF);
            }
            
            // Get associated token accounts
            const sellerAta = getAssociatedTokenAddressSync(tokenMint, sellerWallet.publicKey);
            const buyerAta = getAssociatedTokenAddressSync(tokenMint, buyerWallet);
            const platformAta = getAssociatedTokenAddressSync(tokenMint, this.platformWallet);
            
            // Derive escrow account
            const escrow = PublicKey.findProgramAddressSync(
                [Buffer.from("state"), new anchor.BN(seed).toArrayLike(Buffer, "le", 8)],
                this.programId
            )[0];
            
            // Derive vault account
            const vault = getAssociatedTokenAddressSync(tokenMint, escrow, true);
            
            // Prepare accounts
            const accounts = {
                initializer: sellerWallet.publicKey,
                taker: buyerWallet,
                mintA: tokenMint,
                mintB: tokenMint, // Same mint for one-sided escrow
                initializerAtaA: sellerAta,
                initializerAtaB: sellerAta, // Same ATA for one-sided escrow
                takerAtaA: buyerAta,
                takerAtaB: buyerAta, // Same ATA for one-sided escrow
                platformAtaA: platformAta,
                escrow: escrow,
                vault: vault,
                platformWallet: this.platformWallet,
                associatedTokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };
            
            // Execute initialize instruction
            const signature = await this.program.methods
                .initialize(
                    new anchor.BN(seed),
                    new anchor.BN(amount),
                    new anchor.BN(0) // takerAmount = 0 for one-sided escrow
                )
                .accounts(accounts)
                .signers([sellerWallet])
                .rpc();
            
            // Confirm transaction
            await this.connection.confirmTransaction(signature);
            
            const result = {
                success: true,
                signature: signature,
                escrow: escrow.toString(),
                vault: vault.toString(),
                seed: seed,
                amount: amount,
                explorerUrl: `https://explorer.solana.com/transaction/${signature}?cluster=${this.network}`
            };
            
            console.log('✅ Escrow created successfully:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to create escrow:', error);
            throw error;
        }
    }

    /**
     * Confirm off-chain payment (Confirm Payment)
     * 
     * @param {Keypair} buyerWallet - Buyer's wallet keypair
     * @param {PublicKey} escrow - Escrow account address
     * @param {PublicKey} tokenMint - Token mint address
     * @returns {Promise<Object>} Transaction result
     */
    async escrowConfirmPayment(buyerWallet, escrow, tokenMint) {
        try {
            console.log('💳 Confirming off-chain payment...');
            
            // Prepare accounts
            const accounts = {
                taker: buyerWallet.publicKey,
                escrow: escrow,
                mintA: tokenMint,
            };
            
            // Execute confirm payment instruction
            const signature = await this.program.methods
                .confirmPayment()
                .accounts(accounts)
                .signers([buyerWallet])
                .rpc();
            
            // Confirm transaction
            await this.connection.confirmTransaction(signature);
            
            const result = {
                success: true,
                signature: signature,
                explorerUrl: `https://explorer.solana.com/transaction/${signature}?cluster=${this.network}`
            };
            
            console.log('✅ Payment confirmed successfully:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to confirm payment:', error);
            throw error;
        }
    }

    /**
     * Release tokens to buyer (Exchange)
     * 
     * @param {Keypair} sellerWallet - Seller's wallet keypair
     * @param {PublicKey} buyerWallet - Buyer's wallet public key
     * @param {PublicKey} tokenMint - Token mint address
     * @param {PublicKey} escrow - Escrow account address
     * @returns {Promise<Object>} Transaction result
     */
    async escrowRelease(sellerWallet, buyerWallet, tokenMint, escrow) {
        try {
            console.log('🔄 Releasing tokens to buyer...');
            
            // Get associated token accounts
            const sellerAta = getAssociatedTokenAddressSync(tokenMint, sellerWallet.publicKey);
            const buyerAta = getAssociatedTokenAddressSync(tokenMint, buyerWallet);
            const platformAta = getAssociatedTokenAddressSync(tokenMint, this.platformWallet);
            
            // Derive vault account
            const vault = getAssociatedTokenAddressSync(tokenMint, escrow, true);
            
            // Prepare accounts
            const accounts = {
                initializer: sellerWallet.publicKey,
                taker: buyerWallet,
                mintA: tokenMint,
                mintB: tokenMint, // Same mint for one-sided escrow
                initializerAtaA: sellerAta,
                initializerAtaB: sellerAta, // Same ATA for one-sided escrow
                takerAtaA: buyerAta,
                takerAtaB: buyerAta, // Same ATA for one-sided escrow
                platformAtaA: platformAta,
                escrow: escrow,
                vault: vault,
                platformWallet: this.platformWallet,
                associatedTokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };
            
            // Execute exchange instruction
            const signature = await this.program.methods
                .exchange()
                .accounts(accounts)
                .signers([sellerWallet])
                .rpc();
            
            // Confirm transaction
            await this.connection.confirmTransaction(signature);
            
            const result = {
                success: true,
                signature: signature,
                explorerUrl: `https://explorer.solana.com/transaction/${signature}?cluster=${this.network}`
            };
            
            console.log('✅ Tokens released successfully:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to release tokens:', error);
            throw error;
        }
    }

    /**
     * Cancel escrow (Cancel)
     * 
     * @param {Keypair} sellerWallet - Seller's wallet keypair
     * @param {PublicKey} tokenMint - Token mint address
     * @param {PublicKey} escrow - Escrow account address
     * @returns {Promise<Object>} Transaction result
     */
    async escrowCancel(sellerWallet, tokenMint, escrow) {
        try {
            console.log('❌ Cancelling escrow...');
            
            // Get associated token accounts
            const sellerAta = getAssociatedTokenAddressSync(tokenMint, sellerWallet.publicKey);
            const platformAta = getAssociatedTokenAddressSync(tokenMint, this.platformWallet);
            
            // Derive vault account
            const vault = getAssociatedTokenAddressSync(tokenMint, escrow, true);
            
            // Prepare accounts
            const accounts = {
                initializer: sellerWallet.publicKey,
                mintA: tokenMint,
                initializerAtaA: sellerAta,
                platformAtaA: platformAta,
                escrow: escrow,
                vault: vault,
                platformWallet: this.platformWallet,
                associatedTokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            };
            
            // Execute cancel instruction
            const signature = await this.program.methods
                .cancel()
                .accounts(accounts)
                .signers([sellerWallet])
                .rpc();
            
            // Confirm transaction
            await this.connection.confirmTransaction(signature);
            
            const result = {
                success: true,
                signature: signature,
                explorerUrl: `https://explorer.solana.com/transaction/${signature}?cluster=${this.network}`
            };
            
            console.log('✅ Escrow cancelled successfully:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Failed to cancel escrow:', error);
            throw error;
        }
    }

    /**
     * Get escrow account data
     * 
     * @param {PublicKey} escrow - Escrow account address
     * @returns {Promise<Object>} Escrow account data
     */
    async getEscrowData(escrow) {
        try {
            const accountData = await this.program.account.escrow.fetch(escrow);
            
            return {
                seed: accountData.seed.toString(),
                bump: accountData.bump,
                initializer: accountData.initializer.toString(),
                mintA: accountData.mintA.toString(),
                mintB: accountData.mintB.toString(),
                initializerAmount: accountData.initializerAmount.toString(),
                takerAmount: accountData.takerAmount.toString(),
                paymentConfirmed: accountData.paymentConfirmed
            };
        } catch (error) {
            console.error('❌ Failed to fetch escrow data:', error);
            throw error;
        }
    }

    /**
     * Get token balance for a wallet
     * 
     * @param {PublicKey} wallet - Wallet public key
     * @param {PublicKey} tokenMint - Token mint address
     * @returns {Promise<number>} Token balance
     */
    async getTokenBalance(wallet, tokenMint) {
        try {
            const ata = getAssociatedTokenAddressSync(tokenMint, wallet);
            const balance = await this.connection.getTokenAccountBalance(ata);
            return parseInt(balance.value.amount);
        } catch (error) {
            console.error('❌ Failed to get token balance:', error);
            return 0;
        }
    }

    /**
     * Get SOL balance for a wallet
     * 
     * @param {PublicKey} wallet - Wallet public key
     * @returns {Promise<number>} SOL balance in lamports
     */
    async getSolBalance(wallet) {
        try {
            const balance = await this.connection.getBalance(wallet);
            return balance;
        } catch (error) {
            console.error('❌ Failed to get SOL balance:', error);
            return 0;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EscrowAPI;
} else if (typeof window !== 'undefined') {
    window.EscrowAPI = EscrowAPI;
}

// Example usage (commented out)
/*
// Initialize the API
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const escrowAPI = new EscrowAPI(connection, 'Bua4jWEfUYb3QcaWnfJEbG4KKv6C1SqJSGFr5KCntZDW');

// Example workflow:
// 1. Create escrow
const createResult = await escrowAPI.escrowCreate(
    sellerWallet, 
    buyerWallet, 
    tokenMint, 
    100000 // 0.1 USDT
);

// 2. Confirm payment (buyer)
const confirmResult = await escrowAPI.escrowConfirmPayment(
    buyerWallet, 
    createResult.escrow, 
    tokenMint
);

// 3. Release tokens (seller)
const releaseResult = await escrowAPI.escrowRelease(
    sellerWallet, 
    buyerWallet, 
    tokenMint, 
    createResult.escrow
);
*/
