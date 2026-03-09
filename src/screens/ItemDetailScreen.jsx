import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import {
    LineChart,
    Line,
    Area,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getItem } from '../services/items';
import { getPrices } from '../services/prices';
import { getUser } from '../services/users';
import { getEventsForItem } from '../services/marketEvents';
import { formatCoins, formatPercent, proxyImageUrl } from '../utils/formatters';

const EVENT_COLORS = {
    crafting: '#22c55e',
    battlepass: '#3b82f6',
    event: '#14b8a6',
    patch: '#e8520a',
    availability: '#8b5cf6'
};

export default function ItemDetailScreen({ itemId, onBack }) {
    const [item, setItem] = useState(null);
    const [prices, setPrices] = useState([]);
    const [users, setUsers] = useState({}); // { uid: displayName }
    const [marketEvents, setMarketEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('30d'); // '7d' | '30d' | 'all'
    const [visibleCount, setVisibleCount] = useState(10);
    const [activeTooltip, setActiveTooltip] = useState(null); // id of card showing tooltip
    const tooltipTimerRef = useRef(null);
    const chartContainerRef = useRef(null);
    const [chartDims, setChartDims] = useState(null);
    useEffect(() => {
        if (!chartContainerRef.current) return;
        const ro = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setChartDims({ width, height });
        });
        ro.observe(chartContainerRef.current);
        return () => ro.disconnect();
    }, [loading]);

    useEffect(() => {
        if (!itemId) return;
        getEventsForItem(itemId).then(setMarketEvents).catch(console.error);
    }, [itemId]);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            setLoading(true);
            try {
                const [itemData, pricesData] = await Promise.all([
                    getItem(itemId),
                    getPrices(itemId, 100),
                ]);

                if (cancelled) return;
                setItem(itemData);
                setPrices(pricesData);

                // Fetch user display names for history
                const uidsToFetch = new Set(
                    pricesData.map((p) => p.addedBy).filter((uid) => uid && uid !== 'seed')
                );

                const newUsers = { ...users };
                for (const uid of uidsToFetch) {
                    if (!newUsers[uid]) {
                        const u = await getUser(uid);
                        if (u) newUsers[uid] = u.displayName || 'Hráč';
                    }
                }
                if (!cancelled) setUsers(newUsers);

            } catch (err) {
                console.error('Error fetching details:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchData();
        return () => { cancelled = true; };
    }, [itemId]);

    const filteredPrices = useMemo(() => {
        if (!prices.length) return [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        let limitTime = 0;
        if (timeFilter === '7d') limitTime = now - 7 * dayMs;
        else if (timeFilter === '30d') limitTime = now - 30 * dayMs;

        // prices are sorted desc by timestamp, we filter out old ones
        return prices.filter((p) => {
            const pTime = p.timestamp?.toMillis?.() || p.timestamp || now;
            return pTime >= limitTime;
        });
    }, [prices, timeFilter]);

    const chartData = useMemo(() => {
        // Recharts needs data sorted ascending by time (oldest first)
        const sorted = [...filteredPrices].reverse();
        return sorted.map((p) => {
            const dateObj = new Date(p.timestamp?.toMillis?.() || p.timestamp || Date.now());
            return {
                date: dateObj.getTime(),
                dateStr: `${dateObj.getDate()}.${dateObj.getMonth() + 1}`,
                sale: p.sale,
                purchase: p.purchase,
                spread: (p.purchase != null && p.sale != null) ? p.purchase - p.sale : null,
            };
        });
    }, [filteredPrices]);

    // Min/Max indexy pre SALE čiaru
    const { minIdx, maxIdx } = useMemo(() => {
        if (chartData.length === 0) return { minIdx: -1, maxIdx: -1 };
        let minI = 0, maxI = 0;
        for (let i = 1; i < chartData.length; i++) {
            if (chartData[i].sale != null) {
                if (chartData[minI].sale == null || chartData[i].sale < chartData[minI].sale) minI = i;
                if (chartData[maxI].sale == null || chartData[i].sale > chartData[maxI].sale) maxI = i;
            }
        }
        return { minIdx: minI, maxIdx: maxI };
    }, [chartData]);

    function renderMinMaxDot(props) {
        const { cx, cy, index } = props;
        if (index === minIdx) {
            return <circle cx={cx} cy={cy} r={4} fill="#c0392b" stroke="#0d0d0d" strokeWidth={2} />;
        }
        if (index === maxIdx) {
            return <circle cx={cx} cy={cy} r={4} fill="#22c55e" stroke="#0d0d0d" strokeWidth={2} />;
        }
        return null;
    }

    function renderSkeleton() {
        return (
            <div className="min-h-screen bg-cx-bg animate-pulse">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-cx-border bg-cx-bg">
                    <div className="w-6 h-6 bg-cx-surface rounded" />
                    <div className="h-6 w-32 bg-cx-surface rounded" />
                </div>
                <div className="p-4">
                    <div className="flex gap-4 mb-6">
                        <div className="w-24 h-24 bg-cx-surface rounded flex-shrink-0" />
                        <div className="flex-1">
                            <div className="h-6 w-3/4 bg-cx-surface rounded mb-2" />
                            <div className="h-4 w-1/2 bg-cx-surface rounded mb-4" />
                            <div className="h-8 w-2/3 bg-cx-surface rounded mb-1" />
                            <div className="h-4 w-1/3 bg-cx-surface rounded" />
                        </div>
                    </div>
                    <div className="h-48 bg-cx-surface rounded" />
                </div>
            </div>
        );
    }

    if (loading || !item) return renderSkeleton();

    // Najnovšia cena (prvá v prices, lebo firebase default sort je desc)
    const currentPrice = prices[0] || { sale: null, purchase: null };
    const spread = currentPrice.purchase && currentPrice.sale
        ? currentPrice.purchase - currentPrice.sale
        : 0;
    const spreadPercent = currentPrice.sale > 0 ? spread / currentPrice.sale : 0;

    const categoryLabels = {
        weapon: 'Weapon',
        cabin: 'Cabin',
        movement: 'Movement',
    };

    // --- METRIKY ---
    const latest = prices[0];
    let metrics = {
        change7d: '—',
        change7dPct: '—',
        min30d: '—',
        max30d: '—',
        vol30d: '—',      // volatility: (max-min)/avg %
        trendColor: '#888888'
    };
    let lastUpdateStr = '';

    if (latest) {
        const now = Date.now();
        const prices7d = prices.filter(p => now - (p.timestamp?.toMillis?.() || p.timestamp || now) < 7 * 24 * 3600000);
        const sales7d = prices7d.map(p => p.sale).filter(s => s != null);

        if (sales7d.length > 0) {
            const avg7d = sales7d.reduce((a, b) => a + b, 0) / sales7d.length;
            if (latest.sale != null) {
                const diff = latest.sale - avg7d;
                metrics.change7d = Math.round(diff);
                metrics.change7dPct = ((diff / avg7d) * 100).toFixed(2);
                if (diff > 0) metrics.trendColor = '#22c55e';
                else if (diff < 0) metrics.trendColor = '#c0392b';
                else metrics.trendColor = '#888888';
            }
        }

        const prices30d = prices.filter(p => now - (p.timestamp?.toMillis?.() || p.timestamp || now) < 30 * 24 * 3600000);
        const sales30d = prices30d.map(p => p.sale).filter(s => s != null);
        if (sales30d.length > 0) {
            const min30 = Math.min(...sales30d);
            const max30 = Math.max(...sales30d);
            const avg30 = sales30d.reduce((a, b) => a + b, 0) / sales30d.length;
            metrics.min30d = min30;
            metrics.max30d = max30;
            metrics.vol30d = avg30 > 0 ? ((max30 - min30) / avg30 * 100).toFixed(1) : '—';
        }

        const d = new Date(latest.timestamp?.toMillis?.() || latest.timestamp || Date.now());
        const dateStr = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        let who = '—';
        if (latest.addedBy === 'seed') who = 'seed';
        else if (users[latest.addedBy]) who = users[latest.addedBy];
        else who = 'Hráč';
        lastUpdateStr = `${dateStr} — ${who}`;
    }

    const showTooltip = (id) => {
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        setActiveTooltip(id);
        tooltipTimerRef.current = setTimeout(() => setActiveTooltip(null), 3000);
    };

    const MetricCard = ({ id, label, value, colorClass, description }) => {
        const isActive = activeTooltip === id;
        return (
            <div
                onClick={() => showTooltip(id)}
                style={{
                    backgroundColor: '#1a1a1a',
                    border: `1px solid ${isActive ? '#444' : '#2a2a2a'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '58px',
                    transition: 'border-color 0.2s',
                }}
            >
                {/* Normal view */}
                <div style={{ opacity: isActive ? 0 : 1, transition: 'opacity 0.2s' }}>
                    <div style={{ fontSize: '10px', color: '#888888', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {label} <span style={{ fontSize: 9, color: '#555' }}>ⓘ</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: "'Rajdhani', sans-serif" }} className={colorClass}>
                        {value}
                    </div>
                </div>
                {/* Tooltip overlay */}
                {isActive && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: '#1a1a1a',
                        padding: '8px 10px',
                        display: 'flex', alignItems: 'center',
                        animation: 'fadeIn 0.15s ease',
                    }}>
                        <p style={{ fontSize: '11px', color: '#c0c0c0', lineHeight: 1.4, margin: 0 }}>{description}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-cx-bg overflow-y-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-cx-border bg-cx-bg">
                <button onClick={onBack} className="p-1 -ml-1 text-cx-text hover:text-cx-orange transition-colors cursor-pointer">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {item.name}
                </h1>
            </div>

            {/* Info sekcia */}
            <div className="p-4 flex gap-4 border-b border-cx-border">
                {/* Obrázok */}
                <div className="w-24 h-24 flex-shrink-0 bg-cx-surface border border-cx-border flex items-center justify-center rounded">
                    {item.imageUrl ? (
                        <img
                            src={proxyImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <Package size={32} className="text-cx-muted" />
                    )}
                </div>

                {/* Ceny */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-cx-text leading-tight truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {item.name}
                    </h2>
                    <p className="text-cx-muted text-sm mt-0.5 mb-3">
                        {categoryLabels[item.category] || item.category}
                        {item.power ? ` · P${item.power}` : ''}
                    </p>

                    <div className="flex gap-6 mb-1">
                        <div>
                            <p className="text-cx-muted text-xs font-medium uppercase tracking-wider mb-0.5">Sale</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-bold text-cx-gold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {currentPrice.sale ? formatCoins(currentPrice.sale) : '—'}
                                </span>
                                {metrics.change7d !== '—' && (
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                                        style={{
                                            backgroundColor: `${metrics.trendColor}33`, // 20% opacity
                                            color: metrics.trendColor
                                        }}
                                    >
                                        {metrics.change7d > 0 ? '▲' : metrics.change7d < 0 ? '▼' : ''}
                                        {metrics.change7d > 0 ? '+' : ''}{metrics.change7dPct}%
                                    </span>
                                )}
                                <span className="text-cx-gold text-xs">●</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-cx-muted text-xs font-medium uppercase tracking-wider mb-0.5">Purchase</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-bold text-cx-gold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    {currentPrice.purchase ? formatCoins(currentPrice.purchase) : '—'}
                                </span>
                                <span className="text-cx-gold text-xs">●</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-cx-muted text-sm mt-2">
                        Spread: {formatCoins(spread)} ({formatPercent(spreadPercent)})
                    </p>
                </div>
            </div>

            {/* Metriky a Last Update */}
            <div className="p-4 border-b border-cx-border">
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <MetricCard
                        id="change7d"
                        label="ZMENA 7D"
                        value={metrics.change7d !== '—'
                            ? `${metrics.change7d > 0 ? '+' : ''}${formatCoins(metrics.change7d).replace('●', '').trim()} / ${metrics.change7d > 0 ? '+' : ''}${metrics.change7dPct}%`
                            : '—'
                        }
                        colorClass={metrics.change7d > 0 ? 'text-[#22c55e]' : metrics.change7d < 0 ? 'text-[#c0392b]' : 'text-[#888888]'}
                        description="Zmena predajnej ceny za posledných 7 dní oproti priemeru tohto obdobia. Kladná = cena rastie, záporná = cena klesá."
                    />
                    <MetricCard
                        id="vol30d"
                        label="VOLATILITA 30D"
                        value={metrics.vol30d !== '—' ? `${metrics.vol30d}%` : '—'}
                        colorClass={metrics.vol30d !== '—' && parseFloat(metrics.vol30d) > 20 ? 'text-[#f0b429]' : 'text-[#e0e0e0]'}
                        description="Miera kolísania ceny za 30 dní: (MAX−MIN)/priemer. Nízka = stabilný item, vysoká = väčšie obchodné príležitosti aj riziko."
                    />
                    <MetricCard
                        id="min30d"
                        label="MIN 30D"
                        value={metrics.min30d !== '—' ? formatCoins(metrics.min30d) : '—'}
                        colorClass="text-[#c0392b]"
                        description="Najnižšia zaznamenaná predajná cena za posledných 30 dní. Dobrý indikátor nákupného dna."
                    />
                    <MetricCard
                        id="max30d"
                        label="MAX 30D"
                        value={metrics.max30d !== '—' ? formatCoins(metrics.max30d) : '—'}
                        colorClass="text-[#22c55e]"
                        description="Najvyššia zaznamenaná predajná cena za posledných 30 dní. Indikuje potenciálny predajný strop."
                    />
                </div>
                {lastUpdateStr && (
                    <div className="text-xs text-[#888888] italic">
                        Posledná aktualizácia: {lastUpdateStr}
                    </div>
                )}
            </div>

            {/* Časové filtre */}
            <div className="p-4">
                <div className="flex gap-2 mb-4">
                    {[
                        { key: '7d', label: '7D' },
                        { key: '30d', label: '30D' },
                        { key: 'all', label: 'ALL' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setTimeFilter(f.key)}
                            className={`flex-1 py-1.5 text-sm font-bold transition-colors cursor-pointer rounded ${timeFilter === f.key
                                ? 'bg-cx-orange text-white'
                                : 'bg-cx-surface text-cx-muted border border-cx-border hover:border-cx-orange'
                                }`}
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Graf + Event Timeline Strip */}
                <div className="mb-4" style={{ height: '240px' }}>
                    {chartData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-cx-muted text-sm border border-cx-border border-dashed rounded bg-cx-surface">
                            Žiadne dáta pre graf
                        </div>
                    ) : (
                        <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 12 }}>
                                    <defs>
                                        <linearGradient id="gradSale" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#e8520a" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#e8520a" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="gradPurchase" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f0b429" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#f0b429" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        type="number"
                                        domain={['dataMin', 'dataMax']}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return `${d.getDate()}.${d.getMonth() + 1}`;
                                        }}
                                        stroke="#888888"
                                        tick={{ fontSize: 10, fill: '#888888' }}
                                        tickMargin={8}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        tick={{ fontSize: 10, fill: '#888888' }}
                                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                                        axisLine={false}
                                        tickLine={false}
                                        width={40}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 4 }}
                                        labelStyle={{ color: '#e0e0e0', marginBottom: '8px', fontWeight: 'bold' }}
                                        itemStyle={{ fontSize: '13px', paddingTop: '4px' }}
                                        formatter={(value, name) => [formatCoins(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                                        labelFormatter={(label) => {
                                            const d = new Date(label);
                                            return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '14px' }} iconType="circle" iconSize={7} />

                                    <Area type="monotone" dataKey="sale" stroke="#e8520a" fill="url(#gradSale)" strokeWidth={2} dot={renderMinMaxDot} activeDot={{ r: 6 }} name="Sale" isAnimationActive={false} />
                                    <Area type="monotone" dataKey="purchase" stroke="#f0b429" fill="url(#gradPurchase)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 6 }} name="Purchase" isAnimationActive={false} />


                                </ComposedChart>
                            </ResponsiveContainer>

                            {/* EventTimeline SVG Overlay — positioned absolutely over the chart */}
                            {marketEvents.length > 0 && chartData.length >= 2 && chartDims && (() => {
                                // Match ComposedChart margin exactly
                                const MARGIN = { top: 5, right: 10, left: 0, bottom: 12 };
                                const Y_AXIS_W = 40;   // matches width={40} on YAxis
                                const X_AXIS_H = 30;   // XAxis ticks area height (approx)
                                const LEGEND_H = 30;   // legend height below chart

                                const plotLeft = Y_AXIS_W;
                                const plotRight = chartDims.width - MARGIN.right;
                                const plotWidth = plotRight - plotLeft;

                                // Y=0 is at the bottom of the plot area, above XAxis and Legend
                                const plotBottom = chartDims.height - MARGIN.bottom - X_AXIS_H - LEGEND_H;

                                const timeMin = chartData[0].date;
                                const timeMax = chartData[chartData.length - 1].date;
                                const range = timeMax - timeMin;
                                if (range <= 0) return null;

                                const stripH = 14; // tall enough for small text
                                const stripY = plotBottom - stripH; // flush with Y=0 line

                                return (
                                    <svg
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none',
                                            overflow: 'visible',
                                        }}
                                    >
                                        {marketEvents.map(evt => {
                                            const tsStart = evt.startDate?.toMillis?.() || (evt.startDate?.seconds ? evt.startDate.seconds * 1000 : null) || evt.startDate;
                                            const tsEnd = evt.endDate
                                                ? (evt.endDate.toMillis?.() || (evt.endDate.seconds ? evt.endDate.seconds * 1000 : null) || evt.endDate)
                                                : Date.now();

                                            if (!tsStart) return null;

                                            const xStart = plotLeft + ((tsStart - timeMin) / range) * plotWidth;
                                            const xEnd = plotLeft + ((tsEnd - timeMin) / range) * plotWidth;

                                            const left = Math.max(xStart, plotLeft);
                                            const right = Math.min(xEnd, plotRight);

                                            if (left >= right) return null;

                                            const segW = Math.max(right - left, 4);
                                            const color = EVENT_COLORS[evt.type] || '#888';
                                            const label = evt.type?.toUpperCase() || '';

                                            return (
                                                <g key={evt.id}>
                                                    <rect
                                                        x={left}
                                                        y={stripY}
                                                        width={segW}
                                                        height={stripH}
                                                        fill={color}
                                                        fillOpacity={1}
                                                        rx={2}
                                                    />
                                                    {/* Label text — only show if segment is wide enough */}
                                                    {segW > 30 && (
                                                        <text
                                                            x={left + segW / 2}
                                                            y={stripY + stripH - 3}
                                                            textAnchor="middle"
                                                            fontSize={8}
                                                            fontWeight="bold"
                                                            fontFamily="'Rajdhani', sans-serif"
                                                            fill="rgba(0,0,0,0.75)"
                                                            style={{ userSelect: 'none' }}
                                                        >
                                                            {label}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>
                                );
                            })()}

                        </div>
                    )}
                </div>

                {/* Event Strip */}
                {marketEvents.length > 0 && (
                    <div className="mt-2 mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-cx-muted mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>EVENTY</h3>
                        <div className="flex flex-col gap-2">
                            {marketEvents.map(evt => {
                                const color = EVENT_COLORS[evt.type] || '#888';
                                const now = Date.now();
                                const startDate = evt.startDate?.toDate?.();
                                const endDate = evt.endDate?.toDate?.();
                                const startStr = startDate ? `${startDate.getDate()}.${startDate.getMonth() + 1}.` : '';
                                const endStr = endDate ? `${endDate.getDate()}.${endDate.getMonth() + 1}.` : null;
                                const isActive = !endDate || endDate.getTime() >= now;
                                const dateRange = endStr ? `${startStr} – ${endStr}` : `od ${startStr}`;

                                return (
                                    <div
                                        key={evt.id}
                                        style={{
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #2a2a2a',
                                            borderLeft: `4px solid ${color}`,
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        {/* Type badge */}
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                textTransform: 'uppercase',
                                                fontWeight: 700,
                                                color: color,
                                                backgroundColor: `${color}26`,
                                                borderRadius: '9999px',
                                                padding: '2px 8px',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {evt.type}
                                        </span>

                                        {/* Label + active dot */}
                                        <span className="flex items-center gap-1.5 text-sm min-w-0" style={{ color: '#e0e0e0' }}>
                                            {isActive && (
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0, display: 'inline-block' }} />
                                            )}
                                            <span className="truncate">{evt.label}</span>
                                        </span>

                                        {/* Date range */}
                                        <span className="ml-auto text-xs flex-shrink-0" style={{ color: '#888888' }}>
                                            {dateRange}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* História tabuľka */}
                <h3 className="text-lg font-bold text-cx-text mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>HISTÓRIA</h3>

                <div className="bg-cx-surface border border-cx-border rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-cx-border/50 text-cx-muted text-xs">
                            <tr>
                                <th className="px-3 py-1.5 font-medium">Dátum</th>
                                <th className="px-3 py-1.5 font-medium">Purchase</th>
                                <th className="px-3 py-1.5 font-medium">Kto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cx-border">
                            {prices.slice(0, visibleCount).map((p) => {
                                const d = p.timestamp?.toDate?.() || new Date(p.timestamp?.toMillis?.() || p.timestamp || Date.now());
                                const dateStr = d ? `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '—';

                                let who = '—';
                                if (p.addedBy === 'seed') who = <span className="text-cx-muted/70">seed</span>;
                                else if (users[p.addedBy]) who = users[p.addedBy];

                                return (
                                    <tr key={p.id} className="hover:bg-cx-border/30 transition-colors">
                                        <td className="px-3 py-1.5 text-cx-muted">{dateStr}</td>
                                        <td className="px-3 py-1.5 text-cx-text font-medium whitespace-nowrap">{formatCoins(p.purchase)}</td>
                                        <td className="px-3 py-1.5 text-cx-text truncate max-w-[80px]" title={typeof who === 'string' ? who : 'seed'}>
                                            {who}
                                        </td>
                                    </tr>
                                );
                            })}
                            {prices.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="px-3 py-6 text-center text-cx-muted">
                                        Žiadna história cien
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {prices.length > visibleCount && (
                    <button
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="w-full mt-4 py-3 text-sm font-bold rounded border transition-colors cursor-pointer"
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderColor: '#2a2a2a',
                            color: '#888888',
                            fontFamily: "'Rajdhani', sans-serif"
                        }}
                    >
                        Načítať ďalších 10
                    </button>
                )}
            </div>
        </div>
    );
}
