# USDT-INR Escrow Program

> See this [doc](https://solmeet.gen3.network/notes/intro-to-anchor) for more implementation details

## Overview

This is a modified version of the Anchor Escrow program that supports USDT sellers and INR buyers with off-chain INR payment confirmation. The program allows for secure escrow transactions where USDT is held until INR payment is confirmed off-chain.

### Key Features

- **USDT Seller**: Deposits USDT into an escrow vault
- **INR Buyer**: Confirms INR payment has been made off-chain
- **Seller Confirmation**: Seller releases USDT to buyer after payment confirmation
- **Escrow Cancellation**: Seller can cancel escrow before completion

### Escrow Workflow

1. **Initialize**: USDT seller creates escrow and deposits USDT
2. **Confirm Payment**: INR buyer confirms off-chain payment
3. **Release USDT**: Seller releases USDT to buyer after payment confirmation
4. **Cancel**: Seller can cancel escrow anytime before completion

## 📁 Project Structure

```
anchor-escrow/
├── programs/                 # Solana program source code
├── tests/                   # Program tests
├── client/                  # Client-side implementation
│   ├── escrow-operations.js # Vanilla JS escrow operations
│   ├── escrow-demo.html     # Interactive web demo
│   ├── CLIENT_USAGE_GUIDE.md # Client integration guide
│   ├── FRONTEND_EXAMPLE.md  # React frontend example
│   └── README.md           # Client documentation
├── target/                  # Build artifacts
├── Anchor.toml             # Anchor configuration
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## 🚀 Client-Side Implementation

For client-side integration and frontend development, see the [`client/`](./client/) folder which contains:

- **Vanilla JavaScript Implementation**: Complete escrow operations in `escrow-operations.js`
- **Interactive Demo**: Web-based demo in `escrow-demo.html`
- **React Example**: Frontend implementation guide in `FRONTEND_EXAMPLE.md`
- **Usage Guide**: Comprehensive client integration guide in `CLIENT_USAGE_GUIDE.md`

### Quick Client Start
```bash
# Open the interactive demo
open client/escrow-demo.html

# Or integrate the JavaScript functions
<script src="client/escrow-operations.js"></script>
```

## Install, Build, Deploy and Test

### Option 1: Using Docker (Recommended)

The easiest way to build and test this project is using the official Solana Foundation Anchor Docker image.

#### Prerequisites

- Docker installed on your system
- At least 8GB RAM recommended for comfortable development

#### Pull the Docker Image

```bash
docker pull solanafoundation/anchor:v0.31.1
```

#### Build the Project

```bash
# Build the program
docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor build
```

#### Deploy to Devnet

```bash
# Deploy the program
docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor deploy
```

#### Run Tests

```bash
# Run tests
docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor test --skip-deploy --skip-build --skip-local-validator
```

#### Other Useful Commands

```bash
# Check program ID
docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor keys list

# Install dependencies (if needed)
docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 yarn install

# Check Anchor version
docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor --version
```

### Option 2: Local Installation

If you prefer to install Anchor locally, follow these steps:

#### Install `anchor`

First, make sure that `anchor` is installed:

Install `avm`:

```bash
$ cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

Install Anchor version 0.31.1:

```bash
$ avm install 0.31.1
$ avm use 0.31.1
```

> If you haven't installed `cargo`, please refer to this [doc](https://book.solmeet.dev/notes/solana-starter-kit#install-rust-and-solana-cli) for installation steps.

#### Extra Dependencies on Linux (Optional)

You may have to install some extra dependencies on Linux (ex. Ubuntu):

```bash
$ sudo apt-get update && sudo apt-get upgrade && sudo apt-get install -y pkg-config build-essential libudev-dev
```

#### Verify the Installation

Check if Anchor is successfully installed:

```bash
$ anchor --version
anchor-cli 0.31.1
```

#### Install Dependencies

```bash
$ yarn install
```

#### Build the Project

```bash
$ anchor build
```

#### Deploy to Devnet

```bash
$ anchor deploy
```

#### Run Tests

```bash
$ anchor test --skip-deploy --skip-build --skip-local-validator
```

## Program Structure

### Escrow State

```rust
pub struct Escrow {
    pub seed: u64,                    // Unique identifier
    pub bump: u8,                     // PDA bump
    pub seller: Pubkey,               // USDT seller
    pub buyer: Pubkey,                // INR buyer
    pub usdt_mint: Pubkey,            // USDT mint address
    pub usdt_amount: u64,             // Amount of USDT
    pub inr_amount: u64,              // Amount of INR (off-chain)
    pub is_paid: bool,                // INR payment confirmed
    pub is_completed: bool,           // USDT released to buyer
}
```

### Instructions

1. **`initialize`**: Create escrow and deposit USDT
2. **`confirm_payment`**: Buyer confirms INR payment
3. **`release_usdt`**: Seller releases USDT to buyer
4. **`cancel`**: Seller cancels escrow
5. **`exchange`**: Legacy token-to-token exchange (backward compatibility)

## Configuration

The project is configured for devnet deployment with the following settings:

- **Program ID**: `3MS2fGZYpUG8BdTg1s1RzBbJyQe18foqAx9Y1AbBcAdW`
- **Cluster**: devnet
- **Anchor Version**: 0.31.1

## Security Features

- Only the seller can cancel the escrow
- Only the buyer can confirm payment
- Only the seller can release USDT (after payment confirmation)
- USDT is held in a PDA vault until released
- All transfers use `transfer_checked` for safety

## Memory Requirements

For Docker usage:
- **Minimum RAM**: 4GB
- **Recommended RAM**: 8-16GB
- **Storage**: 20-50GB free space
- **CPU**: 4+ cores recommended

## Troubleshooting

### Version Compatibility Issues

If you encounter version compatibility warnings, ensure all dependencies are using the same version:

- Anchor CLI: 0.31.1
- anchor-lang: 0.31.1
- anchor-spl: 0.31.1
- @coral-xyz/anchor: 0.31.1

### Build Issues

If you encounter build errors:

1. Clean the build cache: `docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor clean`
2. Rebuild: `docker run --rm -v $(pwd):/app -w /app solanafoundation/anchor:v0.31.1 anchor build`

### Node.js Version Issues

If you encounter Node.js version compatibility issues with yarn, the Docker approach is recommended as it includes the correct Node.js version.
