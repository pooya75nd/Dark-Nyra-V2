import React, { useEffect, useState } from 'react'
import PumpBoard from './components/PumpBoard.jsx'
import AllCoins from './components/AllCoins.jsx'

const DEV_WALLET = 'DqFkaTK8fkxpduK9x68qEVnH9CZqVqMap6WvzqJLVem3';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

async function getSolBalance(pubkey) {
  const resp = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [pubkey],
    }),
  });
  const json = await resp.json();
  const lamports = json?.result?.value ?? 0;
  return lamports / 1e9;
}

const TABS = [
  { key: 'darknyra', title: 'Dark Nyra', render: () => <PumpBoard projectName="Dark Nyra" mint="3w8qd4jrStowiK8LUzAsHhu9L5JbpiyVcMtjSgs1kJg4" wsUrl="wss://pumpportal.fun/api/data" /> },
  { key: 'allcoins', title: 'All Coins', render: () => <AllCoins /> },
]

export default function App() {
  const [active, setActive] = useState(TABS[0])
  const [devBalance, setDevBalance] = useState(null)

  useEffect(()=>{
    let stop = false
    async function loop() {
      try {
        const bal = await getSolBalance(DEV_WALLET)
        if (!stop) setDevBalance(bal)
      } catch(e) {
        // ignore errors
      } finally {
        if (!stop) setTimeout(loop, 30000) // refresh every 30s
      }
    }
    loop()
    return () => { stop = true }
  }, [])

  return (
    <div className="min-h-screen bg-nyra-bg text-nyra-text bg-nyra-hero">
      <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/dark-nyra-logo.png" alt="Dark Nyra" className="h-9 w-9 rounded-nyra border border-white/10" />
          <div>
            <div className="text-xl font-semibold">Dark Nyra • Boards</div>
            <div className="text-xs text-nyra-sub">Neon chaos. Clean gains.</div>
            <div className="text-sm font-bold text-red-500">Dev Balance: {devBalance !== null ? devBalance.toFixed(4) : '—'} SOL</div>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActive(t)} className="nyra-tab">{t.title}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {active.render()}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-10 text-xs text-nyra-sub">
        <div className="flex items-center justify-between">
          <span>© {new Date().getFullYear()} Dark Nyra</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nyra-neon animate-pulse"></span>
            <span>PumpPortal / CoinGecko</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
