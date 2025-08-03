// USDT-INR Escrow Program Operations
// Vanilla JavaScript implementation for interacting with the deployed escrow program

// Program configuration
const PROGRAM_ID = "3MS2fGZYpUG8BdTg1s1RzBbJyQe18foqAx9Y1AbBcAdW";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const NETWORK_URL = "https://api.devnet.solana.com";

// SPL Token Program IDs
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

// System Program ID
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

// Instruction discriminators (first 8 bytes of instruction data)
const INSTRUCTIONS = {
    INITIALIZE: [175, 175, 109, 31, 13, 78, 99, 171], // Example discriminator
    CONFIRM_PAYMENT: [34, 12, 45, 67, 89, 12, 34, 56], // Example discriminator
    RELEASE_USDT: [78, 90, 12, 34, 56, 78, 90, 12], // Example discriminator
    CANCEL: [12, 34, 56, 78, 90, 12, 34, 56] // Example discriminator
};

// Utility functions
function createPublicKey(address) {
    return new solanaWeb3.PublicKey(address);
}

function createKeypair() {
    return solanaWeb3.Keypair.generate();
}

function createConnection() {
    return new solanaWeb3.Connection(NETWORK_URL, 'confirmed');
}

// Get Associated Token Account address
async function getAssociatedTokenAddress(mint, owner) {
    const [address] = await solanaWeb3.PublicKey.findProgramAddress(
        [
            owner.toBuffer(),
            createPublicKey(TOKEN_PROGRAM_ID).toBuffer(),
            mint.toBuffer(),
        ],
        createPublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
    );
    return address;
}

// Get Program Derived Address (PDA)
function getEscrowPDA(seed) {
    const [pda] = solanaWeb3.PublicKey.findProgramAddress(
        [Buffer.from("state"), new Uint8Array(new Uint32Array([seed]).buffer)],
        createPublicKey(PROGRAM_ID)
    );
    return pda;
}

function getVaultPDA(escrowPDA) {
    const [pda] = solanaWeb3.PublicKey.findProgramAddress(
        [escrowPDA.toBuffer(), createPublicKey(TOKEN_PROGRAM_ID).toBuffer()],
        createPublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
    );
    return pda;
}

// Convert number to BN (Big Number)
function toBN(number) {
    return new solanaWeb3.BN(number);
}

// Serialize instruction data
function serializeInstructionData(instruction, ...args) {
    const buffer = Buffer.alloc(8 + args.length * 8); // 8 bytes for discriminator + args
    
    // Add instruction discriminator
    buffer.set(INSTRUCTIONS[instruction], 0);
    
    // Add arguments (assuming all are u64)
    let offset = 8;
    args.forEach(arg => {
        const bn = toBN(arg);
        const bytes = bn.toArray('le', 8);
        buffer.set(bytes, offset);
        offset += 8;
    });
    
    return buffer;
}

