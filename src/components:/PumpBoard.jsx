import React, { useEffect, useRef, useState } from 'react'

export default function PumpBoard({ projectName = 'Dark Nyra', mint, wsUrl = 'wss://pumpportal.fun/api/data' }) {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [trades, setTrades] = useState([]);
  const [candlesMap] = useState(() => new Map());
  const [lastPrice, setLastPrice] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { createChart } = await import('lightweight-charts');
      if (cancelled) return;
      const el = chartRef.current;
      const chart = createChart(el, {
        layout: { background: { type: 'solid', color: '#0b0e1a' }, textColor: '#e6e6ff' },
        grid: { horzLines: { color: 'rgba(255,255,255,0.06)' }, vertLines: { color: 'rgba(255,255,255,0.06)' } },
        rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: 'rgba(255,255,255,0.1)' },
        width: el.clientWidth, height: 340,
      });
      const s = chart.addCandlestickSeries({ upColor: 'rgba(58,255,176,1)', downColor: 'rgba(255,92,135,1)', borderVisible: false, wickVisible: true });
      seriesRef.current = s;
      const onResize = () => chart.applyOptions({ width: el.clientWidth });
      window.addEventListener('resize', onResize);
      return () => { window.removeEventListener('resize', onResize); chart.remove(); };
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mint) return;
    setStatus('connecting ws');
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      setStatus('connected'); setConnected(true);
      ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [mint] }));
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.channel === 'tokenTrade' && msg.data) {
          const d = msg.data;
          const tsMs = d.ts || Date.now();
          const price = Number(d.price);
          setLastPrice(price);
          setTrades((t) => [{ ts: tsMs, price, size: d.size, side: d.side, tx: d.tx }, ...t].slice(0, 250));

          const k = Math.floor((tsMs/1000)/60)*60;
          const c = candlesMap.get(k);
          if (!c) { const candle = { time: k, open: price, high: price, low: price, close: price }; candlesMap.set(k,candle); seriesRef.current?.update(candle); }
          else { c.high = Math.max(c.high, price); c.low = Math.min(c.low, price); c.close = price; seriesRef.current?.update(c); }
        }
      } catch (e) { /* ignore */ }
    };
    ws.onerror = () => setStatus('ws error');
    ws.onclose = () => { setStatus('ws closed'); setConnected(false); };
    return () => { try { ws.close(); } catch(e){} };
  }, [mint]);

  return (
    <div className="rounded-nyra bg-nyra-panel/70 backdrop-blur border border-white/5 shadow-nyra-inner">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <div className="text-sm text-nyra-sub uppercase tracking-wider">{projectName}</div>
          <div className="text-xl font-semibold">Live Board — {mint.slice(0,8)}...{mint.slice(-6)}</div>
        </div>
        <div className="text-sm">Price: <span className="font-semibold">{lastPrice ?? '—'}</span></div>
      </div>
      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-8 nyra-card p-3">
          <div ref={chartRef} style={{height:340}} />
        </div>
        <div className="col-span-4 nyra-card p-3">
          <div className="text-xs text-nyra-sub">Status</div>
          <div className="mt-2 text-sm space-y-1">
            <div>WS: <span className="font-medium">{connected ? 'connected' : 'disconnected'}</span></div>
            <div>State: <span className="font-medium">{status}</span></div>
            <div>Trades stored: <span className="font-medium">{trades.length}</span></div>
            <a className="nyra-btn mt-2 inline-block text-center" href={`https://pump.fun/coin/${mint}`} target="_blank" rel="noreferrer">Open in Pump.fun</a>
          </div>
        </div>
        <div className="col-span-12 nyra-card p-3">
          <div className="text-xs text-nyra-sub">Trade Tape</div>
          <ul className="text-sm max-h-48 overflow-auto mt-2 space-y-1">
            {trades.slice(0,60).map((t,i)=> (
              <li key={i} className={`flex justify-between ${t.side==='buy'? 'text-green-300':'text-rose-300'}`}>
                <span className="text-xs">{new Date(t.ts).toLocaleTimeString()}</span>
                <span className="mx-2">{t.size}</span>
                <span className="font-medium">{t.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
