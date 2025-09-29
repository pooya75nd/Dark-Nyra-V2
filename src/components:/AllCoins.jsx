import React, { useState } from 'react'
import CoinSearch from './CoinSearch.jsx'
import GeckoBoard from './GeckoBoard.jsx'

export default function AllCoins(){
  const [coin, setCoin] = useState(null)
  return (
    <div className="space-y-4">
      <CoinSearch onSelect={(c)=>setCoin(c)} />
      {coin && <GeckoBoard geckoId={coin.id} symbol={coin.symbol.toUpperCase()} projectName={coin.name} />}
    </div>
  )
}
