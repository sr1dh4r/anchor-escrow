/**
 * Solana Wallet API - Vanilla JavaScript Client
 * 
 * This file provides JavaScript APIs for basic crypto wallet functionality.
 * It supports USDT on Solana with extensible architecture for future chains/tokens.
 * 
 * Network: Devnet (configurable)
 * Supported Tokens: USDT (extensible for others)
 */

// Dependencies - These need to be loaded before this script
// @solana/web3.js
// @coral-xyz/anchor
// @solana/spl-token

class WalletAPI {
    constructor(connection, network = 'devnet') {
        this.connection = connection;
        this.network = network;
        this.wallet = null;
        this.keypair = null;
        this.mnemonic = null;
        this.walletName = null;
        
        // WebSocket monitoring
        this.balanceSubscriptions = new Map(); // tokenMint -> subscriptionId
        this.transactionCallbacks = new Map(); // transactionId -> callback
        this.isMonitoring = false;
        
        // Token configurations - easily extensible for new tokens
        this.tokens = {
            'USDT': {
                mint: 'J1UjsVLRwGcpoCjexjDaHWVoj9F3TbdCpwVYNUYkww6y', // USDT on devnet
                decimals: 6,
                symbol: 'USDT',
                name: 'Tether USD',
                icon: '💵'
            }
            // Future tokens can be added here
        };
        
        // Chain configurations - easily extensible for new chains
        this.chains = {
            'solana': {
                name: 'Solana',
                rpc: 'https://api.devnet.solana.com',
                explorer: 'https://explorer.solana.com',
                icon: '☀️'
            }
            // Future chains can be added here
        };
        
        console.log('✅ Wallet API initialized');
    }

    /**
     * Create a new wallet with generated keypair
     * 
     * @param {string} walletName - Optional name for the wallet
     * @returns {Promise<Object>} Wallet object with keypair and mnemonic
     */
    async createWallet(walletName = null) {
        try {
            // Generate new keypair
            this.keypair = solanaWeb3.Keypair.generate();
            
            // Generate mnemonic (for display purposes - in production, use proper BIP39)
            this.mnemonic = this.generateMnemonic();
            
            // Set wallet name
            this.walletName = walletName || `Wallet ${this.keypair.publicKey.toString().slice(0, 8)}`;
            
            // Set up wallet object
            this.wallet = {
                publicKey: this.keypair.publicKey,
                signTransaction: (transaction) => {
                    transaction.sign(this.keypair);
                    return Promise.resolve(transaction);
                },
                signAllTransactions: (transactions) => {
                    transactions.forEach(tx => tx.sign(this.keypair));
                    return Promise.resolve(transactions);
                }
            };
            
            // Store wallet data in localStorage
            this.saveWalletToStorage();
            
            console.log('✅ New wallet created:', this.wallet.publicKey.toString(), 'Name:', this.walletName);
            return {
                wallet: this.wallet,
                mnemonic: this.mnemonic,
                publicKey: this.wallet.publicKey.toString(),
                walletName: this.walletName
            };
            
        } catch (error) {
            console.error('❌ Failed to create wallet:', error);
            throw error;
        }
    }

    /**
     * Import wallet from private key
     * 
     * @param {string} privateKey - Base58 encoded private key
     * @param {string} walletName - Optional name for the wallet
     * @returns {Promise<Object>} Wallet object
     */
    async importWalletFromPrivateKey(privateKey, walletName = null) {
        try {
            // Convert private key to Uint8Array
            const privateKeyBytes = this.base58ToUint8Array(privateKey);
            
            // Create keypair from private key
            this.keypair = solanaWeb3.Keypair.fromSecretKey(privateKeyBytes);
            this.mnemonic = null;
            
            // Set wallet name
            this.walletName = walletName || `Imported ${this.keypair.publicKey.toString().slice(0, 8)}`;
            
            // Set up wallet object
            this.wallet = {
                publicKey: this.keypair.publicKey,
                signTransaction: (transaction) => {
                    transaction.sign(this.keypair);
                    return Promise.resolve(transaction);
                },
                signAllTransactions: (transactions) => {
                    transactions.forEach(tx => tx.sign(this.keypair));
                    return Promise.resolve(transactions);
                }
            };
            
            // Store wallet data in localStorage
            this.saveWalletToStorage();
            
            console.log('✅ Wallet imported from private key:', this.wallet.publicKey.toString(), 'Name:', this.walletName);
            return {
                wallet: this.wallet,
                publicKey: this.wallet.publicKey.toString(),
                mnemonic: this.mnemonic,
                walletName: this.walletName
            };
            
        } catch (error) {
            console.error('❌ Failed to import wallet:', error);
            throw error;
        }
    }

