# Client-Side Implementation

This folder contains all client-side files for interacting with the USDT-INR Escrow Program.

## 📁 Files Overview

### Core Implementation
- **`escrow-operations.js`** - Vanilla JavaScript implementation of all escrow operations
- **`escrow-demo.html`** - Interactive web demo for testing escrow operations

### Documentation
- **`CLIENT_USAGE_GUIDE.md`** - Comprehensive guide for client-side integration
- **`FRONTEND_EXAMPLE.md`** - React frontend implementation example

## 🚀 Quick Start

### Option 1: Interactive Demo
1. Open `escrow-demo.html` in a web browser
2. Fill in the forms with test data
3. Click buttons to execute escrow operations
4. Watch real-time console output

### Option 2: Vanilla JavaScript
```html
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
<script src="escrow-operations.js"></script>

<script>
// Initialize escrow
const connection = createConnection();
const sellerKeypair = createKeypair();
const result = await initializeEscrow(sellerKeypair, buyerAddress, 1000000, 75000, connection);
</script>
```

### Option 3: React Implementation
Follow the instructions in `FRONTEND_EXAMPLE.md` to create a React frontend.

## 🔧 Available Functions

### Core Operations
- `initializeEscrow()` - Create escrow and deposit USDT
- `confirmPayment()` - Buyer confirms off-chain payment
- `releaseUsdt()` - Seller releases USDT to buyer
- `cancelEscrow()` - Seller cancels escrow

### Utility Functions
- `getEscrowState()` - Read escrow data from blockchain
- `getUsdtBalance()` - Check USDT balance
- `createUsdtAccount()` - Create USDT token account
- `completeEscrowWorkflow()` - Run complete workflow

## 📋 Program Information

- **Program ID**: `3MS2fGZYpUG8BdTg1s1RzBbJyQe18foqAx9Y1AbBcAdW`
- **Network**: Devnet
- **USDT Mint**: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`

## 🛠️ Integration Examples

### Browser Integration
```javascript
// Load the operations
<script src="escrow-operations.js"></script>

// Use in your app
const connection = createConnection();
const sellerKeypair = createKeypair();
await initializeEscrow(sellerKeypair, buyerAddress, usdtAmount, inrAmount, connection);
```

### Node.js Integration
```javascript
const { initializeEscrow, createConnection, createKeypair } = require('./escrow-operations.js');

const connection = createConnection();
const sellerKeypair = createKeypair();
await initializeEscrow(sellerKeypair, buyerAddress, usdtAmount, inrAmount, connection);
```

### React Integration
```jsx
import { useEscrowProgram } from './hooks/useEscrowProgram';

function App() {
  const { createEscrow, confirmPayment, loading } = useEscrowProgram();
  
  const handleCreateEscrow = async () => {
    await createEscrow(buyerAddress, usdtAmount, inrAmount);
  };
  
  return (
    <button onClick={handleCreateEscrow} disabled={loading}>
      Create Escrow
    </button>
  );
}
```

## 📚 Documentation

- **`CLIENT_USAGE_GUIDE.md`** - Detailed client-side usage instructions
- **`FRONTEND_EXAMPLE.md`** - React frontend implementation guide
- **`escrow-demo.html`** - Interactive demo with all operations

## 🔍 Testing

1. **Open Demo**: Load `escrow-demo.html` in browser
2. **Test Operations**: Use the interactive forms
3. **Check Console**: Monitor real-time operation logs
4. **Verify Results**: Check transaction signatures and account states

## ⚠️ Important Notes

1. **Instruction Discriminators**: Update discriminators in `escrow-operations.js` with actual program values
2. **Network Configuration**: Change network URL for production use
3. **USDT Mint**: Verify USDT mint address for target network
4. **Error Handling**: Add robust error handling for production

## 🎯 Next Steps

1. **Customize**: Modify functions for your specific needs
2. **Integrate**: Add to your existing frontend application
3. **Test**: Thoroughly test all operations
4. **Deploy**: Deploy to production with proper error handling 