# Mint Page Setup Guide

## Overview

The mint page has been updated to use **Reown AppKit** (formerly WalletConnect) instead of ThirdWeb for wallet connectivity and contract interactions. This provides better compatibility with various wallets and a more standardized approach to Web3 integration.

## Quick Start

### 1. Get a Reown Project ID

1. Visit [https://cloud.reown.com/](https://cloud.reown.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### 2. Set Environment Variable

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
# Reown (formerly WalletConnect) Project ID for wallet connection
VITE_REOWN_PROJECT_ID=your_project_id_here

# Legacy name is also supported:
# VITE_WC_PROJECT_ID=your_project_id_here
```

### 3. Run the Development Server

```bash
npm install
npm run dev
```

The mint page will be available at `http://localhost:3000/mint.html`

## Technical Details

### Technology Stack

- **Wallet Connection**: Reown AppKit (WalletConnect v2)
- **Contract Interaction**: Wagmi Core + Viem
- **Supported Wallets**: MetaMask, Coinbase Wallet, WalletConnect, and 300+ other wallets

### Contract Details

- **Network**: Somnia Testnet (Chain ID: 50312)
- **RPC URL**: https://dream-rpc.somnia.network
- **Contract Address**: 0x442CA6391F9a8201737cFC186ebC00b7ace0DB03
- **Function**: `claimTo(address to, uint256 quantity)`

### Key Features

1. **Multi-Wallet Support**: Automatically supports all WalletConnect-compatible wallets
2. **Network Switching**: Automatically prompts users to switch to Somnia Testnet
3. **Transaction Tracking**: Shows transaction status and hash after minting
4. **Error Handling**: Clear error messages for common issues

## Troubleshooting

### "Error: Wallet modal not initialized"

This means the `VITE_REOWN_PROJECT_ID` environment variable is not set. Follow the setup steps above to configure it.

### Wallet Won't Connect

1. Ensure you have a Web3 wallet installed (MetaMask, Coinbase Wallet, etc.)
2. Check that your wallet is unlocked
3. Make sure you're on the correct network (Somnia Testnet)

### Transaction Fails

1. Ensure you have enough SOMI tokens for gas
2. Check that the contract address is correct
3. Verify the network configuration

## Development Notes

### File Structure

- `mint.html` - The mint page UI
- `mint.js` - Wallet connection and contract interaction logic
- `.env.example` - Template for environment variables

### Migration from ThirdWeb

The previous ThirdWeb implementation has been completely replaced with:
- Reown AppKit for wallet connection modal
- Wagmi Core for state management and contract writes
- Viem for low-level Ethereum interactions

### Custom Chain Configuration

The Somnia Testnet is configured as a custom chain:

```javascript
const somniaTestnet = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOMI',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
}
```

## Resources

- [Reown Documentation](https://docs.reown.com/appkit/javascript/core/installation)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Somnia Network](https://somnia.network/)
