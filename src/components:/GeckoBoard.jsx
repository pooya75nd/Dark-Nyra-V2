import React, { useEffect, useRef, useState } from 'react'

export default function GeckoBoard({ geckoId, symbol='USD', projectName }){
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [price, setPrice] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(()=>{
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
      const s = chart.addCandlestickSeries({ upColor:'rgba(58,255,176,1)', downColor:'rgba(255,92,135,1)', borderVisible:false, wickVisible:true });
      seriesRef.current = s;
      const onResize=()=>chart.applyOptions({width: el.clientWidth});
      window.addEventListener('resize', onResize);
      return () => { window.removeEventListener('resize', onResize); chart.remove(); };
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(()=>{
    const controller = new AbortController();
    async function load(){
      try {
        setStatus('loading');
        const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=1&interval=minute`;
        const r = await fetch(url, { signal: controller.signal });
        const data = await r.json();
        const prices = data?.prices || [];
        if (!prices.length) throw new Error('No data');
        const buckets = new Map();
        for (const [ms, p] of prices){
          const t = Math.floor(ms/1000);
          const k = Math.floor(t/60)*60;
          const v = (buckets.get(k) || { time:k, open:p, high:p, low:p, close:p });
          v.high = Math.max(v.high, p); v.low = Math.min(v.low, p); v.close = p;
          if (!buckets.has(k)) v.open = p;
          buckets.set(k, v);
        }
        const candles = Array.from(buckets.values()).sort((a,b)=>a.time-b.time);
        if (candles.length) setPrice(candles[candles.length-1].close);
        seriesRef.current?.setData(candles);
        setStatus('ok');
      } catch(e){
        setStatus('error');
      }
    }
    load();
    const id = setInterval(load, 60000);
    return ()=>{ controller.abort(); clearInterval(id); };
  }, [geckoId]);

  return (
    <div className="rounded-nyra bg-nyra-panel/70 backdrop-blur border border-white/5 shadow-nyra-inner mt-4">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <div className="text-sm text-nyra-sub uppercase tracking-wider">{projectName || geckoId}</div>
          <div className="text-xl font-semibold">{symbol} — Market Board</div>
        </div>
        <div className="text-sm">Price: <span className="font-semibold">{price ?? '—'}</span></div>
      </div>
      <div className="grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 nyra-card p-3">
          <div ref={chartRef} style={{height:340}} />
        </div>
      </div>
      <div className="px-4 pb-4 text-xs text-nyra-sub">Source: CoinGecko (public API)</div>
    </div>
  )
}
