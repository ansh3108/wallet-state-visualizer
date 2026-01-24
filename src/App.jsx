import { useState } from 'react'
import './App.css'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { useEffect } from 'react'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getAssociatedTokenAddress } from '@solana/spl-token'


function App() {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [tokenAccounts, setTokenAccounts] = useState([])
  const [ataMap, setAtaMap] = useState({})

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

  useEffect(() => {
    if(!publicKey) return

    const fetchTokenAccounts = async () => {
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      )
      setTokenAccounts(response.value)
    }
    fetchTokenAccounts()   
  }, [publicKey])

  

  useEffect(() => {
  if (!publicKey || tokenAccounts.length === 0) return

  const computeATAs = async () => {
    const map = {}

    for (const ta of tokenAccounts) {
      const info = ta.account.data.parsed?.info
      if (!info) continue

      const expectedAta = await getAssociatedTokenAddress(
        new PublicKey(info.mint),
        publicKey
      )

      map[ta.pubkey.toBase58()] =
        expectedAta.toBase58() === ta.pubkey.toBase58()
    }

    setAtaMap(map)
  }

  computeATAs()
}, [publicKey, tokenAccounts])


  const ownershipGroups = {}

if (accountInfo && publicKey) {
  const owner = accountInfo.owner.toBase58()
  ownershipGroups[owner] = ownershipGroups[owner] || []
  ownershipGroups[owner].push({
    address: publicKey.toBase58(),
    dataSize: accountInfo.data.length,
  })
}

for (const ta of tokenAccounts) {
  const owner = ta.account.owner.toBase58()
  ownershipGroups[owner] = ownershipGroups[owner] || []
  ownershipGroups[owner].push({
    address: ta.pubkey.toBase58(),
    dataSize: ta.account.data.length,
  })
}

  

  return (
    <div style={{ padding: '20px'}}>
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

      {connected && tokenAccounts.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Token Accounts</h2>

          {tokenAccounts.map((ta) => {
            const info = ta.account.data.parsed?.info
            if (!info) return null

            const amount = info.tokenAmount
            const isATA = ataMap[ta.pubkey.toBase58()]
            return (
              <div key={ta.pubkey.toBase58()} style={{ marginBottom: '15px' }}>
                <p><strong>TokenAccount:</strong> {ta.pubkey.toBase58()}</p>
                <p><strong>Mint: </strong> {info.mint}</p>
                <p><strong>Owner (authority):</strong> {info.owner}</p>
                <p><strong>Amount (raw):</strong> {amount.amount}</p>
                <p><strong>Amount (UI):</strong> {amount.uiAmount}</p>
                <p><strong>Decimals:</strong> {amount.decimals}</p>
                <p><strong>Program Owner:</strong> {ta.account.owner.toBase58()}</p>
                <p><strong>Associated Token Account:</strong> {isATA ? "Yes" : "No"}</p>
              </div>
            )
          })}
        </div>
      )}

      

    </div>

    
  )


}

export default App