    /**
     * Import wallet from mnemonic phrase
     * 
     * @param {string} mnemonic - Mnemonic phrase
     * @param {string} walletName - Optional name for the wallet
     * @returns {Promise<Object>} Wallet object
     */
    async importWalletFromMnemonic(mnemonic, walletName = null) {
        try {
            // In a production app, you'd use a proper BIP39 library
            // For now, we'll generate a keypair and store the mnemonic
            this.keypair = solanaWeb3.Keypair.generate();
            this.mnemonic = mnemonic;
            
            // Set wallet name
            this.walletName = walletName || `Mnemonic ${this.keypair.publicKey.toString().slice(0, 8)}`;
            
            // Set up wallet object
            this.wallet = {
                publicKey: this.keypair.publicKey,
                signTransaction: (transaction) => {
                    transaction.sign(this.keypair);
                    return Promise.resolve(transaction);
                },
                signAllTransactions: (transactions) => {
                    transactions.forEach(tx => tx.sign(this.keypair));
                    return Promise.resolve(transactions);
                }
            };
            
            // Store wallet data in localStorage
            this.saveWalletToStorage();
            
            console.log('✅ Wallet imported from mnemonic:', this.wallet.publicKey.toString(), 'Name:', this.walletName);
            return {
                wallet: this.wallet,
                publicKey: this.wallet.publicKey.toString(),
                mnemonic: this.mnemonic,
                walletName: this.walletName
            };
            
        } catch (error) {
            console.error('❌ Failed to import wallet from mnemonic:', error);
            throw error;
        }
    }

