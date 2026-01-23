import { useState } from 'react'
import './App.css'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { useEffect } from 'react'


function App() {
  const { publicKey, connected } = useWallet()
  const [systemAccount, setSystemAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)

  const connection = new Connection(clusterApiUrl('devnet'));

  useEffect(() => {
    if(!publicKey) return 

    const fetchSystemAccount = async () => {
      const info = await connection.getAccountInfo(publicKey)
      const lamports = await connection.getBalance(publicKey)

      setAccountInfo(info)
      setBalance(lamports)
    }

    fetchSystemAccount()
  }, [publicKey])

  return (
    <div style={{ padding: '20px '}}>
      <h1>Wallet State Visualizer</h1>

      <WalletMultiButton />

      {connected && accountInfo && (
        <div style={{ marginTop: '20px' }}>
          <h2>System Account</h2>

          <p><strong>Account address:</strong>{publicKey.toBase58()}</p>
          <p><strong>Owner Program:</strong>{accountInfo.owner.toBase58()}</p>
          <p><strong>Lamports: </strong>{balance}</p>
          <p><strong>SOL: </strong>{balance / 1_000_000_000}</p>
          <p><strong>Data Size:</strong>{accountInfo.data.length} bytes</p>   
        </div>
      )}
    </div>
  )


}

export default App