// Create and send transaction
async function sendTransaction(connection, transaction, signers) {
    try {
        const signature = await connection.sendTransaction(transaction, signers);
        console.log(`Transaction sent: ${signature}`);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log(`Transaction confirmed: ${confirmation.value.err ? 'Failed' : 'Success'}`);
        
        return signature;
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
}

// 1. INITIALIZE ESCROW (USDT Seller creates escrow)
async function initializeEscrow(
    sellerKeypair,
    buyerAddress,
    usdtAmount,
    inrAmount,
    connection
) {
    console.log('🚀 Initializing escrow...');
    
    try {
        const seed = Math.floor(Math.random() * 1000000);
        const buyer = createPublicKey(buyerAddress);
        
        // Generate PDAs
        const escrowPDA = getEscrowPDA(seed);
        const vaultPDA = getVaultPDA(escrowPDA);
        
        // Get token accounts
        const sellerUsdtATA = await getAssociatedTokenAddress(
            createPublicKey(USDT_MINT),
            sellerKeypair.publicKey
        );
        
        const buyerUsdtATA = await getAssociatedTokenAddress(
            createPublicKey(USDT_MINT),
            buyer
        );
        
        // Create transaction
        const transaction = new solanaWeb3.Transaction();
        
        // Add instruction
        const initializeInstruction = new solanaWeb3.TransactionInstruction({
            programId: createPublicKey(PROGRAM_ID),
            keys: [
                { pubkey: sellerKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: buyer, isSigner: false, isWritable: false },
                { pubkey: createPublicKey(USDT_MINT), isSigner: false, isWritable: false },
                { pubkey: sellerUsdtATA, isSigner: false, isWritable: true },
                { pubkey: escrowPDA, isSigner: false, isWritable: true },
                { pubkey: vaultPDA, isSigner: false, isWritable: true },
                { pubkey: createPublicKey(ASSOCIATED_TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
            ],
            data: serializeInstructionData('INITIALIZE', seed, usdtAmount, inrAmount)
        });
        
        transaction.add(initializeInstruction);
        
        // Send transaction
        const signature = await sendTransaction(connection, transaction, [sellerKeypair]);
        
        console.log('✅ Escrow initialized successfully!');
        console.log(`📋 Escrow PDA: ${escrowPDA.toString()}`);
        console.log(`🏦 Vault PDA: ${vaultPDA.toString()}`);
        console.log(`🔢 Seed: ${seed}`);
        
        return {
            signature,
            escrowPDA: escrowPDA.toString(),
            vaultPDA: vaultPDA.toString(),
            seed
        };
        
    } catch (error) {
        console.error('❌ Failed to initialize escrow:', error);
        throw error;
    }
}

// 2. CONFIRM PAYMENT (INR Buyer confirms payment)
async function confirmPayment(
    buyerKeypair,
    escrowPDAAddress,
    connection
) {
    console.log('💰 Confirming payment...');
    
    try {
        const escrowPDA = createPublicKey(escrowPDAAddress);
        
        // Create transaction
        const transaction = new solanaWeb3.Transaction();
        
        // Add instruction
        const confirmInstruction = new solanaWeb3.TransactionInstruction({
            programId: createPublicKey(PROGRAM_ID),
            keys: [
                { pubkey: buyerKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: escrowPDA, isSigner: false, isWritable: true },
            ],
            data: Buffer.from(INSTRUCTIONS.CONFIRM_PAYMENT)
        });
        
        transaction.add(confirmInstruction);
        
        // Send transaction
        const signature = await sendTransaction(connection, transaction, [buyerKeypair]);
        
        console.log('✅ Payment confirmed successfully!');
        
        return { signature };
        
    } catch (error) {
        console.error('❌ Failed to confirm payment:', error);
        throw error;
    }
}

// 3. RELEASE USDT (USDT Seller releases USDT to buyer)
async function releaseUsdt(
    sellerKeypair,
    buyerAddress,
    escrowPDAAddress,
    vaultPDAAddress,
    connection
) {
    console.log('🎁 Releasing USDT to buyer...');
    
    try {
        const buyer = createPublicKey(buyerAddress);
        const escrowPDA = createPublicKey(escrowPDAAddress);
        const vaultPDA = createPublicKey(vaultPDAAddress);
        
        // Get buyer's USDT token account
        const buyerUsdtATA = await getAssociatedTokenAddress(
            createPublicKey(USDT_MINT),
            buyer
        );
        
        // Create transaction
        const transaction = new solanaWeb3.Transaction();
        
        // Add instruction
        const releaseInstruction = new solanaWeb3.TransactionInstruction({
            programId: createPublicKey(PROGRAM_ID),
            keys: [
                { pubkey: sellerKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: buyer, isSigner: false, isWritable: false },
                { pubkey: createPublicKey(USDT_MINT), isSigner: false, isWritable: false },
                { pubkey: buyerUsdtATA, isSigner: false, isWritable: true },
                { pubkey: escrowPDA, isSigner: false, isWritable: true },
                { pubkey: vaultPDA, isSigner: false, isWritable: true },
                { pubkey: createPublicKey(ASSOCIATED_TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
            ],
            data: Buffer.from(INSTRUCTIONS.RELEASE_USDT)
        });
        
        transaction.add(releaseInstruction);
        
        // Send transaction
        const signature = await sendTransaction(connection, transaction, [sellerKeypair]);
        
        console.log('✅ USDT released successfully!');
        
        return { signature };
        
    } catch (error) {
        console.error('❌ Failed to release USDT:', error);
        throw error;
    }
}

// 4. CANCEL ESCROW (USDT Seller cancels escrow)
async function cancelEscrow(
    sellerKeypair,
    escrowPDAAddress,
    vaultPDAAddress,
    connection
) {
    console.log('❌ Cancelling escrow...');
    
    try {
        const escrowPDA = createPublicKey(escrowPDAAddress);
        const vaultPDA = createPublicKey(vaultPDAAddress);
        
        // Create transaction
        const transaction = new solanaWeb3.Transaction();
        
        // Add instruction
        const cancelInstruction = new solanaWeb3.TransactionInstruction({
            programId: createPublicKey(PROGRAM_ID),
            keys: [
                { pubkey: sellerKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: escrowPDA, isSigner: false, isWritable: true },
                { pubkey: vaultPDA, isSigner: false, isWritable: true },
                { pubkey: createPublicKey(ASSOCIATED_TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
            ],
            data: Buffer.from(INSTRUCTIONS.CANCEL)
        });
        
        transaction.add(cancelInstruction);
        
        // Send transaction
        const signature = await sendTransaction(connection, transaction, [sellerKeypair]);
        
        console.log('✅ Escrow cancelled successfully!');
        
        return { signature };
        
    } catch (error) {
        console.error('❌ Failed to cancel escrow:', error);
        throw error;
    }
}

// 5. GET ESCROW STATE (Read escrow data)
async function getEscrowState(escrowPDAAddress, connection) {
    console.log('📊 Getting escrow state...');
    
    try {
        const escrowPDA = createPublicKey(escrowPDAAddress);
        
        // Get account info
        const accountInfo = await connection.getAccountInfo(escrowPDA);
        
        if (!accountInfo) {
            throw new Error('Escrow account not found');
        }
        
        // Parse account data (this is a simplified version)
        const data = accountInfo.data;
        
        // Extract escrow state (you'll need to implement proper deserialization)
        const escrowState = {
            seed: data.readUInt32LE(8),
            bump: data.readUInt8(16),
            seller: data.slice(17, 49).toString('hex'),
            buyer: data.slice(49, 81).toString('hex'),
            usdtMint: data.slice(81, 113).toString('hex'),
            usdtAmount: data.readBigUInt64LE(113),
            inrAmount: data.readBigUInt64LE(121),
            isPaid: data.readUInt8(129) === 1,
            isCompleted: data.readUInt8(130) === 1
        };
        
        console.log('✅ Escrow state retrieved:');
        console.log(escrowState);
        
        return escrowState;
        
    } catch (error) {
        console.error('❌ Failed to get escrow state:', error);
        throw error;
    }
}

// 6. COMPLETE ESCROW WORKFLOW EXAMPLE
async function completeEscrowWorkflow() {
    console.log('🔄 Starting complete escrow workflow...');
    
    try {
        // Setup
        const connection = createConnection();
        const sellerKeypair = createKeypair();
        const buyerKeypair = createKeypair();
        
        // Step 1: Initialize escrow
        console.log('\n📝 Step 1: Initialize Escrow');
        const initResult = await initializeEscrow(
            sellerKeypair,
            buyerKeypair.publicKey.toString(),
            1000000, // 1 USDT (assuming 6 decimals)
            75000,   // 75,000 INR
            connection
        );
        
        // Step 2: Confirm payment
        console.log('\n💰 Step 2: Confirm Payment');
        await confirmPayment(
            buyerKeypair,
            initResult.escrowPDA,
            connection
        );
        
        // Step 3: Release USDT
        console.log('\n🎁 Step 3: Release USDT');
        await releaseUsdt(
            sellerKeypair,
            buyerKeypair.publicKey.toString(),
            initResult.escrowPDA,
            initResult.vaultPDA,
            connection
        );
        
        // Step 4: Get final state
        console.log('\n📊 Step 4: Get Final State');
        await getEscrowState(initResult.escrowPDA, connection);
        
        console.log('\n✅ Complete escrow workflow finished successfully!');
        
    } catch (error) {
        console.error('❌ Workflow failed:', error);
    }
}

// 7. UTILITY FUNCTIONS

// Check USDT balance
async function getUsdtBalance(walletAddress, connection) {
    try {
        const wallet = createPublicKey(walletAddress);
        const usdtMint = createPublicKey(USDT_MINT);
        
        const tokenAccount = await getAssociatedTokenAddress(usdtMint, wallet);
        const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
        
        return accountInfo.value.uiAmount;
    } catch (error) {
        console.error('Failed to get USDT balance:', error);
        return 0;
    }
}

// Create USDT token account if it doesn't exist
async function createUsdtAccount(walletKeypair, connection) {
    try {
        const usdtMint = createPublicKey(USDT_MINT);
        const tokenAccount = await getAssociatedTokenAddress(usdtMint, walletKeypair.publicKey);
        
        const transaction = new solanaWeb3.Transaction();
        
        const createAccountInstruction = new solanaWeb3.TransactionInstruction({
            programId: createPublicKey(ASSOCIATED_TOKEN_PROGRAM_ID),
            keys: [
                { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
                { pubkey: tokenAccount, isSigner: false, isWritable: true },
                { pubkey: walletKeypair.publicKey, isSigner: false, isWritable: false },
                { pubkey: usdtMint, isSigner: false, isWritable: false },
                { pubkey: createPublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false },
                { pubkey: createPublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false },
            ],
            data: Buffer.alloc(0)
        });
        
        transaction.add(createAccountInstruction);
        
        await sendTransaction(connection, transaction, [walletKeypair]);
        
        console.log('✅ USDT account created');
        return tokenAccount;
        
    } catch (error) {
        console.error('Failed to create USDT account:', error);
        throw error;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeEscrow,
        confirmPayment,
        releaseUsdt,
        cancelEscrow,
        getEscrowState,
        completeEscrowWorkflow,
        getUsdtBalance,
        createUsdtAccount,
        createConnection,
        createKeypair,
        createPublicKey
    };
}

// Browser usage example
if (typeof window !== 'undefined') {
    window.EscrowOperations = {
        initializeEscrow,
        confirmPayment,
        releaseUsdt,
        cancelEscrow,
        getEscrowState,
        completeEscrowWorkflow,
        getUsdtBalance,
        createUsdtAccount,
        createConnection,
        createKeypair,
        createPublicKey
    };
}

console.log('📦 USDT-INR Escrow Operations loaded successfully!');
console.log('🔧 Available functions:');
console.log('  - initializeEscrow(sellerKeypair, buyerAddress, usdtAmount, inrAmount, connection)');
console.log('  - confirmPayment(buyerKeypair, escrowPDA, connection)');
console.log('  - releaseUsdt(sellerKeypair, buyerAddress, escrowPDA, vaultPDA, connection)');
console.log('  - cancelEscrow(sellerKeypair, escrowPDA, vaultPDA, connection)');
console.log('  - getEscrowState(escrowPDA, connection)');
console.log('  - completeEscrowWorkflow()');
console.log('  - getUsdtBalance(walletAddress, connection)');
console.log('  - createUsdtAccount(walletKeypair, connection)'); 