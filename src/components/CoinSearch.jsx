import React, { useEffect, useMemo, useState } from 'react'

export default function CoinSearch({ onSelect }){
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('idle')

  useEffect(()=>{
    let abort = false
    async function load(){
      try {
        setStatus('loading')
        const r = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=false')
        const data = await r.json()
        if (!abort) { setList(data); setStatus('ok') }
      } catch(e){
        if (!abort) setStatus('error')
      }
    }
    load()
    return ()=>{ abort = true }
  }, [])

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase()
    if (!s) return list.slice(0, 200)
    return list.filter(c => c.id.includes(s) || c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)).slice(0, 200)
  }, [q, list])

  return (
    <div className="nyra-card p-3">
      <div className="text-sm text-nyra-sub mb-2">Search any coin (CoinGecko)</div>
      <input className="nyra-input" placeholder="Search by name, symbol, id…" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="text-xs text-nyra-sub mt-2">Showing {filtered.length} / {list.length} coins</div>
      <ul className="max-h-72 overflow-auto mt-2">
        {filtered.map(c => (
          <li key={c.id} className="flex justify-between py-1 border-b border-white/5 last:border-none">
            <div className="text-sm">{c.name} <span className="text-nyra-sub">({c.symbol.toUpperCase()})</span></div>
            <button onClick={()=>onSelect(c)} className="nyra-tab">Open</button>
          </li>
        ))}
      </ul>
      {status==='loading' && <div className="mt-2 text-xs text-nyra-sub">Loading list…</div>}
      {status==='error' && <div className="mt-2 text-xs text-rose-300">Error loading list (API limit). Try again later.</div>}
    </div>
  )
}
