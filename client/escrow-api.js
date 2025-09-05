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
        this.programId = new solanaWeb3.PublicKey(programId);
        this.network = network;
        this.program = null;
        this.provider = null;
        
        // Platform wallet (hardcoded in program)
        this.platformWallet = new solanaWeb3.PublicKey('CkjSZdXopqgh7jkPFn8MxdU7QKwfYdjQNNwbYABFpCx2');
        
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
            
            // Load the program using local IDL file
            const idlResponse = await fetch('./anchor_escrow.json');
            const idl = await idlResponse.json();
            
            this.program = new anchor.Program(idl, this.provider);
            
            // Alert about IDL file management
            console.warn('⚠️ IMPORTANT: Keep anchor_escrow.json updated!');
            console.warn('   - Update after program changes: cp target/idl/anchor_escrow.json client/anchor_escrow.json');
            console.warn('   - Outdated IDL may cause transaction failures');
            
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
            const sellerAta = splToken.getAssociatedTokenAddressSync(tokenMint, sellerWallet.publicKey);
            const buyerAta = splToken.getAssociatedTokenAddressSync(tokenMint, buyerWallet);
            const platformAta = splToken.getAssociatedTokenAddressSync(tokenMint, this.platformWallet);
            
            // Derive escrow account
            const escrow = solanaWeb3.PublicKey.findProgramAddressSync(
                [Buffer.from("state"), new anchor.BN(seed).toArrayLike(Buffer, "le", 8)],
                this.programId
            )[0];
            
            // Derive vault account
            const vault = splToken.getAssociatedTokenAddressSync(tokenMint, escrow, true);
            
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
                associatedTokenprogram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: solanaWeb3.SystemProgram.programId,
            };
            
            // Execute initialize instruction
            const signature = await this.program.methods
                .initialize(
                    new anchor.BN(seed),
                    new anchor.BN(amount),
                    new anchor.BN(0) // takerAmount = 0 for one-sided escrow
                )
                .accounts(accounts)
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
            console.log('📊 Account details:');
            console.log('  - taker (buyer):', buyerWallet.publicKey.toString());
            console.log('  - escrow:', escrow.toString());
            console.log('  - mintA:', tokenMint.toString());
            
            // Prepare accounts
            const accounts = {
                taker: buyerWallet.publicKey,
                escrow: escrow,
                mintA: tokenMint,
            };
            
            // Verify escrow account exists and is owned by our program
            const escrowAccountInfo = await this.connection.getAccountInfo(escrow);
            if (!escrowAccountInfo) {
                throw new Error('Escrow account not found. Please check the escrow address.');
            }
            
            if (escrowAccountInfo.owner.toString() !== this.program.programId.toString()) {
                throw new Error(`Escrow account is owned by wrong program. Expected: ${this.program.programId.toString()}, Got: ${escrowAccountInfo.owner.toString()}`);
            }
            
            console.log('✅ Escrow account verified');
            
            // Execute confirm payment instruction
            const signature = await this.program.methods
                .confirmPayment()
                .accounts(accounts)
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
            
            // Check escrow state first
            const escrowData = await this.getEscrowData(escrow);
            console.log('📊 Escrow state:', escrowData);
            
            if (!escrowData.paymentConfirmed) {
                throw new Error('Payment not confirmed yet. Buyer must confirm payment before releasing tokens.');
            }
            
            // Get associated token accounts
            const sellerAta = splToken.getAssociatedTokenAddressSync(tokenMint, sellerWallet.publicKey);
            const buyerAta = splToken.getAssociatedTokenAddressSync(tokenMint, buyerWallet);
            const platformAta = splToken.getAssociatedTokenAddressSync(tokenMint, this.platformWallet);
            
            // Derive vault account
            const vault = splToken.getAssociatedTokenAddressSync(tokenMint, escrow, true);
            
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
                associatedTokenprogram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: solanaWeb3.SystemProgram.programId,
            };
            
            // Execute exchange instruction
            const signature = await this.program.methods
                .exchange()
                .accounts(accounts)
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
            const sellerAta = splToken.getAssociatedTokenAddressSync(tokenMint, sellerWallet.publicKey);
            const platformAta = splToken.getAssociatedTokenAddressSync(tokenMint, this.platformWallet);
            
            // Derive vault account
            const vault = splToken.getAssociatedTokenAddressSync(tokenMint, escrow, true);
            
            // Prepare accounts
            const accounts = {
                initializer: sellerWallet.publicKey,
                mintA: tokenMint,
                initializerAtaA: sellerAta,
                platformAtaA: platformAta,
                escrow: escrow,
                vault: vault,
                platformWallet: this.platformWallet,
                associatedTokenprogram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: solanaWeb3.SystemProgram.programId,
            };
            
            // Execute cancel instruction
            const signature = await this.program.methods
                .cancel()
                .accounts(accounts)
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
     * Derive escrow address from seed
     * 
     * @param {number} seed - Escrow seed
     * @returns {PublicKey} Escrow account address
     */
    deriveEscrowAddress(seed) {
        const [escrowAddress] = solanaWeb3.PublicKey.findProgramAddressSync(
            [Buffer.from("state"), Buffer.from(seed.toString().padStart(8, '0').slice(-8), 'hex')],
            this.program.programId
        );
        return escrowAddress;
    }

    /**
     * Check if escrow can be released
     * 
     * @param {PublicKey} escrow - Escrow account address
     * @returns {Promise<Object>} Escrow status and details
     */
    async canReleaseEscrow(escrow) {
        try {
            const escrowData = await this.getEscrowData(escrow);
            return {
                canRelease: escrowData.paymentConfirmed,
                escrowData: escrowData,
                message: escrowData.paymentConfirmed 
                    ? 'Ready to release - payment confirmed' 
                    : 'Cannot release - payment not confirmed yet'
            };
        } catch (error) {
            console.error('Failed to check escrow status:', error);
            return {
                canRelease: false,
                escrowData: null,
                message: 'Failed to load escrow data'
            };
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
            const ata = splToken.getAssociatedTokenAddressSync(tokenMint, wallet);
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

    /**
     * Format token amount for display
     * 
     * @param {number} amount - Amount in smallest unit
     * @param {number} decimals - Token decimals (default: 6)
     * @returns {string} Formatted amount
     */
    formatTokenAmount(amount, decimals = 6) {
        return (amount / Math.pow(10, decimals)).toFixed(decimals);
    }

    /**
     * Parse token amount from user input
     * 
     * @param {string} input - User input string
     * @param {number} decimals - Token decimals (default: 6)
     * @returns {number} Amount in smallest unit
     */
    parseTokenAmount(input, decimals = 6) {
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount');
        }
        return Math.floor(amount * Math.pow(10, decimals));
    }

    /**
     * Generate random seed for escrow
     * 
     * @returns {number} Random seed
     */
    generateSeed() {
        return Math.floor(Math.random() * 0xFFFFFFFF);
    }

    /**
     * Show loading state on button
     * 
     * @param {HTMLElement} button - Button element
     * @param {string} text - Loading text
     */
    showLoading(button, text = 'Loading...') {
        button.disabled = true;
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${text}
        `;
    }

    /**
     * Hide loading state on button
     * 
     * @param {HTMLElement} button - Button element
     * @param {string} text - Original text
     */
    hideLoading(button, text) {
        button.disabled = false;
        button.innerHTML = text;
    }

    /**
     * Show success message
     * 
     * @param {string} message - Success message
     * @param {string} explorerUrl - Optional explorer URL
     */
    showSuccess(message, explorerUrl = null) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>${message}</span>
                ${explorerUrl ? `<a href="${explorerUrl}" target="_blank" class="ml-2 text-blue-600 hover:text-blue-800 underline">View Transaction</a>` : ''}
            </div>
        `;
        document.getElementById('alerts').appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 10000);
    }

    /**
     * Show error message
     * 
     * @param {string} message - Error message
     */
    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;
        document.getElementById('alerts').appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 10000);
    }

    /**
     * Clear all alerts
     */
    clearAlerts() {
        const alerts = document.getElementById('alerts');
        if (alerts) {
            alerts.innerHTML = '';
        }
    }

    /**
     * Get wallet from Phantom
     * 
     * @returns {Promise<Object>} Wallet object with publicKey and signTransaction
     */
    async getWallet() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not found. Please install Phantom wallet.');
        }
        
        const response = await window.solana.connect();
        return {
            publicKey: response.publicKey,
            signTransaction: window.solana.signTransaction,
            signAllTransactions: window.solana.signAllTransactions
        };
    }

    /**
     * Create a simple keypair for testing (DO NOT USE IN PRODUCTION)
     * 
     * @returns {Keypair} Generated keypair
     */
    createTestKeypair() {
        return solanaWeb3.Keypair.generate();
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
const connection = new solanaWeb3.Connection('https://api.devnet.solana.com', 'confirmed');
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
