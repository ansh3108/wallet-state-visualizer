import { Buffer } from 'buffer'
import process from 'process'

window.Buffer = Buffer
window.process = process

import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import '@solana/wallet-adapter-react-ui/styles.css'
import { clusterApiUrl } from '@solana/web3.js'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'



const endpoint = clusterApiUrl('devnet');
const wallets = [new PhantomWalletAdapter()];

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect={false}>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
  </StrictMode>

)