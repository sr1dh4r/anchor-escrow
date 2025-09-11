# Solana Wallet

A basic crypto wallet for USDT on Solana with extensible architecture for future chains and tokens.

## Features

- **USDT Support**: Send and receive USDT tokens on Solana
- **SOL Support**: Native Solana token support
- **Phantom Integration**: Connect with Phantom wallet
- **Transaction History**: View recent transactions
- **Extensible Architecture**: Easy to add new tokens and chains
- **Modern UI**: Clean, Phantom-inspired interface with Tailwind CSS

## Files

- `wallet.html` - Main wallet interface
- `wallet-api.js` - Wallet API with Solana integration
- `README.md` - This documentation

## Usage

1. **Open the wallet**: Navigate to `wallet.html` in your browser
2. **Connect wallet**: Click "Connect Phantom Wallet" to connect your Phantom wallet
3. **View balances**: See your SOL and USDT balances
4. **Send tokens**: Use the "Send Tokens" button to transfer USDT or SOL
5. **View history**: Check your transaction history

## Supported Tokens

Currently supports:
- **SOL** (Solana native token)
- **USDT** (Tether USD on Solana devnet)

## Adding New Tokens

To add a new token, use the `addToken` method in the wallet API:

```javascript
walletAPI.addToken('USDC', 'mint_address', 6, 'USD Coin', '💵');
```

## Adding New Chains

To add a new blockchain, use the `addChain` method:

```javascript
walletAPI.addChain('ethereum', 'Ethereum', 'https://mainnet.infura.io/v3/...', 'https://etherscan.io', '⛓️');
```

## Dependencies

- @solana/web3.js - Solana JavaScript SDK
- @coral-xyz/anchor - Anchor framework
- @solana/spl-token - SPL Token program
- Tailwind CSS - Styling framework

## Network

Currently configured for Solana Devnet. To change networks, modify the connection URL in the initialization.

## Security

- Uses Phantom wallet for secure key management
- All transactions are signed by the user's wallet
- No private keys are stored in the application

## Future Enhancements

- Multi-chain support (Ethereum, Polygon, etc.)
- More token support (USDC, DAI, etc.)
- Portfolio tracking
- DeFi integrations
- NFT support
- Mobile responsiveness improvements
