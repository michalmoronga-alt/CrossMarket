import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, TrendingUp, Activity } from 'lucide-react';
import { useItems } from '../hooks/useItems';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCoins } from '../utils/formatters';

export default function SignalScreen({ onItemClick }) {
    const { items, loading: itemsLoading } = useItems();

    // intel stav
    const [intelLoading, setIntelLoading] = useState(true);
    const [top7dMovers, setTop7dMovers] = useState([]);
    const [topMovers, setTopMovers] = useState([]);
    const [top30dMovers, setTop30dMovers] = useState([]);
    const [intelView, setIntelView] = useState(0); // 0=24h, 1=7d, 2=30d

    // Market Intel Load
    useEffect(() => {
        let active = true;

        async function fetchIntel() {
            try {
                if (items.length === 0) return;

                // Získanie posledných cien pre každý item
                const pricePromises = items.map(async (item) => {
                    const qPrices = query(collection(db, 'items', item.id, 'prices'), orderBy('timestamp', 'desc'), limit(100));
                    const snap = await getDocs(qPrices);
                    const latestPrices = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                    return { item, latestPrices };
                });

                const results = await Promise.all(pricePromises);

                if (!active) return;

                const now = Date.now();
                const ms24h = 24 * 3600000;
                const ms7d = 7 * 24 * 3600000;

                // 1. Top 7D Movers
                const movers7dData = results
                    .filter(r => r.latestPrices.length >= 2)
                    .map(r => {
                        const latestPrice = r.latestPrices[0];
                        const latestSale = latestPrice.sale;

                        let sale7dAgo = null;
                        for (let i = r.latestPrices.length - 1; i >= 1; i--) {
                            const pTime = r.latestPrices[i].timestamp?.toMillis?.() || 0;
                            if (now - pTime < ms7d && r.latestPrices[i].sale) {
                                sale7dAgo = r.latestPrices[i].sale;
                                break;
                            }
                        }

                        if (!latestSale || !sale7dAgo) return null;

                        const changePct = ((latestSale - sale7dAgo) / sale7dAgo) * 100;
                        return { item: r.item, changePct, latestSale };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
                    .slice(0, 3);

                setTop7dMovers(movers7dData);

                // 2. Top Movers 24h
                const moversData = results
                    .filter(r => r.latestPrices.length >= 2)
                    .map(r => {
                        const latestPrice = r.latestPrices[0];
                        const latestSale = latestPrice.sale;

                        // Nájdeme najstarší záznam za posledných 24 hodín
                        // Postupujeme od najnovšieho k staršiemu (sú zoradené desc)
                        let sale24hAgo = null;
                        for (let i = r.latestPrices.length - 1; i >= 1; i--) {
                            const pTime = r.latestPrices[i].timestamp?.toMillis?.() || 0;
                            if (now - pTime < ms24h && r.latestPrices[i].sale) {
                                sale24hAgo = r.latestPrices[i].sale;
                                break;
                            }
                        }

                        if (!latestSale || !sale24hAgo) return null;

                        const changePct = ((latestSale - sale24hAgo) / sale24hAgo) * 100;
                        return { item: r.item, changePct, latestSale };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
                    .slice(0, 3);

                setTopMovers(moversData);

                // 3. Top Movers 30d
                const ms30d = 30 * 24 * 3600000;
                const movers30dData = results
                    .filter(r => r.latestPrices.length >= 2)
                    .map(r => {
                        const latestPrice = r.latestPrices[0];
                        const latestSale = latestPrice.sale;

                        let sale30dAgo = null;
                        for (let i = r.latestPrices.length - 1; i >= 1; i--) {
                            const pTime = r.latestPrices[i].timestamp?.toMillis?.() || 0;
                            if (now - pTime < ms30d && r.latestPrices[i].sale) {
                                sale30dAgo = r.latestPrices[i].sale;
                                break;
                            }
                        }

                        if (!latestSale || !sale30dAgo) return null;

                        const changePct = ((latestSale - sale30dAgo) / sale30dAgo) * 100;
                        return { item: r.item, changePct, latestSale };
                    })
                    .filter(Boolean)
                    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
                    .slice(0, 3);

                setTop30dMovers(movers30dData);

            } catch (error) {
                console.error("Failed to load intel", error);
            } finally {
                if (active) setIntelLoading(false);
            }
        }

        fetchIntel();

        return () => { active = false; };
    }, [items]);

    function handleItemClick(itemId) {
        onItemClick?.(itemId);
    }

    if (itemsLoading) {
        return (
            <div className="min-h-screen bg-cx-bg flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-cx-orange border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cx-bg">
            {/* Header */}
            <header className="sticky top-0 z-20 flex justify-center items-center px-4 py-4 border-b border-cx-border bg-cx-bg shadow-sm">
                <h1 className="text-xl font-bold tracking-widest text-[#e8520a] uppercase flex items-center gap-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    <Activity size={20} />
                    SIGNAL
                </h1>
            </header>

            <div className="px-4 mt-6">
                <h3 className="text-cx-muted text-xs uppercase tracking-[0.2em] font-bold mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    Trhové Pohyby
                </h3>

                {intelLoading ? (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 animate-pulse">
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-5 w-5 bg-[#2a2a2a] rounded"></div>
                            <div className="h-5 w-32 bg-[#2a2a2a] rounded"></div>
                            <div className="h-5 w-5 bg-[#2a2a2a] rounded"></div>
                        </div>
                        <div className="flex justify-center gap-1.5 mb-4">
                            <div className="w-2 h-2 rounded-full bg-[#2a2a2a]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#2a2a2a]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#2a2a2a]"></div>
                        </div>
                        <div className="space-y-3 min-h-[140px]">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="h-10 bg-[#2a2a2a] rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col">
                        {/* Header s navigáciou */}
                        <div className="flex items-center justify-between mb-3 text-cx-text">
                            <button onClick={() => setIntelView(v => Math.max(0, v - 1))} disabled={intelView === 0} className={`p-1 ${intelView === 0 ? 'text-[#2a2a2a]' : 'text-cx-muted hover:text-white transition-colors cursor-pointer'}`}>
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                {intelView === 0 ? <Zap size={16} className="text-cx-muted" /> : <TrendingUp size={16} className="text-cx-muted" />}
                                <h4 className="font-bold text-sm tracking-widest uppercase text-center min-w-[130px]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {intelView === 0 ? 'Top Movers 24H' : intelView === 1 ? 'Top Movers 7D' : 'Top Movers 30D'}
                                </h4>
                            </div>
                            <button onClick={() => setIntelView(v => Math.min(2, v + 1))} disabled={intelView === 2} className={`p-1 ${intelView === 2 ? 'text-[#2a2a2a]' : 'text-cx-muted hover:text-white transition-colors cursor-pointer'}`}>
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Bodková navigácia */}
                        <div className="flex justify-center gap-1.5 mb-4">
                            {[0, 1, 2].map(v => (
                                <button key={v} onClick={() => setIntelView(v)} className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${intelView === v ? 'bg-cx-orange' : 'bg-[#2a2a2a]'}`} />
                            ))}
                        </div>

                        {/* Obsah karty */}
                        <div className="flex flex-col gap-3 min-h-[140px]">
                            {(() => {
                                const currentMovers = intelView === 0 ? topMovers : (intelView === 1 ? top7dMovers : top30dMovers);
                                const labelStr = intelView === 0 ? '24h' : (intelView === 1 ? '7 dní' : '30 dní');

                                if (currentMovers.length > 0) {
                                    return currentMovers.map(({ item, changePct, latestSale }) => {
                                        const isPositive = changePct > 0;
                                        const colorClass = isPositive ? 'text-green-500' : (changePct < 0 ? 'text-red-500' : 'text-gray-400');
                                        const arrow = isPositive ? '↑' : (changePct < 0 ? '↓' : '');

                                        return (
                                            <div key={item.id} className="flex justify-between items-center cursor-pointer hover:bg-[#2a2a2a] p-1 -m-1 rounded transition-colors" onClick={() => handleItemClick(item.id)}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-300" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{item.name}</span>
                                                    <span className="text-[10px] text-cx-muted uppercase tracking-wider">{formatCoins(latestSale)}</span>
                                                </div>
                                                <span className={`text-sm font-bold ${colorClass}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                                    {arrow} {Math.abs(changePct).toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    });
                                } else {
                                    return (
                                        <div className="text-sm text-cx-muted flex items-center justify-center h-full">Nedostatok dát — potrebné 2+ záznamy za {labelStr}</div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
