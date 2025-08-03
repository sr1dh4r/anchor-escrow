# Frontend Example for USDT-INR Escrow

This example shows how to create a simple web interface for users to interact with your deployed escrow program.

## Quick Start Frontend

### 1. Create React App

```bash
npx create-react-app escrow-frontend --template typescript
cd escrow-frontend
npm install @solana/web3.js @coral-xyz/anchor @solana/wallet-adapter-react @solana/wallet-adapter-base @solana/wallet-adapter-wallets
```

### 2. Basic Frontend Component

```tsx
// App.tsx
import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import EscrowInterface from './components/EscrowInterface';

require('@solana/wallet-adapter-react-ui/styles.css');

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <header>
              <h1>USDT-INR Escrow Platform</h1>
              <WalletMultiButton />
            </header>
            <EscrowInterface />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
```

### 3. Escrow Interface Component

```tsx
// components/EscrowInterface.tsx
import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

const PROGRAM_ID = new PublicKey("3MS2fGZYpUG8BdTg1s1RzBbJyQe18foqAx9Y1AbBcAdW");
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");

interface EscrowInterfaceProps {}

const EscrowInterface: React.FC<EscrowInterfaceProps> = () => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [escrows, setEscrows] = useState<any[]>([]);
  
  // Form states
  const [buyerAddress, setBuyerAddress] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [inrAmount, setInrAmount] = useState('');
  const [selectedEscrow, setSelectedEscrow] = useState<string>('');

  const createEscrow = async () => {
    if (!publicKey || !buyerAddress || !usdtAmount || !inrAmount) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const buyer = new PublicKey(buyerAddress);
      const seed = Math.floor(Math.random() * 1000000);
      
      // Generate PDAs
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("state"), new anchor.BN(seed).toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );
      
      const sellerUsdtAta = getAssociatedTokenAddressSync(USDT_MINT, publicKey);
      const buyerUsdtAta = getAssociatedTokenAddressSync(USDT_MINT, buyer);
      
      // Create transaction
      const transaction = new anchor.web3.Transaction();
      
      // Add initialize instruction
      const initializeIx = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: buyer, isSigner: false, isWritable: false },
          { pubkey: USDT_MINT, isSigner: false, isWritable: false },
          { pubkey: sellerUsdtAta, isSigner: false, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: buyerUsdtAta, isSigner: false, isWritable: true },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([/* instruction data */])
      };
      
      transaction.add(initializeIx);
      
      const signature = await connection.sendTransaction(transaction, [/* wallet */]);
      console.log('Escrow created:', signature);
      
      // Reset form
      setBuyerAddress('');
      setUsdtAmount('');
      setInrAmount('');
      
    } catch (error) {
      console.error('Error creating escrow:', error);
      alert('Failed to create escrow');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!publicKey || !selectedEscrow) {
      alert('Please select an escrow');
      return;
    }

    setLoading(true);
    try {
      const escrowPda = new PublicKey(selectedEscrow);
      
      // Create confirm payment transaction
      const transaction = new anchor.web3.Transaction();
      
      const confirmIx = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
        ],
        data: Buffer.from([/* instruction data */])
      };
      
      transaction.add(confirmIx);
      
      const signature = await connection.sendTransaction(transaction, [/* wallet */]);
      console.log('Payment confirmed:', signature);
      
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const releaseUsdt = async () => {
    if (!publicKey || !selectedEscrow) {
      alert('Please select an escrow');
      return;
    }

    setLoading(true);
    try {
      const escrowPda = new PublicKey(selectedEscrow);
      
      // Create release USDT transaction
      const transaction = new anchor.web3.Transaction();
      
      const releaseIx = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: USDT_MINT, isSigner: false, isWritable: false },
          { pubkey: getAssociatedTokenAddressSync(USDT_MINT, publicKey), isSigner: false, isWritable: true },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([/* instruction data */])
      };
      
      transaction.add(releaseIx);
      
      const signature = await connection.sendTransaction(transaction, [/* wallet */]);
      console.log('USDT released:', signature);
      
    } catch (error) {
      console.error('Error releasing USDT:', error);
      alert('Failed to release USDT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="escrow-interface">
      <div className="create-escrow">
        <h2>Create New Escrow</h2>
        <div>
          <input
            type="text"
            placeholder="Buyer Address"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="USDT Amount"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="INR Amount"
            value={inrAmount}
            onChange={(e) => setInrAmount(e.target.value)}
          />
        </div>
        <button onClick={createEscrow} disabled={loading}>
          {loading ? 'Creating...' : 'Create Escrow'}
        </button>
      </div>

      <div className="escrow-actions">
        <h2>Escrow Actions</h2>
        <select value={selectedEscrow} onChange={(e) => setSelectedEscrow(e.target.value)}>
          <option value="">Select Escrow</option>
          {escrows.map((escrow, index) => (
            <option key={index} value={escrow.pda}>
              Escrow {index + 1} - {escrow.usdtAmount} USDT
            </option>
          ))}
        </select>
        
        <div className="action-buttons">
          <button onClick={confirmPayment} disabled={loading || !selectedEscrow}>
            {loading ? 'Confirming...' : 'Confirm Payment'}
          </button>
          <button onClick={releaseUsdt} disabled={loading || !selectedEscrow}>
            {loading ? 'Releasing...' : 'Release USDT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EscrowInterface;
```

### 4. CSS Styling

```css
/* App.css */
.App {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.escrow-interface {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.create-escrow, .escrow-actions {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.create-escrow div, .escrow-actions div {
  margin-bottom: 15px;
}

input, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons button {
  flex: 1;
}
```

### 5. Package.json Dependencies

```json
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.31.1",
    "@solana/spl-token": "^0.4.8",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.34",
    "@solana/wallet-adapter-wallets": "^0.19.23",
    "@solana/web3.js": "^1.87.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

## Usage Flow

1. **Connect Wallet**: User connects their Solana wallet
2. **Create Escrow**: Seller enters buyer address, USDT amount, and INR amount
3. **Confirm Payment**: Buyer confirms off-chain payment was made
4. **Release USDT**: Seller releases USDT to buyer
5. **Cancel**: Seller can cancel escrow if needed

## Next Steps

1. **Add Error Handling**: Implement proper error messages
2. **Add Loading States**: Show loading indicators
3. **Add Transaction History**: Display past transactions
4. **Add Account Validation**: Validate wallet connections
5. **Add USDT Balance Check**: Verify sufficient USDT balance
6. **Add Network Selection**: Support different Solana networks
7. **Add Mobile Responsiveness**: Make it mobile-friendly

This provides a basic foundation for users to interact with your escrow program through a web interface! 