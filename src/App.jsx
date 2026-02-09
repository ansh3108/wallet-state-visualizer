import { useState, useMemo } from 'react'
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
  const [network, setNetwork] = useState("devnet")
  const [loadingSystem, setLoadingSystem] = useState(false)
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [loadingATAs, setLoadingATAs] = useState(false)

  const [error, setError] = useState(null)

  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const connection = useMemo(() => new Connection(endpoint), [endpoint])

  const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert("Copied!")
  } catch {
    alert("Copy failed")
  }
}

  useEffect(() => {
    if(!publicKey) return 

    const fetchSystemAccount = async () => {
    setLoadingSystem(true)
    setError(null)

    try {
      const info = await connection.getAccountInfo(publicKey)
      const lamports = await connection.getBalance(publicKey)

      setAccountInfo(info)
      setBalance(lamports)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch system account")
    }

    setLoadingSystem(false)
  }

    fetchSystemAccount()
  }, [publicKey, connection])

  useEffect(() => {
    if(!publicKey) return

    const fetchTokenAccounts = async () => {
    setLoadingTokens(true)
    setError(null)

    try {
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      )

      setTokenAccounts(response.value)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch token accounts")
    }

    setLoadingTokens(false)
  }

    fetchTokenAccounts()   
  }, [publicKey, connection])

  

  useEffect(() => {
  if (!publicKey || tokenAccounts.length === 0){
    setAtaMap({})
    return
  }

  const computeATAs = async () => {
    setLoadingATAs(true)
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
    setLoadingATAs(false)
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

const refreshAll = async() => {
  if(!publicKey) return 

  setAccountInfo(null)
  setBalance(null)
  setTokenAccounts(null)
  setAtaMap({})

  setLoadingSystem(true)
  setLoadingTokens(true)

  try {
    const info = await connection.getAccountInfo(publicKey)
    const lamports = await connection.getBalance(publicKey)

    setAccountInfo(info)
    setBalance(lamports)

    const response = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    )
    setTokenAccounts(response.value)
  } catch (err) {
    console.error(err)
    setError("Refresh Failed")
  }

  setLoadingSystem(false)
  setLoadingTokens(false)
}

  

  return (
    <div style={{ padding: '20px'}}>
      <h1>Wallet State Visualizer</h1>

      <WalletMultiButton />

      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
        style={{ marginLeft: "10px", padding: "8px "}}
      >
        <option value="devnet">Devnet</option>
        <option value="mainnet-beta">Mainnet</option>
      </select>

      <button
        onClick={refreshAll}
        disabled={!connected}
        style={{ marginLeft: "10px", padding: "8px" }}
      >Refresh</button>

      {error && (
        <p style={{ color:"red", marginTop: "15px" }}>
          {error}
        </p>
      )}

       {connected && (
        <div style={{ marginTop: '20px' }}>
          <h2>System Account</h2>

          {loadingSystem ? (
            <p>Loading system account...</p>
          ) : accountInfo ? (
            <>
              <p>
                <strong>Account address:</strong> {publicKey.toBase58()}
                <button onClick={() => copyText(publicKey.toBase58())}> Copy</button>
              </p>

              <p>
                <strong>Owner Program:</strong> {accountInfo.owner.toBase58()}
                <button onClick={() => copyText(accountInfo.owner.toBase58())}> Copy</button>
              </p>

              <p><strong>Lamports:</strong> {balance}</p>
              <p><strong>SOL:</strong> {balance / 1_000_000_000}</p>
              <p><strong>Data Size:</strong> {accountInfo.data.length} bytes</p>
            </>
          ) : (
            <p>No system account data found.</p>
          )}
        </div>
      )}

      {connected && (
        <div style={{ marginTop: '30px' }}>
          <h2>Token Accounts</h2>

          {loadingTokens ? (
            <p>Loading token accounts...</p>
          ) : tokenAccounts.length === 0 ? (
            <p>No SPL token accounts found.</p>
          ) : (
            <>
              {loadingATAs && <p>Detecting ATAs...</p>}

              {tokenAccounts.map((ta) => {
                const info = ta.account.data.parsed?.info
                if (!info) return null

                const amount = info.tokenAmount
                const isATA = ataMap[ta.pubkey.toBase58()]

                return (
                  <div key={ta.pubkey.toBase58()} style={{ marginBottom: '15px' }}>
                    <p>
                      <strong>Token Account:</strong> {ta.pubkey.toBase58()}
                      <button onClick={() => copyText(ta.pubkey.toBase58())}> Copy</button>
                    </p>

                    <p>
                      <strong>Mint:</strong> {info.mint}
                      <button onClick={() => copyText(info.mint)}> Copy</button>
                    </p>

                    <p><strong>Owner (authority):</strong> {info.owner}</p>
                    <p><strong>Amount (raw):</strong> {amount.amount}</p>
                    <p><strong>Amount (UI):</strong> {amount.uiAmount}</p>
                    <p><strong>Decimals:</strong> {amount.decimals}</p>
                    <p><strong>Program Owner:</strong> {ta.account.owner.toBase58()}</p>
                    <p><strong>Associated Token Account:</strong> {isATA ? "Yes" : "No"}</p>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {connected && Object.keys(ownershipGroups).length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2>Ownership Breakdown</h2>

          {Object.entries(ownershipGroups).map(([owner, accounts]) => (
            <div key={owner} style={{ marginBottom: "20px" }}>
              <p>
                <strong>Owner Program:</strong> {owner}
                <button onClick={() => copyText(owner)}> Copy</button>
              </p>

              <p><strong>Accounts owned:</strong> {accounts.length}</p>

              {accounts.map((acc) => (
                <p key={acc.address}>
                  {acc.address} — {acc.dataSize} bytes
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: "40px", opacity: 0.6 }}>
        Wallet State Visualizer {network}
      </p>

      

    </div>

    
  )


}

export default App