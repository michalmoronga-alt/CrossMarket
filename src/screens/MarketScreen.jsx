import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, Loader, X, Check, TrendingUp, Zap, ChevronLeft, ChevronRight, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useItems } from '../hooks/useItems';
import ItemCard from '../components/ItemCard';
import ChangelogModal from '../components/ChangelogModal';
import { getAvatar } from '../utils/avatars';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, getFirestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCoins, formatPercent } from '../utils/formatters';
import { getPins, togglePin } from '../utils/pins';


const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'weapon', label: 'Weapon' },
    { key: 'cabin', label: 'Cabin' },
    { key: 'movement', label: 'Movement' },
];

function useContBeam() {
    const rafRef = useRef(null);
    const stateRef = useRef({ x: -150, dir: 1, speed: 1.8, width: 40, pausing: false, pauseUntil: 0 });
    const [pos, setPos] = useState({ x: -150, width: 40, dir: 1 });

    useEffect(() => {
        const tick = (ts) => {
            const s = stateRef.current;
            if (s.pausing && ts < s.pauseUntil) { rafRef.current = requestAnimationFrame(tick); return; }
            s.pausing = false;
            s.x += s.dir * s.speed;
            const reset = () => {
                s.dir = Math.random() > 0.5 ? 1 : -1;
                s.speed = 1.6 + Math.random() * 2.4;
                s.width = 30 + Math.random() * 50;
                s.x = s.dir === 1 ? -s.width : window.innerWidth + s.width;
                if (Math.random() > 0.5) { s.pausing = true; s.pauseUntil = ts + Math.random() * 1200; }
            };
            if (s.x > window.innerWidth + s.width) reset();
            if (s.x < -s.width) reset();
            setPos({ x: s.x, width: s.width, dir: s.dir });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return pos;
}

function BottomStrip() {
    const { x, width, dir } = useContBeam();
    const canvasRef = useRef(null);
    const trailRef = useRef([]);
    const sizeRef = useRef({ w: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ro = new ResizeObserver(entries => {
            const w = entries[0].contentRect.width;
            canvas.width = w;
            canvas.height = 3;
            sizeRef.current.w = w;
        });
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !sizeRef.current.w) return;
        const ctx = canvas.getContext('2d');

        const head = x + width * 0.5;
        trailRef.current.push({ x: head, opacity: 1.0 });
        if (trailRef.current.length > 28) trailRef.current.shift();
        trailRef.current = trailRef.current.map((p, i, arr) => ({ ...p, opacity: (i + 1) / arr.length }));

        ctx.clearRect(0, 0, canvas.width, 3);

        trailRef.current.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, 1.5, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,180,60,${p.opacity * 0.3})`;
            ctx.fill();
        });

        const grad = ctx.createLinearGradient(x, 0, x + width, 0);
        if (dir === 1) {
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.3, 'rgba(255,130,30,0.5)');
            grad.addColorStop(0.7, 'rgba(255,210,80,1)');
            grad.addColorStop(1, 'rgba(255,255,120,0.9)');
        } else {
            grad.addColorStop(0, 'rgba(255,255,120,0.9)');
            grad.addColorStop(0.3, 'rgba(255,210,80,1)');
            grad.addColorStop(0.7, 'rgba(255,130,30,0.5)');
            grad.addColorStop(1, 'transparent');
        }
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, width, 3);
        ctx.globalAlpha = 1.0;
    }, [x, width, dir]);

    return (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(232,82,10,0.22) 40%, rgba(232,82,10,0.3) 50%, rgba(232,82,10,0.22) 60%, transparent)' }} />
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
    );
}

export default function MarketScreen({ onItemClick, onProfileClick }) {
    const { userProfile, currentUser } = useAuth();
    const { items, loading } = useItems();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [staleItems, setStaleItems] = useState([]);
    const [freshnessError, setFreshnessError] = useState(null);
    const [freshnessLoading, setFreshnessLoading] = useState(false);
    const [dotColor, setDotColor] = useState('#888888');
    const [lastUploadInfo, setLastUploadInfo] = useState(null);
    const [uploadUploaderName, setUploadUploaderName] = useState('');

    // intel stav
    const [intelLoading, setIntelLoading] = useState(true);
    const [topMover, setTopMover] = useState(null);

    const [pinnedIds, setPinnedIds] = useState(() => getPins(currentUser?.uid));
    const [pinToast, setPinToast] = useState(null);

    const [glitch, setGlitch] = useState(false);

    useEffect(() => {
        const glitchTimer = setInterval(() => {
            if (Math.random() > 0.7) {
                setGlitch(true);
                setTimeout(() => setGlitch(false), 120);
            }
        }, 2800);
        return () => { clearInterval(glitchTimer); };
    }, []);

    function handleTogglePin(itemId) {
        if (!currentUser?.uid) return;
        const res = togglePin(currentUser.uid, itemId);
        if (res.error === 'max') {
            setPinToast('Maximálny počet pinov je 5');
            setTimeout(() => setPinToast(null), 2500);
        } else {
            setPinnedIds(res.pins);
        }
    }

    useEffect(() => {
        async function loadDotColor() {
            try {
                const q = query(collection(db, 'uploadLog'), orderBy('timestamp', 'desc'), limit(1));
                const snap = await getDocs(q);
                if (snap.empty) {
                    setDotColor('#888888');
                    return;
                }
                const last = snap.docs[0].data();
                const hoursAgo = (Date.now() - last.timestamp.toMillis()) / 3600000;
                setDotColor(hoursAgo < 6 ? '#22c55e' : hoursAgo <= 12 ? '#f0b429' : '#c0392b');
                setLastUploadInfo(last);

                const uDoc = await getDoc(doc(db, 'users', last.uid));
                setUploadUploaderName(uDoc.exists() ? uDoc.data().displayName : 'Hráč');
            } catch (e) {
                console.error("Failed to fetch last upload log", e);
                setDotColor('#888888');
            }
        }
        loadDotColor();
    }, []);

    useEffect(() => {
        if (!modalVisible) return;

        let cancelled = false;
        async function loadStaleItems() {
            setFreshnessLoading(true);
            setFreshnessError(null);
            try {
                const twelveHoursAgo = new Date(Date.now() - 12 * 3600000);
                const missing = [];
                for (const item of items) {
                    try {
                        const qPrices = query(collection(db, 'items', item.id, 'prices'), orderBy('timestamp', 'desc'), limit(1));
                        const snap = await getDocs(qPrices);
                        if (snap.empty) {
                            missing.push(item);
                        } else {
                            const lastPriceTime = snap.docs[0].data().timestamp?.toMillis?.() || 0;
                            if (lastPriceTime < twelveHoursAgo.getTime()) {
                                missing.push(item);
                            }
                        }
                    } catch (itemErr) {
                        console.error(`Failed to fetch prices for item: ${item.id}`, itemErr);
                    }
                }
                if (!cancelled) setStaleItems(missing);
            } catch (e) {
                console.error("Failed to check missing items", e);
                if (!cancelled) setFreshnessError("Nepodarilo sa načítať — skús znova.");
            } finally {
                if (!cancelled) setFreshnessLoading(false);
            }
        }

        loadStaleItems();

        return () => {
            cancelled = true;
        };
    }, [modalVisible, items]);

    function openFreshnessModal() {
        setModalVisible(true);
    }

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

                // Top Mover 24h
                const moversData = results
                    .filter(r => r.latestPrices.length >= 2)
                    .map(r => {
                        const latestPrice = r.latestPrices[0];
                        const latestSale = latestPrice.sale;

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
                    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

                if (moversData.length > 0) {
                    setTopMover(moversData[0]);
                }

            } catch (error) {
                console.error("Failed to load intel", error);
            } finally {
                if (active) setIntelLoading(false);
            }
        }

        fetchIntel();

        return () => { active = false; };
    }, [items]);

    const filteredItems = useMemo(() => {
        let result = items;

        // Category filter
        if (activeCategory !== 'all') {
            result = result.filter((item) => item.category === activeCategory);
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter((item) => item.name.toLowerCase().includes(q));
        }

        return result;
    }, [items, activeCategory, searchQuery]);

    function handleItemClick(itemId) {
        onItemClick?.(itemId);
    }

    const currentAvatarData = getAvatar(userProfile?.avatarId);
    const AvatarIcon = currentAvatarData.Icon;
    const avatarColor = currentAvatarData.color;

    const isFresh = dotColor === '#22c55e';
    let hoursAgo = null;
    let minutesAgo = null;
    let isRecent = false;
    if (lastUploadInfo && lastUploadInfo.timestamp) {
        hoursAgo = (Date.now() - lastUploadInfo.timestamp.toMillis()) / 3600000;
        minutesAgo = Math.floor((Date.now() - lastUploadInfo.timestamp.toMillis()) / 60000);
        isRecent = minutesAgo < 60;
    }

    return (
        <div className="min-h-screen bg-cx-bg flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 flex justify-between items-center px-4 py-3 border-b border-cx-border bg-cx-bg relative">
                <BottomStrip />

                <div className="flex items-center gap-2 z-10">
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        <div>
                            <span className="text-cx-text" style={{
                                display: 'inline-block',
                                transform: glitch ? `translate(${(Math.random() - 0.5) * 4}px, 0)` : 'none',
                                transition: 'transform 60ms',
                                textShadow: glitch ? '2px 0 #e8520a, -2px 0 #3b82f6' : 'none',
                            }}>CROSS</span>
                            <span className="text-cx-orange">MARKET</span>
                        </div>
                        <span
                            onClick={() => setShowChangelog(true)}
                            className="text-[#e8520a] text-[10px] cursor-pointer hover:bg-cx-orange/20 transition-colors"
                            style={{
                                backgroundColor: 'rgba(232,82,10,0.12)',
                                border: '1px solid rgba(232,82,10,0.3)',
                                letterSpacing: '1px',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                marginLeft: '2px'
                            }}
                        >
                            [v3.0]
                        </span>
                    </h1>

                    {/* Freshness Dot */}
                    <div className="relative flex items-center justify-center cursor-pointer" onClick={openFreshnessModal}>
                        <div
                            className="w-3 h-3 rounded-full z-10"
                            style={{ backgroundColor: dotColor, boxShadow: `0 0 4px ${dotColor}88` }}
                        />
                        {isFresh && (
                            <div
                                className="absolute w-3 h-3 rounded-full animate-ping opacity-75"
                                style={{ backgroundColor: dotColor }}
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 z-10">
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        {[1, 0.6, 0.3, 0.15].map((o, i) => (
                            <div key={i} style={{ width: 2, height: 16 - i * 3, background: '#e8520a', opacity: o, borderRadius: 1 }} />
                        ))}
                    </div>

                    {/* Profile Icon */}
                    <div
                        onClick={onProfileClick}
                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                        style={{ backgroundColor: avatarColor + '22', border: `2px solid ${avatarColor}` }}
                    >
                        <AvatarIcon size={16} color={avatarColor} />
                    </div>
                </div>
            </header>



            {/* Notification strip pre nové dáta (do 60 min) */}
            {isRecent && (
                <div
                    className="w-full flex items-center justify-center py-1.5 px-4 mb-3"
                    style={{ backgroundColor: 'rgba(232, 82, 10, 0.08)', borderBottom: '1px solid rgba(232, 82, 10, 0.2)' }}
                >
                    <div className="flex items-center gap-1.5 text-[11px] text-[#888888]">
                        <ArrowUpCircle size={12} className="text-[#e8520a]" />
                        <span>
                            Nové dáta · <span className="text-[#e8520a] font-medium">{uploadUploaderName || 'Hráč'}</span> · {minutesAgo === 0 ? 'pred menej ako minútou' : `pred ${minutesAgo} min`}
                        </span>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="px-4 mb-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cx-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Hľadaj položku..."
                        className="w-full bg-cx-surface border border-cx-border text-cx-text text-sm pl-9 pr-3 py-2.5 outline-none transition-colors focus:border-cx-orange"
                        style={{ borderRadius: '4px' }}
                    />
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 px-4 mb-4 overflow-x-auto">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${activeCategory === cat.key
                            ? 'bg-cx-orange text-white'
                            : 'bg-cx-surface text-cx-muted border border-cx-border hover:border-cx-orange'
                            }`}
                        style={{ borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif", height: '36px' }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Signal Bar */}
            {!loading && !intelLoading && topMover && (
                <div
                    className="flex flex-row items-center gap-2 mb-3 cursor-pointer"
                    style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a', padding: '8px 16px', fontSize: '13px' }}
                    onClick={() => handleItemClick(topMover.item.id)}
                >
                    <span className="flex items-center gap-1.5 text-cx-muted">
                        <TrendingUp size={14} color="#e8520a" style={{ flexShrink: 0 }} />
                        Najväčší pohyb dnes:
                    </span>
                    <span className="font-bold text-cx-text">{topMover.item.name}</span>
                    <span style={{ color: topMover.changePct > 0 ? '#22c55e' : '#c0392b', fontWeight: 'bold' }}>
                        {topMover.changePct > 0 ? '↑' : '↓'} {Math.abs(topMover.changePct).toFixed(1)}%
                    </span>
                    <span style={{ color: '#888', fontSize: '11px' }}>za 24h</span>
                </div>
            )}

            {/* Item list */}
            <div className="px-4 pb-20">
                {loading ? (
                    // Skeleton cards
                    <>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-cx-surface border border-cx-border p-3 mb-2 animate-pulse flex items-center gap-3" style={{ borderRadius: '4px' }}>
                                <div className="w-16 h-16 bg-cx-bg rounded" style={{ borderRadius: '4px' }} />
                                <div className="flex-1">
                                    <div className="h-4 bg-cx-bg rounded w-32 mb-2" />
                                    <div className="h-3 bg-cx-bg rounded w-24 mb-2" />
                                    <div className="h-3 bg-cx-bg rounded w-40" />
                                </div>
                            </div>
                        ))}
                    </>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-cx-muted">
                        <Package className="mb-2 opacity-50" size={32} />
                        <p style={{ fontFamily: "'Rajdhani', sans-serif" }}>Žiadne položky</p>
                    </div>
                ) : (
                    <>
                        {filteredItems.filter(i => pinnedIds.includes(i.id)).map((item) => (
                            <ItemCard key={item.id} item={item} onClick={handleItemClick} isPinned={true} onTogglePin={handleTogglePin} />
                        ))}

                        {pinnedIds.length > 0 && filteredItems.some(i => pinnedIds.includes(i.id)) && filteredItems.some(i => !pinnedIds.includes(i.id)) && (
                            <div className="flex items-center gap-2 text-[#888888] text-[10px] uppercase tracking-widest font-bold" style={{ margin: '4px 0' }}>
                                <span>Sledované</span>
                                <div className="h-[1px] bg-[#2a2a2a] flex-1" />
                            </div>
                        )}

                        {filteredItems.filter(i => !pinnedIds.includes(i.id)).map((item) => (
                            <ItemCard key={item.id} item={item} onClick={handleItemClick} isPinned={false} onTogglePin={handleTogglePin} />
                        ))}
                    </>
                )}
            </div>

            {/* Freshness Modal */}
            {modalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                        <div className="p-4 border-b border-cx-border/50 flex justify-between items-center bg-black/20">
                            <h2 className="text-lg font-bold text-white tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Aktuálnosť dát</h2>
                            <button onClick={() => setModalVisible(false)} className="text-cx-muted hover:text-white transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 flex flex-col gap-4">
                            <div className="text-sm text-cx-text">
                                {!lastUploadInfo ? (
                                    "Žiadne upload dáta."
                                ) : hoursAgo === null ? (
                                    <div className="flex items-center gap-2"><Loader size={14} className="animate-spin" /> Načítavam...</div>
                                ) : (
                                    <>
                                        <div className="font-bold flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                                            Posledný upload: {hoursAgo < 1 ? "pred menej ako hodinou" : `pred ${Math.round(hoursAgo)} hodinami`}
                                        </div>
                                        <div className="text-cx-muted italic text-xs ml-4">
                                            — uploader: {uploadUploaderName}
                                        </div>
                                    </>
                                )}
                            </div>

                            <hr className="border-[#2a2a2a]" />

                            <div className="flex flex-col gap-2">
                                <h3 className="text-sm font-bold text-cx-muted uppercase tracking-wider" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    Položky bez záznamu za posledných 12h
                                </h3>

                                {freshnessError ? (
                                    <div className="text-sm font-bold text-red-500 py-2">
                                        {freshnessError}
                                    </div>
                                ) : freshnessLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-cx-muted py-2"><Loader size={16} className="animate-spin text-cx-orange" /> Analyzujem ceny...</div>
                                ) : staleItems.length > 0 ? (
                                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {staleItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-black/20 p-2 rounded border border-[#2a2a2a]">
                                                <span className="text-sm font-bold text-gray-300" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{item.name}</span>
                                                <span className="text-[10px] text-cx-muted uppercase tracking-wider bg-black/30 px-1.5 py-0.5 rounded">{item.category}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-green-500 font-bold bg-green-500/10 p-3 rounded border border-green-500/20">
                                        <Check size={16} className="shrink-0" /> Všetky položky majú aktuálne dáta
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                                <button
                                    onClick={() => alert("Funkcia bude dostupná čoskoro")}
                                    className="w-full py-2.5 bg-cx-orange/10 border border-cx-orange/30 text-cx-orange rounded font-bold transition-colors hover:bg-cx-orange hover:text-white uppercase tracking-wider text-sm"
                                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                >
                                    Požiadať o update
                                </button>
                                <button
                                    onClick={() => setModalVisible(false)}
                                    className="w-full py-2.5 bg-[#2a2a2a] text-white rounded font-bold transition-colors hover:bg-[#333333] uppercase tracking-wider text-sm"
                                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                >
                                    Zavrieť
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Changelog Modal */}
            {showChangelog && (
                <ChangelogModal onClose={() => setShowChangelog(false)} />
            )}

            {/* Pin Toast */}
            {pinToast && (
                <div
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white"
                    style={{ border: '1px solid #e8520a', padding: '10px 20px', borderRadius: '8px', zIndex: 50, fontFamily: "'Rajdhani', sans-serif" }}
                >
                    {pinToast}
                </div>
            )}
        </div>
    );
}
