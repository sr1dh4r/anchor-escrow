// Transaction history analyzer for Solana token transfers
// Shows last 10 transactions with token details

async function debugTransactions() {
    console.log('🔍 Fetching last 10 transactions...');
    
    // Get the wallet API instance
    if (!walletAPI) {
        console.error('❌ Wallet API not found. Make sure wallet is loaded.');
        return;
    }
    
    // Get recent transaction signatures
    const signatures = await walletAPI.connection.getSignaturesForAddress(
        walletAPI.wallet.publicKey,
        { limit: 10 }
    );
    
    console.log(`📋 Found ${signatures.length} recent transactions\n`);
    
    const transactions = [];
    
    for (let i = 0; i < signatures.length; i++) {
        const sigInfo = signatures[i];
        
        try {
            // Get parsed transaction details
            const txResponse = await walletAPI.connection.getParsedTransaction(sigInfo.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });
            
            if (!txResponse || !txResponse.meta) {
                continue;
            }
            
            const { transaction, meta } = txResponse;
            const walletPubkey = walletAPI.wallet.publicKey.toString();
            
            // Analyze token balance changes only for our wallet's ATAs
            if (meta.preTokenBalances && meta.postTokenBalances) {
                for (const preBalance of meta.preTokenBalances) {
                    // Only process if this ATA belongs to our wallet
                    if (preBalance.owner !== walletPubkey) {
                        continue;
                    }
                    
                    const postBalance = meta.postTokenBalances.find(
                        post => post.accountIndex === preBalance.accountIndex && post.mint === preBalance.mint
                    );
                    
                    if (postBalance) {
                        const preAmount = parseFloat(preBalance.uiTokenAmount?.uiAmount || 0);
                        const postAmount = parseFloat(postBalance.uiTokenAmount?.uiAmount || 0);
                        const change = postAmount - preAmount;
                        
                        if (Math.abs(change) > 0.000001) { // Significant change
                            const isReceived = change > 0;
                            const amount = Math.abs(change);
                            
                            // Get token name from mint address
                            const tokenName = getTokenName(preBalance.mint);
                            
                            // Determine to/from addresses based on direction
                            let toAddress, fromAddress;
                            if (isReceived) {
                                // We received tokens - find who sent them to us
                                fromAddress = getOtherAccountAddress(transaction, walletPubkey, preBalance.owner);
                                toAddress = walletPubkey;
                            } else {
                                // We sent tokens - find who received them
                                fromAddress = walletPubkey;
                                toAddress = getDestinationATAOwner(transaction, meta, preBalance.mint, walletPubkey);
                            }
                            
                            transactions.push({
                                signature: sigInfo.signature,
                                timestamp: new Date(sigInfo.blockTime * 1000),
                                tokenName,
                                direction: isReceived ? 'received' : 'sent',
                                amount,
                                fromAddress,
                                toAddress
                            });
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error(`❌ Error analyzing transaction ${sigInfo.signature}:`, error.message);
        }
    }
    
    // Display results
    console.log('📊 Transaction History Summary:');
    console.log('=' .repeat(80));
    
    if (transactions.length === 0) {
        console.log('No token transactions found in the last 10 transactions.');
        return;
    }
    
    transactions.forEach((tx, index) => {
        console.log(`\n${index + 1}. ${tx.tokenName} - ${tx.direction.toUpperCase()}`);
        console.log(`   Amount: ${tx.amount}`);
        console.log(`   From: ${tx.fromAddress}`);
        console.log(`   To: ${tx.toAddress}`);
        console.log(`   Time: ${tx.timestamp.toLocaleString()}`);
        console.log(`   Signature: ${tx.signature}`);
    });
}

// Helper function to get token name from mint address
function getTokenName(mintAddress) {
    const knownTokens = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
        'So11111111111111111111111111111111111111112': 'SOL',
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
        '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH (Wormhole)',
        'A9mUU4qviSctJVPJdBJkbHknXz5u6F4kCx6k6C6k6C6k': 'Unknown Token'
    };
    return knownTokens[mintAddress] || `Token (${mintAddress.slice(0, 8)}...)`;
}

// Helper function to get the other account address in a transaction
function getOtherAccountAddress(transaction, walletPubkey, ataOwner) {
    const accountKeys = transaction.message.accountKeys;
    
    // Find accounts that are not our wallet or the ATA owner
    for (const account of accountKeys) {
        const accountStr = account.toString();
        if (accountStr !== walletPubkey && accountStr !== ataOwner) {
            return accountStr;
        }
    }
    
    // If no other account found, return the ATA owner
    return ataOwner;
}

// Helper function to get the owner of the destination ATA when sending tokens
function getDestinationATAOwner(transaction, meta, mintAddress, walletPubkey) {
    // Look for token balance changes where the amount increased (someone received tokens)
    if (meta.preTokenBalances && meta.postTokenBalances) {
        for (const preBalance of meta.preTokenBalances) {
            // Skip our own ATA
            if (preBalance.owner === walletPubkey) {
                continue;
            }
            
            // Only look at the same token mint
            if (preBalance.mint !== mintAddress) {
                continue;
            }
            
            const postBalance = meta.postTokenBalances.find(
                post => post.accountIndex === preBalance.accountIndex && post.mint === preBalance.mint
            );
            
            if (postBalance) {
                const preAmount = parseFloat(preBalance.uiTokenAmount?.uiAmount || 0);
                const postAmount = parseFloat(postBalance.uiTokenAmount?.uiAmount || 0);
                const change = postAmount - preAmount;
                
                // If this ATA received tokens (positive change), return its owner
                if (change > 0.000001) {
                    return preBalance.owner;
                }
            }
        }
    }
    
    // Fallback: try to find any other account in the transaction
    return getOtherAccountAddress(transaction, walletPubkey, walletPubkey);
}

// Run the debug function
console.log('🚀 Transaction History Analyzer Loaded');
console.log('📝 Run debugTransactions() to see your last 10 token transactions');

