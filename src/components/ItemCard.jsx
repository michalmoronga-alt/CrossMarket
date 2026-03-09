import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, Minus, Pin } from 'lucide-react';
import { getPrices } from '../services/prices';
import { formatCoins, formatPercent, proxyImageUrl } from '../utils/formatters';

export default function ItemCard({ item, onClick, isPinned, onTogglePin }) {
    const [trend, setTrend] = useState(null); // { direction, percent, sale, purchase }
    const [trendLoaded, setTrendLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function loadTrend() {
            try {
                const prices = await getPrices(item.id, 2);
                if (cancelled) return;

                if (prices.length === 0) {
                    setTrend({ direction: 'none', percent: 0, sale: null, purchase: null });
                } else if (prices.length === 1) {
                    setTrend({
                        direction: 'none',
                        percent: 0,
                        sale: prices[0].sale,
                        purchase: prices[0].purchase,
                    });
                } else {
                    // prices[0] = newest, prices[1] = older
                    const newest = prices[0];
                    const older = prices[1];
                    const change = older.sale > 0
                        ? (newest.sale - older.sale) / older.sale
                        : 0;

                    let direction = 'flat';
                    if (change > 0.001) direction = 'up';
                    else if (change < -0.001) direction = 'down';

                    setTrend({
                        direction,
                        percent: change,
                        sale: newest.sale,
                        purchase: newest.purchase,
                    });
                }
            } catch (err) {
                console.error('Failed to load prices for', item.id, err);
                setTrend({ direction: 'none', percent: 0, sale: null, purchase: null });
            }
            setTrendLoaded(true);
        }
        loadTrend();
        return () => { cancelled = true; };
    }, [item.id]);

    const categoryLabels = {
        weapon: 'Weapon',
        cabin: 'Cabin',
        movement: 'Movement',
        module: 'Module',
    };

    function renderTrend() {
        if (!trendLoaded) return <span className="text-cx-muted text-xs">...</span>;
        if (!trend || trend.direction === 'none') return <span className="text-cx-muted text-xs">—</span>;
        if (trend.direction === 'up') {
            return (
                <span className="flex items-center gap-0.5 text-xs" style={{ color: '#22c55e' }}>
                    <TrendingUp size={14} />
                    {formatPercent(trend.percent)}
                </span>
            );
        }
        if (trend.direction === 'down') {
            return (
                <span className="flex items-center gap-0.5 text-xs text-cx-red">
                    <TrendingDown size={14} />
                    {formatPercent(trend.percent)}
                </span>
            );
        }
        return (
            <span className="flex items-center gap-0.5 text-xs text-cx-muted">
                <Minus size={14} />
                0%
            </span>
        );
    }

    const categoryBorder = {
        weapon: 'border-l-cx-red',
        cabin: 'border-l-[#3b82f6]',
        movement: 'border-l-[#22c55e]',
        module: 'border-l-[#8b5cf6]',
    };

    return (
        <div
            onClick={() => onClick(item.id)}
            className={`relative bg-cx-surface border border-cx-border border-l-4 ${categoryBorder[item.category] || 'border-l-cx-border'} ${isPinned ? 'border-t-2 border-t-[#e8520a]' : ''} rounded cursor-pointer hover:border-r-cx-orange hover:border-t-cx-orange hover:border-b-cx-orange transition-colors duration-150 p-3 mb-2 flex items-center gap-3 shadow-sm`}
        >
            {/* Pin Button */}
            {onTogglePin && (
                <div
                    className="absolute top-2 right-2 p-1 cursor-pointer transition-transform hover:scale-110"
                    onClick={(e) => { e.stopPropagation(); onTogglePin(item.id); }}
                >
                    <Pin size={14} className={isPinned ? 'text-[#e8520a]' : 'text-[#888888]'} fill={isPinned ? 'currentColor' : 'none'} />
                </div>
            )}

            {/* Image */}
            <div className="w-16 h-16 flex-shrink-0 bg-cx-bg border border-cx-border flex items-center justify-center" style={{ borderRadius: '4px' }}>
                {item.imageUrl ? (
                    <img
                        src={proxyImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '4px' }}
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <Package size={24} className="text-cx-muted" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className={`flex items-start justify-between gap-2 ${onTogglePin ? 'pr-6' : ''}`}>
                    <h3 className="font-bold text-cx-text truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {item.name}
                    </h3>
                    <div className="flex-shrink-0 mt-0.5">
                        {renderTrend()}
                    </div>
                </div>

                <p className="text-cx-muted text-xs mt-0.5">
                    {categoryLabels[item.category] || item.category}
                    {item.power ? ` · Power ${formatCoins(item.power)}` : ''}
                </p>

                {/* Prices */}
                <div className="flex gap-4 mt-1.5">
                    <div className="flex items-center gap-1">
                        <span className="text-cx-muted text-xs uppercase">Sale</span>
                        <span className="text-cx-text text-sm font-medium">
                            {trend?.sale != null ? formatCoins(trend.sale) : '—'}
                        </span>
                        <span className="text-cx-gold text-xs">●</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-cx-muted text-xs uppercase">Buy</span>
                        <span className="text-cx-text text-sm font-medium">
                            {trend?.purchase != null ? formatCoins(trend.purchase) : '—'}
                        </span>
                        <span className="text-cx-gold text-xs">●</span>
                    </div>
                </div>
            </div >
        </div >
    );
}
