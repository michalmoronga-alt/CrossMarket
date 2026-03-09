import { useState, useEffect } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getAvatar, avatarIcons } from '../utils/avatars';
import RoleBadge from '../components/RoleBadge';
import { addTrade, getUserTrades, closeTrade } from '../services/trades';
import { getItems } from '../services/items';
import { getPrices } from '../services/prices';

export default function ProfileScreen({ onBack }) {
    const { currentUser, userProfile, logout } = useAuth();

    // States — profil
    const [uploadCount, setUploadCount] = useState(0);
    const [name, setName] = useState(userProfile?.displayName ?? '');
    const [avatarId, setAvatarId] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [nameFeedback, setNameFeedback] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // States — trades
    const [trades, setTrades] = useState([]);
    const [items, setItems] = useState([]);
    const [tradesLoading, setTradesLoading] = useState(true);
    const [showTradeForm, setShowTradeForm] = useState(false);
    const [closingTradeId, setClosingTradeId] = useState(null);
    const [closingPrice, setClosingPrice] = useState('');
    const [currentPrices, setCurrentPrices] = useState({});
    const [editingTradeId, setEditingTradeId] = useState(null);
    const [editForm, setEditForm] = useState({ boughtAt: '', targetSell: '', note: '' });
    const [tradeForm, setTradeForm] = useState({ itemId: '', boughtAt: '', targetSell: '', note: '' });

    useEffect(() => {
        if (userProfile?.displayName) setName(userProfile.displayName);
        if (userProfile?.avatarId) setAvatarId(userProfile.avatarId);

        async function fetchUploadStats() {
            if (!currentUser?.uid) return;
            try {
                const q = query(collection(db, 'uploadLog'), where('uid', '==', currentUser.uid));
                const snap = await getDocs(q);
                setUploadCount(snap.size);
            } catch (err) {
                console.error('Failed to fetch upload stats:', err);
            }
        }
        fetchUploadStats();
    }, [currentUser, userProfile]);

    useEffect(() => {
        if (!currentUser) return;
        async function loadData() {
            setTradesLoading(true);

            // 1. Load items (dropdown) - independent
            try {
                const itemData = await getItems();
                setItems(itemData);
                console.log('ITEMS:', itemData);
            } catch (err) {
                console.error("Failed to load items:", err);
            }

            // 2. Load trades - independent
            try {
                const tradeData = await getUserTrades(currentUser.uid);
                setTrades(tradeData);

                // 3. Load prices for open trades
                const priceMap = {};
                await Promise.all(
                    tradeData.filter(t => t.status === 'open').map(async t => {
                        try {
                            const prices = await getPrices(t.itemId, 1);
                            if (prices.length) priceMap[t.itemId] = prices[0].sale;
                        } catch (pErr) {
                            console.error(`Failed to load price for ${t.itemId}:`, pErr);
                        }
                    })
                );
                setCurrentPrices(priceMap);
            } catch (err) {
                console.error("Failed to load trades (Check Firestore Indexes):", err);
            } finally {
                setTradesLoading(false);
            }
        }
        loadData();
    }, [currentUser]);

    const hasNameChanged = name !== userProfile?.displayName;

    async function handleAvatarChange(id) {
        if (avatarId === id) return;
        setAvatarId(id);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { avatarId: id });
        } catch (err) {
            console.error('Failed to update avatar:', err);
            alert('Nepodarilo sa aktualizovať avatar.');
        }
    }

    async function handleSaveName() {
        if (!hasNameChanged) return;
        if (name.trim() === '') {
            setNameFeedback('Meno nemôže byť prázdne');
            setTimeout(() => setNameFeedback(''), 2000);
            return;
        }
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { displayName: name.trim() });
            setNameFeedback('Uložené ✓');
            setTimeout(() => setNameFeedback(''), 2000);
        } catch (err) {
            console.error('Failed to save name:', err);
            alert('Nepodarilo sa uložiť meno.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddTrade() {
        if (!tradeForm.itemId || !tradeForm.boughtAt || !tradeForm.targetSell) {
            alert('Vyplň item, nákupnú cenu a cieľ.'); return;
        }
        await addTrade({ uid: currentUser.uid, ...tradeForm });
        setTradeForm({ itemId: '', boughtAt: '', targetSell: '', note: '' });
        setShowTradeForm(false);
        const updated = await getUserTrades(currentUser.uid);
        setTrades(updated);
    }

    async function handleCloseTrade(tradeId) {
        if (!closingPrice) { alert('Zadaj predajnú cenu.'); return; }
        await closeTrade(tradeId, closingPrice);
        setClosingTradeId(null);
        setClosingPrice('');
        const updated = await getUserTrades(currentUser.uid);
        setTrades(updated);
    }

    async function handleEditTrade(tradeId) {
        await updateDoc(doc(db, 'trades', tradeId), {
            boughtAt: Number(editForm.boughtAt),
            targetSell: Number(editForm.targetSell),
            note: editForm.note
        });
        setEditingTradeId(null);
        const updated = await getUserTrades(currentUser.uid);
        setTrades(updated);
    }

    const MARKET_FEE = 0.8; // Crossout Mobile berie 20% z predajnej ceny
    const openTrades = trades.filter(t => t.status === 'open');
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, t) => sum + ((t.soldAt * MARKET_FEE) - t.boughtAt), 0);
    const getItemName = (itemId) => items.find(i => i.id === itemId)?.name || itemId;
    const formatCoins = (n) => n?.toLocaleString('sk-SK') || '—';

    const dateStr = userProfile?.lastSeen
        ? new Date(userProfile.lastSeen?.toMillis?.() || userProfile.lastSeen).toLocaleDateString('sk-SK')
        : '—';

    return (
        <div className="min-h-screen bg-cx-bg flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 border-b border-cx-border bg-cx-bg">
                <button onClick={onBack} className="p-1 -ml-1 text-cx-text hover:text-cx-orange transition-colors cursor-pointer">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Môj profil</h1>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full flex flex-col pb-20">

                {/* 1. BANNER */}
                <div
                    className="flex flex-col items-center justify-center py-6"
                    style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${getAvatar(avatarId).color}22 0%, transparent 70%)`,
                    }}
                >
                    {(() => {
                        const avatarData = getAvatar(avatarId);
                        const { Icon, color } = avatarData;
                        return (
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-lg"
                                style={{ backgroundColor: color + '33', border: `3px solid ${color}` }}
                            >
                                <Icon size={36} color={color} />
                            </div>
                        );
                    })()}
                    <h2 className="text-xl font-bold text-cx-text mt-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {userProfile?.displayName || 'Hráč'}
                    </h2>
                    <RoleBadge role={userProfile?.role} className="mt-1" />
                </div>

                <hr className="border-cx-border" />

                {/* 2. MY TRADES */}
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold tracking-widest text-cx-muted uppercase">Moje obchody</h2>
                        <button onClick={() => setShowTradeForm(f => !f)}
                            className="text-xs text-cx-orange border border-cx-orange/30 px-3 py-1 rounded hover:bg-cx-orange/10 cursor-pointer">
                            {showTradeForm ? 'Zavrieť' : '+ Nový'}
                        </button>
                    </div>

                    {/* FORM */}
                    {showTradeForm && (
                        <div className="bg-cx-surface border border-cx-border rounded-lg p-4 mb-4 flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-cx-muted">Položka</label>
                                <select value={tradeForm.itemId}
                                    onChange={async e => {
                                        const itemId = e.target.value;
                                        setTradeForm({ ...tradeForm, itemId, boughtAt: '', targetSell: '' });
                                        if (!itemId) return;
                                        const prices = await getPrices(itemId, 1);
                                        if (prices.length) {
                                            const current = prices[0].sale;
                                            const breakEven = Math.ceil(current / MARKET_FEE);
                                            setTradeForm({ itemId, boughtAt: current, targetSell: breakEven, note: tradeForm.note });
                                        }
                                    }}
                                    className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange">
                                    <option value="">Vyber položku...</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 w-full">
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <label className="text-xs text-cx-muted">Kúpené za</label>
                                    <input type="number" value={tradeForm.boughtAt} onChange={e => setTradeForm({ ...tradeForm, boughtAt: e.target.value })}
                                        placeholder="napr. 11500" className="w-full bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange" />
                                </div>
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <label className="text-xs text-cx-muted">Cieľ predaja</label>
                                    <input type="number" value={tradeForm.targetSell} onChange={e => setTradeForm({ ...tradeForm, targetSell: e.target.value })}
                                        placeholder="napr. 13000" className="w-full bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-cx-muted">Poznámka (voliteľné)</label>
                                <input type="text" value={tradeForm.note} onChange={e => setTradeForm({ ...tradeForm, note: e.target.value })}
                                    className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange" />
                            </div>
                            <button onClick={handleAddTrade}
                                className="bg-cx-orange text-white py-2 rounded font-bold text-sm hover:opacity-90 cursor-pointer">
                                Pridať obchod
                            </button>
                        </div>
                    )}

                    {/* OTVORENÉ POZÍCIE */}
                    {tradesLoading ? (
                        <p className="text-xs text-cx-muted">Načítavam...</p>
                    ) : openTrades.length === 0 ? (
                        <p className="text-xs text-cx-muted mb-4">Žiadne otvorené pozície.</p>
                    ) : (
                        <div className="flex flex-col gap-2 mb-4">
                            {openTrades.map(trade => {
                                const current = currentPrices[trade.itemId];
                                const pnlTarget = (trade.targetSell * MARKET_FEE) - trade.boughtAt;
                                const pnlTargetPct = ((pnlTarget / trade.boughtAt) * 100).toFixed(1);
                                const pnlCurrent = current != null ? (current * MARKET_FEE) - trade.boughtAt : null;
                                const pnlCurrentPct = pnlCurrent != null ? ((pnlCurrent / trade.boughtAt) * 100).toFixed(1) : null;

                                return (
                                    <div key={trade.id}>
                                        {editingTradeId === trade.id ? (
                                            <div className="bg-cx-surface border border-cx-orange/50 rounded-lg p-3 flex flex-col gap-2">
                                                <span className="font-bold text-sm text-cx-text">{getItemName(trade.itemId)}</span>
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                        <label className="text-xs text-cx-muted">Kúpené za</label>
                                                        <input type="number" value={editForm.boughtAt} onChange={e => setEditForm({ ...editForm, boughtAt: e.target.value })}
                                                            className="w-full bg-cx-bg border border-cx-border rounded p-1.5 text-sm text-cx-text outline-none focus:border-cx-orange" />
                                                    </div>
                                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                        <label className="text-xs text-cx-muted">Cieľ predaja</label>
                                                        <input type="number" value={editForm.targetSell} onChange={e => setEditForm({ ...editForm, targetSell: e.target.value })}
                                                            className="w-full bg-cx-bg border border-cx-border rounded p-1.5 text-sm text-cx-text outline-none focus:border-cx-orange" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs text-cx-muted">Poznámka</label>
                                                    <input type="text" value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })}
                                                        className="w-full bg-cx-bg border border-cx-border rounded p-1.5 text-sm text-cx-text outline-none focus:border-cx-orange" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditTrade(trade.id)}
                                                        className="flex-1 bg-cx-orange text-white py-1.5 rounded text-xs font-bold cursor-pointer">Uložiť</button>
                                                    <button onClick={() => setEditingTradeId(null)}
                                                        className="text-xs text-cx-muted border border-cx-border px-3 py-1.5 rounded cursor-pointer">Zrušiť</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-cx-surface border border-cx-border rounded-lg p-3">
                                                {/* HLAVIČKA */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-sm text-cx-text">{getItemName(trade.itemId)}</span>
                                                    <span className="text-xs text-cx-muted">{trade.boughtDate?.toDate?.().toLocaleDateString('sk-SK')}</span>
                                                </div>

                                                {/* RIADKY */}
                                                <div className="flex flex-col gap-1 mb-3">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-cx-muted">Kúpené za</span>
                                                        <span className="text-cx-text font-bold">{formatCoins(trade.boughtAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-cx-muted">Break-even <span className="text-cx-muted/50 text-[10px]">min. SALE cena bez straty</span></span>
                                                        <span className="text-cx-text">{formatCoins(Math.ceil(trade.boughtAt / MARKET_FEE))}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-cx-muted">Cieľ predaja</span>
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-cx-orange font-bold">{formatCoins(trade.targetSell)}</span>
                                                            <span style={{ color: pnlTarget >= 0 ? '#22c55e' : '#c0392b' }} className="font-bold">
                                                                {pnlTarget >= 0 ? '+' : ''}{pnlTargetPct}%
                                                            </span>
                                                        </span>
                                                    </div>

                                                    <div className="border-t border-cx-border my-1" />

                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-cx-muted">Aktuálna cena</span>
                                                        <span className="text-cx-text font-bold">{current != null ? formatCoins(current) : '—'}</span>
                                                    </div>
                                                    {pnlCurrent != null && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-cx-muted">P&L <span className="text-cx-muted/50 text-[10px]">zisk/strata pri predaji teraz</span></span>
                                                            <span style={{ color: pnlCurrent >= 0 ? '#22c55e' : '#c0392b' }} className="font-bold">
                                                                {pnlCurrent >= 0 ? '+' : ''}{formatCoins(Math.round(pnlCurrent))} ({pnlCurrentPct}%)
                                                            </span>
                                                        </div>
                                                    )}
                                                    {trade.note ? (
                                                        <div className="flex justify-between text-xs mt-1">
                                                            <span className="text-cx-muted">Poznámka</span>
                                                            <span className="text-cx-muted italic">{trade.note}</span>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* TLAČIDLÁ */}
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingTradeId(trade.id); setEditForm({ boughtAt: trade.boughtAt, targetSell: trade.targetSell, note: trade.note || '' }); }}
                                                        className="flex-1 text-xs text-cx-muted border border-cx-border py-1.5 rounded hover:border-cx-orange hover:text-cx-orange transition-colors cursor-pointer">
                                                        Upraviť
                                                    </button>
                                                    {closingTradeId === trade.id ? (
                                                        <div className="flex gap-2 flex-1">
                                                            <input type="number" value={closingPrice} onChange={e => setClosingPrice(e.target.value)}
                                                                placeholder="Predaná za..." className="flex-1 min-w-0 bg-cx-bg border border-cx-border rounded p-1.5 text-xs text-cx-text outline-none focus:border-cx-orange" />
                                                            <button onClick={() => handleCloseTrade(trade.id)}
                                                                className="text-xs bg-cx-orange text-white px-3 py-1 rounded cursor-pointer">OK</button>
                                                            <button onClick={() => setClosingTradeId(null)}
                                                                className="text-xs text-cx-muted px-2 py-1 cursor-pointer">✕</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setClosingTradeId(trade.id)}
                                                            className="flex-1 text-xs text-cx-muted border border-cx-border py-1.5 rounded hover:border-green-500 hover:text-green-400 transition-colors cursor-pointer">
                                                            Uzavrieť
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* UZAVRETÉ + P&L */}
                    {closedTrades.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold tracking-widest text-cx-muted uppercase">Uzavreté</h3>
                                <span style={{ color: totalPnL >= 0 ? '#22c55e' : '#c0392b' }} className="text-sm font-bold">
                                    Celkový P&L: {totalPnL >= 0 ? '+' : ''}{formatCoins(totalPnL)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {closedTrades.map(trade => {
                                    const pnl = (trade.soldAt * MARKET_FEE) - trade.boughtAt;
                                    const pnlPct = ((pnl / trade.boughtAt) * 100).toFixed(1);
                                    return (
                                        <div key={trade.id} className="bg-cx-surface border border-cx-border rounded-lg p-3 opacity-70">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-cx-text font-bold">{getItemName(trade.itemId)}</span>
                                                <span style={{ color: pnl >= 0 ? '#22c55e' : '#c0392b' }} className="text-sm font-bold">
                                                    {pnl >= 0 ? '+' : ''}{formatCoins(pnl)} ({pnlPct}%)
                                                </span>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-xs text-cx-muted">
                                                <span>Kúp: {formatCoins(trade.boughtAt)}</span>
                                                <span>Pred: {formatCoins(trade.soldAt)}</span>
                                                <span>{trade.soldDate?.toDate?.().toLocaleDateString('sk-SK')}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-cx-border" />

                {/* 3. ŠTATISTIKY */}
                <div className="border-t border-cx-border">
                    <button onClick={() => setShowStats(f => !f)}
                        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer">
                        <span className="text-xs font-bold tracking-widest text-cx-muted uppercase">Štatistiky</span>
                        <span className="text-xs text-cx-muted">{showStats ? '▲' : '▼'}</span>
                    </button>
                    {showStats && (
                        <div className="px-4 pb-3 flex flex-col gap-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-cx-muted">Uploady celkom</span>
                                <span className="text-cx-text font-bold">{uploadCount}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-cx-muted">Posledná aktivita</span>
                                <span className="text-cx-text font-medium">{dateStr}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-cx-muted">Rola</span>
                                <span className="text-cx-text font-medium capitalize">{userProfile?.role === 'admin' ? 'Admin' : 'Člen'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-cx-border" />

                {/* 4. NASTAVENIA PROFILU */}
                <div className="border-t border-cx-border">
                    <button onClick={() => setShowSettings(f => !f)}
                        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer">
                        <span className="text-xs font-bold tracking-widest text-cx-muted uppercase">Nastavenia profilu</span>
                        <span className="text-cx-muted text-xs">{showSettings ? '▲' : '▼'}</span>
                    </button>
                    {showSettings && (
                        <div className="px-4 pb-4 flex flex-col gap-4">
                            {/* AVATAR výber */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[10px] font-bold text-cx-muted uppercase tracking-widest">Avatar</h3>
                                <div className="flex gap-2 overflow-x-auto w-full pb-2 snap-x">
                                    {avatarIcons.map((a) => (
                                        <button
                                            key={a.id}
                                            onClick={() => handleAvatarChange(a.id)}
                                            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center snap-center transition-all cursor-pointer hover:scale-110 ${avatarId === a.id ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 grayscale-50'}`}
                                            style={{ backgroundColor: a.color + '33', border: `2px solid ${a.color}` }}
                                        >
                                            <a.Icon size={18} color={a.color} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ZOBRAZOVANÉ MENO */}
                            <div className="flex flex-col gap-2 relative">
                                <h3 className="text-[10px] font-bold text-cx-muted uppercase tracking-widest">Zobrazované meno</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="flex-1 bg-cx-surface border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange transition-colors"
                                    />
                                    {hasNameChanged && (
                                        <button
                                            onClick={handleSaveName}
                                            disabled={isSaving}
                                            className="px-3 py-1 bg-cx-surface border border-cx-orange text-cx-orange rounded font-bold hover:bg-cx-orange hover:text-white transition-colors disabled:opacity-50 cursor-pointer text-xs"
                                        >
                                            {isSaving ? '...' : 'Uložiť'}
                                        </button>
                                    )}
                                </div>
                                {nameFeedback && (
                                    <div className={`text-[10px] font-bold ${nameFeedback.includes('prázdne') ? 'text-red-500' : 'text-green-500'}`}>
                                        {nameFeedback}
                                    </div>
                                )}
                            </div>

                            {/* Odhlásiť */}
                            <div className="border-t border-cx-border mt-2 pt-4">
                                <button
                                    onClick={logout}
                                    className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded flex items-center justify-center gap-2 font-bold hover:bg-red-500/20 transition-colors cursor-pointer text-sm"
                                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                >
                                    <LogOut size={16} /> Odhlásiť sa
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-cx-border" />

            </div>
        </div>
    );
}