    /**
     * Import wallet from keypair file
     * 
     * @param {File} file - Keypair JSON file or raw keypair array file
     * @param {string} walletName - Optional name for the wallet
     * @returns {Promise<Object>} Wallet object
     */
    async importWalletFromFile(file, walletName = null) {
        try {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        let privateKeyBytes;
                        
                        // Try to parse as JSON first (our custom format)
                        try {
                            const keypairData = JSON.parse(event.target.result);
                            
                            if (keypairData.privateKey && Array.isArray(keypairData.privateKey)) {
                                // Our custom JSON format
                                privateKeyBytes = new Uint8Array(keypairData.privateKey);
                                this.mnemonic = keypairData.mnemonic || null;
                            } else {
                                throw new Error('Invalid JSON format');
                            }
                        } catch (jsonError) {
                            // Try to parse as raw keypair array (Phantom format)
                            try {
                                const rawArray = JSON.parse(event.target.result);
                                
                                if (Array.isArray(rawArray) && rawArray.length === 64) {
                                    // Raw keypair array format (Phantom style)
                                    privateKeyBytes = new Uint8Array(rawArray);
                                    this.mnemonic = null;
                                } else {
                                    throw new Error('Invalid array format');
                                }
                            } catch (arrayError) {
                                // Try to parse as space-separated numbers
                                try {
                                    const text = event.target.result.trim();
                                    const numbers = text.split(/[,\s]+/).map(n => parseInt(n.trim()));
                                    
                                    if (numbers.length === 64 && numbers.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
                                        privateKeyBytes = new Uint8Array(numbers);
                                        this.mnemonic = null;
                                    } else {
                                        throw new Error('Invalid number format');
                                    }
                                } catch (textError) {
                                    throw new Error('Unsupported file format. Please use a valid keypair file.');
                                }
                            }
                        }
                        
                        // Validate private key length
                        if (privateKeyBytes.length !== 64) {
                            throw new Error('Invalid private key length. Expected 64 bytes.');
                        }
                        
                        // Create keypair from private key
                        this.keypair = solanaWeb3.Keypair.fromSecretKey(privateKeyBytes);
                        
                        // Set wallet name
                        this.walletName = walletName || `File ${this.keypair.publicKey.toString().slice(0, 8)}`;
                        
                        // Set up wallet object
                        this.wallet = {
                            publicKey: this.keypair.publicKey,
                            signTransaction: (transaction) => {
                                transaction.sign(this.keypair);
                                return Promise.resolve(transaction);
                            },
                            signAllTransactions: (transactions) => {
                                transactions.forEach(tx => tx.sign(this.keypair));
                                return Promise.resolve(transactions);
                            }
                        };
                        
                        // Store wallet data in localStorage
                        this.saveWalletToStorage();
                        
                        console.log('✅ Wallet imported from file:', this.wallet.publicKey.toString(), 'Name:', this.walletName);
                        resolve({
                            wallet: this.wallet,
                            publicKey: this.wallet.publicKey.toString(),
                            mnemonic: this.mnemonic,
                            walletName: this.walletName
                        });
                        
                    } catch (error) {
                        console.error('❌ Failed to parse keypair file:', error);
                        reject(new Error('Invalid keypair file: ' + error.message));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                
                reader.readAsText(file);
            });
            
        } catch (error) {
            console.error('❌ Failed to import wallet from file:', error);
            throw error;
        }
    }

    /**
     * Load existing wallet from storage
     * 
     * @returns {Promise<Object>} Wallet object or null if not found
     */
    async loadWalletFromStorage() {
        try {
            const storedWallet = localStorage.getItem('solana_wallet');
            if (!storedWallet) {
                return null;
            }
            
            const walletData = JSON.parse(storedWallet);
            
            // Convert stored private key back to keypair
            const privateKeyBytes = new Uint8Array(walletData.privateKey);
            this.keypair = solanaWeb3.Keypair.fromSecretKey(privateKeyBytes);
            this.mnemonic = walletData.mnemonic;
            this.walletName = walletData.walletName || `Wallet ${this.keypair.publicKey.toString().slice(0, 8)}`;
            
            // Set up wallet object
            this.wallet = {
                publicKey: this.keypair.publicKey,
                signTransaction: (transaction) => {
                    transaction.sign(this.keypair);
                    return Promise.resolve(transaction);
                },
                signAllTransactions: (transactions) => {
                    transactions.forEach(tx => tx.sign(this.keypair));
                    return Promise.resolve(transactions);
                }
            };
            
            console.log('✅ Wallet loaded from storage:', this.wallet.publicKey.toString(), 'Name:', this.walletName);
            return {
                wallet: this.wallet,
                publicKey: this.wallet.publicKey.toString(),
                mnemonic: this.mnemonic,
                walletName: this.walletName
            };
            
        } catch (error) {
            console.error('❌ Failed to load wallet from storage:', error);
            return null;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnectWallet() {
        try {
            this.wallet = null;
            this.keypair = null;
            this.mnemonic = null;
            localStorage.removeItem('solana_wallet');
            console.log('✅ Wallet disconnected');
        } catch (error) {
            console.error('❌ Failed to disconnect wallet:', error);
            throw error;
        }
    }

    /**
     * Save wallet to localStorage
     */
    saveWalletToStorage() {
        try {
            const walletData = {
                privateKey: Array.from(this.keypair.secretKey),
                publicKey: this.keypair.publicKey.toString(),
                mnemonic: this.mnemonic,
                walletName: this.walletName,
                network: this.network
            };
            localStorage.setItem('solana_wallet', JSON.stringify(walletData));
            console.log('✅ Wallet saved to storage');
        } catch (error) {
            console.error('❌ Failed to save wallet to storage:', error);
        }
    }

    /**
     * Generate a simple mnemonic (for demo purposes)
     * In production, use a proper BIP39 library
     */
    generateMnemonic() {
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
            'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
            'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
            'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent'
        ];
        
        const mnemonic = [];
        for (let i = 0; i < 12; i++) {
            mnemonic.push(words[Math.floor(Math.random() * words.length)]);
        }
        return mnemonic.join(' ');
    }

    /**
     * Convert base58 string to Uint8Array
     */
    base58ToUint8Array(base58) {
        // Simple base58 decoder (in production, use a proper library)
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let decoded = 0n;
        let multi = 1n;
        
        for (let i = base58.length - 1; i >= 0; i--) {
            const char = base58[i];
            const index = alphabet.indexOf(char);
            if (index === -1) throw new Error('Invalid base58 character');
            decoded += BigInt(index) * multi;
            multi *= 58n;
        }
        
        // Convert to bytes
        const bytes = [];
        while (decoded > 0n) {
            bytes.unshift(Number(decoded & 255n));
            decoded >>= 8n;
        }
        
        return new Uint8Array(bytes);
    }

    /**
     * Convert Uint8Array to base58 string
     */
    uint8ArrayToBase58(uint8Array) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let num = 0n;
        let multi = 1n;
        
        for (let i = uint8Array.length - 1; i >= 0; i--) {
            num += BigInt(uint8Array[i]) * multi;
            multi *= 256n;
        }
        
        let result = '';
        while (num > 0n) {
            result = alphabet[Number(num % 58n)] + result;
            num /= 58n;
        }
        
        return result;
    }

    /**
     * Get wallet private key as base58 string
     */
    getPrivateKey() {
        if (!this.keypair) {
            throw new Error('No wallet loaded');
        }
        return this.uint8ArrayToBase58(this.keypair.secretKey);
    }

    /**
     * Get wallet mnemonic phrase
     */
    getMnemonic() {
        if (!this.mnemonic) {
            throw new Error('No mnemonic available');
        }
        return this.mnemonic;
    }

    getWalletName() {
        return this.walletName || 'Unnamed Wallet';
    }

    /**
     * Get wallet balance for a specific token
     * 
     * @param {string} tokenSymbol - Token symbol (e.g., 'USDT')
     * @returns {Promise<Object>} Token balance information
     */
    async getTokenBalance(tokenSymbol) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not connected');
            }

            const token = this.tokens[tokenSymbol];
            if (!token) {
                throw new Error(`Token ${tokenSymbol} not supported`);
            }

            const ata = splToken.getAssociatedTokenAddressSync(
                new solanaWeb3.PublicKey(token.mint), 
                this.wallet.publicKey
            );
            
            const balance = await this.connection.getTokenAccountBalance(ata);
            
            return {
                symbol: tokenSymbol,
                balance: parseInt(balance.value.amount),
                decimals: token.decimals,
                formattedBalance: this.formatTokenAmount(parseInt(balance.value.amount), token.decimals),
                mint: token.mint,
                name: token.name,
                icon: token.icon
            };
            
        } catch (error) {
            console.error(`❌ Failed to get ${tokenSymbol} balance:`, error);
            return {
                symbol: tokenSymbol,
                balance: 0,
                decimals: this.tokens[tokenSymbol]?.decimals || 6,
                formattedBalance: '0.000000',
                mint: this.tokens[tokenSymbol]?.mint || '',
                name: this.tokens[tokenSymbol]?.name || '',
                icon: this.tokens[tokenSymbol]?.icon || '💰'
            };
        }
    }

    /**
     * Get SOL balance
     * 
     * @returns {Promise<Object>} SOL balance information
     */
    async getSolBalance() {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not connected');
            }

            const balance = await this.connection.getBalance(this.wallet.publicKey);
            
            return {
                symbol: 'SOL',
                balance: balance,
                decimals: 9,
                formattedBalance: this.formatTokenAmount(balance, 9),
                name: 'Solana',
                icon: '☀️'
            };
            
        } catch (error) {
            console.error('❌ Failed to get SOL balance:', error);
            return {
                symbol: 'SOL',
                balance: 0,
                decimals: 9,
                formattedBalance: '0.000000000',
                name: 'Solana',
                icon: '☀️'
            };
        }
    }

    /**
     * Get all token balances
     * 
     * @returns {Promise<Array>} Array of token balance objects
     */
    async getAllBalances() {
        try {
            const balances = [];
            
            // Get SOL balance
            const solBalance = await this.getSolBalance();
            balances.push(solBalance);
            
            // Get token balances
            for (const tokenSymbol of Object.keys(this.tokens)) {
                const tokenBalance = await this.getTokenBalance(tokenSymbol);
                balances.push(tokenBalance);
            }
            
            return balances;
            
        } catch (error) {
            console.error('❌ Failed to get all balances:', error);
            return [];
        }
    }

    /**
     * Send tokens to another wallet
     * 
     * @param {string} tokenSymbol - Token symbol to send
     * @param {string} recipient - Recipient wallet address
     * @param {string} amount - Amount to send (formatted)
     * @returns {Promise<Object>} Transaction result
     */
    async sendTokens(tokenSymbol, recipient, amount) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not connected');
            }

            const token = this.tokens[tokenSymbol];
            if (!token) {
                throw new Error(`Token ${tokenSymbol} not supported`);
            }

            // Parse amount
            const parsedAmount = this.parseTokenAmount(amount, token.decimals);
            
            // Get sender and recipient ATAs
            const senderAta = splToken.getAssociatedTokenAddressSync(
                new solanaWeb3.PublicKey(token.mint),
                this.wallet.publicKey
            );
            
            const recipientAta = splToken.getAssociatedTokenAddressSync(
                new solanaWeb3.PublicKey(token.mint),
                new solanaWeb3.PublicKey(recipient)
            );

            // Check if recipient ATA exists, create if not
            const recipientAtaInfo = await this.connection.getAccountInfo(recipientAta);
            if (!recipientAtaInfo) {
                console.log('Creating recipient ATA...');
                const createAtaIx = splToken.createAssociatedTokenAccountInstruction(
                    this.wallet.publicKey, // payer
                    recipientAta, // ata
                    new solanaWeb3.PublicKey(recipient), // owner
                    new solanaWeb3.PublicKey(token.mint) // mint
                );
                
                const createAtaTx = new solanaWeb3.Transaction().add(createAtaIx);
                await this.wallet.signTransaction(createAtaTx);
                await this.connection.sendTransaction(createAtaTx, [this.wallet]);
            }

            // Create transfer instruction
            const transferIx = splToken.createTransferInstruction(
                senderAta, // source
                recipientAta, // destination
                new solanaWeb3.PublicKey(this.wallet.publicKey), // owner
                BigInt(parsedAmount), // amount as BigInt
                [], // multiSigners (empty array)
                splToken.TOKEN_PROGRAM_ID // programId
            );

            // Create transaction
            const transaction = new solanaWeb3.Transaction().add(transferIx);
            
            // Sign and send transaction
            const signature = await solanaWeb3.sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.keypair]
            );

            const result = {
                success: true,
                signature: signature,
                tokenSymbol: tokenSymbol,
                amount: amount,
                recipient: recipient,
                explorerUrl: `${this.chains.solana.explorer}/transaction/${signature}?cluster=${this.network}`
            };

            console.log('✅ Tokens sent successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Failed to send tokens:', error);
            throw error;
        }
    }

    /**
     * Send SOL to another wallet
     * 
     * @param {string} recipient - Recipient wallet address
     * @param {string} amount - Amount to send (formatted)
     * @returns {Promise<Object>} Transaction result
     */
    async sendSol(recipient, amount) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not connected');
            }

            // Parse amount
            const parsedAmount = this.parseTokenAmount(amount, 9);
            
            // Create transfer instruction
            const transferIx = solanaWeb3.SystemProgram.transfer({
                fromPubkey: this.wallet.publicKey,
                toPubkey: new solanaWeb3.PublicKey(recipient),
                lamports: parsedAmount
            });

            // Create transaction
            const transaction = new solanaWeb3.Transaction().add(transferIx);
            
            // Sign and send transaction
            const signature = await solanaWeb3.sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.keypair]
            );

            const result = {
                success: true,
                signature: signature,
                tokenSymbol: 'SOL',
                amount: amount,
                recipient: recipient,
                explorerUrl: `${this.chains.solana.explorer}/transaction/${signature}?cluster=${this.network}`
            };

            console.log('✅ SOL sent successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Failed to send SOL:', error);
            throw error;
        }
    }

    /**
     * Get transaction history for the wallet
     * 
     * @param {number} limit - Number of transactions to fetch
     * @returns {Promise<Array>} Array of transaction objects
     */
    async getTransactionHistory(limit = 10) {
        try {
            if (!this.wallet) {
                throw new Error('Wallet not connected');
            }

            const signatures = await this.connection.getSignaturesForAddress(
                this.wallet.publicKey,
                { limit: limit }
            );

            const transactions = [];
            for (const sig of signatures) {
                const tx = await this.connection.getTransaction(sig.signature);
                transactions.push({
                    signature: sig.signature,
                    slot: sig.slot,
                    blockTime: sig.blockTime,
                    confirmationStatus: sig.confirmationStatus,
                    err: sig.err,
                    memo: sig.memo,
                    explorerUrl: `${this.chains.solana.explorer}/transaction/${sig.signature}?cluster=${this.network}`
                });
            }

            return transactions;

        } catch (error) {
            console.error('❌ Failed to get transaction history:', error);
            return [];
        }
    }

    /**
     * Format token amount for display
     * 
     * @param {number} amount - Amount in smallest unit
     * @param {number} decimals - Token decimals
     * @returns {string} Formatted amount
     */
    formatTokenAmount(amount, decimals) {
        return (amount / Math.pow(10, decimals)).toFixed(decimals);
    }

    /**
     * Parse token amount from user input
     * 
     * @param {string} input - User input string
     * @param {number} decimals - Token decimals
     * @returns {number} Amount in smallest unit
     */
    parseTokenAmount(input, decimals) {
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount');
        }
        return Math.floor(amount * Math.pow(10, decimals));
    }

    /**
     * Add a new token to the wallet
     * 
     * @param {string} symbol - Token symbol
     * @param {string} mint - Token mint address
     * @param {number} decimals - Token decimals
     * @param {string} name - Token name
     * @param {string} icon - Token icon/emoji
     */
    addToken(symbol, mint, decimals, name, icon = '💰') {
        this.tokens[symbol] = {
            mint: mint,
            decimals: decimals,
            symbol: symbol,
            name: name,
            icon: icon
        };
        console.log(`✅ Added token: ${symbol}`);
    }

    /**
     * Add a new chain to the wallet
     * 
     * @param {string} chainId - Chain identifier
     * @param {string} name - Chain name
     * @param {string} rpc - RPC URL
     * @param {string} explorer - Explorer URL
     * @param {string} icon - Chain icon/emoji
     */
    addChain(chainId, name, rpc, explorer, icon = '⛓️') {
        this.chains[chainId] = {
            name: name,
            rpc: rpc,
            explorer: explorer,
            icon: icon
        };
        console.log(`✅ Added chain: ${name}`);
    }

    /**
     * Get supported tokens
     * 
     * @returns {Object} Supported tokens
     */
    getSupportedTokens() {
        return this.tokens;
    }

    /**
     * Get supported chains
     * 
     * @returns {Object} Supported chains
     */
    getSupportedChains() {
        return this.chains;
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
     * Copy text to clipboard
     * 
     * @param {string} text - Text to copy
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    /**
     * Start WebSocket monitoring for balance changes
     */
    startBalanceMonitoring() {
        if (!this.wallet || this.isMonitoring) {
            return;
        }

        console.log('🔍 Starting balance monitoring...');
        this.isMonitoring = true;

        // Monitor SOL balance
        this.monitorSolBalance();

        // Monitor token balances
        Object.keys(this.tokens).forEach(tokenSymbol => {
            this.monitorTokenBalance(tokenSymbol);
        });
    }

    /**
     * Stop WebSocket monitoring
     */
    stopBalanceMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        console.log('🛑 Stopping balance monitoring...');
        
        // Unsubscribe from all token accounts
        this.balanceSubscriptions.forEach((subscriptionId, tokenMint) => {
            this.connection.removeAccountChangeListener(subscriptionId);
        });
        
        this.balanceSubscriptions.clear();
        this.transactionCallbacks.clear();
        this.isMonitoring = false;
    }

    /**
     * Monitor SOL balance changes
     */
    monitorSolBalance() {
        if (!this.wallet) return;

        const subscriptionId = this.connection.onAccountChange(
            this.wallet.publicKey,
            (accountInfo) => {
                console.log('💰 SOL balance changed');
                console.log('📋 SOL accountInfo:', accountInfo);
                this.onBalanceChange('SOL', accountInfo);
            },
            'finalized'
        );

        this.balanceSubscriptions.set('SOL', subscriptionId);
    }

    /**
     * Monitor token balance changes
     */
    async monitorTokenBalance(tokenSymbol) {
        if (!this.wallet) return;

        try {
            const tokenMint = this.tokens[tokenSymbol].mint;
            const ata = splToken.getAssociatedTokenAddressSync(
                new solanaWeb3.PublicKey(tokenMint),
                this.wallet.publicKey
            );

            const subscriptionId = this.connection.onAccountChange(
                ata,
                (accountInfo) => {
                    console.log(`💰 ${tokenSymbol} balance changed`);
                    console.log(`📋 ${tokenSymbol} accountInfo:`, accountInfo);
                    this.onBalanceChange(tokenSymbol, accountInfo);
                },
                'finalized'
            );

            this.balanceSubscriptions.set(tokenMint, subscriptionId);
        } catch (error) {
            console.log(`⚠️ Could not monitor ${tokenSymbol} balance:`, error.message);
        }
    }

    /**
     * Handle balance change events
     */
    async onBalanceChange(tokenSymbol, accountInfo) {
        console.log(`💰 Balance change detected for ${tokenSymbol}`);
        
        // Get current balance to compare
        let currentBalance;
        try {
            if (tokenSymbol === 'SOL') {
                currentBalance = await this.getSolBalance();
            } else {
                currentBalance = await this.getTokenBalance(tokenSymbol);
            }
            console.log(`📊 Current ${tokenSymbol} balance: ${currentBalance}`);
        } catch (error) {
            console.log(`⚠️ Could not get current balance for ${tokenSymbol}:`, error.message);
        }

        // Trigger any registered callbacks
        this.transactionCallbacks.forEach((callback, transactionId) => {
            if (callback.tokenSymbol === tokenSymbol) {
                console.log(`📞 Triggering callback for transaction ${transactionId}`);
                callback.function();
                this.transactionCallbacks.delete(transactionId);
            }
        });

        // Trigger global balance update event
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            console.log(`🔄 Dispatching global balanceChanged event for ${tokenSymbol}`);
            window.dispatchEvent(new CustomEvent('balanceChanged', {
                detail: { tokenSymbol, accountInfo, currentBalance }
            }));
        }
    }

    /**
     * Register callback for specific transaction
     */
    registerTransactionCallback(transactionId, tokenSymbol, callback) {
        this.transactionCallbacks.set(transactionId, {
            tokenSymbol,
            function: callback
        });
        console.log(`📝 Registered callback for transaction ${transactionId} (${tokenSymbol})`);
    }

    /**
     * Remove transaction callback
     */
    removeTransactionCallback(transactionId) {
        if (this.transactionCallbacks.has(transactionId)) {
            this.transactionCallbacks.delete(transactionId);
            console.log(`🗑️ Removed callback for transaction ${transactionId}`);
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletAPI;
} else if (typeof window !== 'undefined') {
    window.WalletAPI = WalletAPI;
}
