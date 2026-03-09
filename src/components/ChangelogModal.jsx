import { useState } from 'react';
import { X, Lightbulb, CheckCircle2, LayoutGrid, Info } from 'lucide-react';

export default function ChangelogModal({ onClose }) {
    const [activeTab, setActiveTab] = useState('news'); // 'news' or 'guide'

    return (
        <div className="fixed inset-0 z-[100] bg-cx-bg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="relative pt-8 pb-4 px-6 flex flex-col items-center justify-center bg-cx-surface">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-cx-muted hover:text-white transition-colors cursor-pointer bg-black/20 rounded-full"
                >
                    <X size={20} />
                </button>

                <h1 className="text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    <span className="text-cx-text">CROSS</span>
                    <span className="text-cx-orange">MARKET</span>
                </h1>

                <div className="flex flex-col items-center">
                    <span className="text-[#888888] text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
                        Relic Market · Coins Tracker
                    </span>

                    <div className="border border-cx-orange/30 bg-cx-orange/10 text-cx-orange text-[10px] px-3 py-1 font-bold uppercase tracking-widest mb-4" style={{ borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif" }}>
                        v3.0 — My Trades & P&L Tracker
                    </div>
                </div>

                {/* Gradient line */}
                <div
                    className="absolute bottom-0 left-0 w-full h-[2px]"
                    style={{ background: 'linear-gradient(90deg, transparent, #e8520a, #f0b429, transparent)' }}
                />
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-cx-surface border-b border-[#2a2a2a]">
                <button
                    onClick={() => setActiveTab('news')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'news' ? 'text-white' : 'text-cx-muted'}`}
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                    Novinky V3.0
                    {activeTab === 'news' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cx-orange"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'guide' ? 'text-white' : 'text-cx-muted'}`}
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                    Návod & Tipy
                    {activeTab === 'guide' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cx-orange"></div>}
                </button>
            </div>

            {/* Content scrollovateľný */}
            <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                <div className="max-w-xl mx-auto flex flex-col gap-8 pb-10">

                    {activeTab === 'news' ? (
                        /* TAB 1: NOVINKY V2.2 */
                        <div className="flex flex-col gap-[10px]">
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#e8520a] p-[14px_18px]" style={{ borderRadius: '8px' }}>
                                <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>📊 My Trades — P&L Tracker</h3>
                                <p className="text-gray-300 text-sm leading-relaxed mb-1">Sleduj svoje otvorené obchodné pozície priamo v Profile. Zaznamenaj nákupnú cenu, nastav cieľ predaja a sleduj P&L v reálnom čase oproti aktuálnym trhovým cenám.</p>
                                <p className="text-[#888] text-xs">Profil → Moje obchody → + Nový | Break-even sa vypočíta automaticky (20% market fee)</p>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#f0b429] p-[14px_18px]" style={{ borderRadius: '8px' }}>
                                <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>📈 Real-time P&L s market fee</h3>
                                <p className="text-gray-300 text-sm leading-relaxed mb-1">P&L zohľadňuje 20% market fee Crossout Mobile. Break-even ukazuje minimálnu SALE cenu bez straty. Cieľ predaja sa predvyplní automaticky po výbere položky.</p>
                                <p className="text-[#888] text-xs">P&L = (aktuálna SALE × 0.8) − nákupná cena</p>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#3b82f6] p-[14px_18px]" style={{ borderRadius: '8px' }}>
                                <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>🗂️ Redesign Profilu</h3>
                                <p className="text-gray-300 text-sm leading-relaxed mb-1">Profil má nové rozloženie — My Trades na prvom mieste, štatistiky a nastavenia skryté v rozbaľovacích sekciách. Menej vizuálneho šumu, viac priestoru pre obchody.</p>
                                <p className="text-[#888] text-xs">Nastavenia profilu, avatar, logout — všetko na jednom mieste</p>
                            </div>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#22c55e] p-[14px_18px]" style={{ borderRadius: '8px' }}>
                                <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>🟢 Market Event Tags</h3>
                                <p className="text-gray-300 text-sm leading-relaxed mb-1">Admini môžu zaznamenávať externé udalosti ovplyvňujúce ceny — crafting, patche, eventy, battle pass. Každý event sa zobrazí ako farebná bodka priamo na grafe.</p>
                                <p className="text-[#888] text-xs">Nastavenia → Market Eventy | Farby: zelená = crafting, oranžová = patch, modrá = battle pass</p>
                            </div>

                            {/* História verzií */}
                            <div className="mt-4 border-l-4 border-[#888] pl-3">
                                <h2 className="text-[#888] font-bold uppercase tracking-widest text-[11px]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    História verzií
                                </h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                <details className="bg-[#161616] border border-[#2a2a2a] rounded-[8px] p-[12px_16px] group [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="text-[#e0e0e0] font-bold text-sm cursor-pointer list-none flex justify-between items-center" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        <span>V2.3 — My Trades & Profile redesign</span>
                                        <span className="text-[10px] bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded">8. 3. 2026</span>
                                    </summary>
                                    <ul className="text-[#888] text-[13px] flex flex-col gap-[6px] mt-3 pl-1">
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>My Trades — sledovanie otvorených a uzavretých pozícií</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>P&L výpočet so 20% market fee + break-even</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>Auto-fill nákupnej ceny a cieľa pri výbere položky</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>Edit otvoreného obchodu</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>Redesign ProfileScreen — nové poradie sekcií</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>Štatistiky a Nastavenia profilu v collapse sekciách</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>Logout presunutý do Nastavenia profilu</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0"></div>Jemný farebný gradient v banneri podľa avatara</li>
                                    </ul>
                                </details>

                                <details className="bg-[#161616] border border-[#2a2a2a] rounded-[8px] p-[12px_16px] group [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="text-[#e0e0e0] font-bold text-sm cursor-pointer list-none flex justify-between items-center" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        <span>V2.2 — Vizualizácia a UX</span>
                                        <span className="text-[10px] bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded">7. 3. 2026</span>
                                    </summary>
                                    <ul className="text-[#888] text-[13px] flex flex-col gap-[6px] mt-3 pl-1">
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#f0b429] mt-1.5 shrink-0"></div>Market Event Tags — bodky na grafe a legenda</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#f0b429] mt-1.5 shrink-0"></div>Redesign Item Detail — čistejšia tabuľka histórie</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#f0b429] mt-1.5 shrink-0"></div>Canvas animácia v headery — subílna kométa</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#f0b429] mt-1.5 shrink-0"></div>Reorganized Changelog modal & Návod</li>
                                    </ul>
                                </details>

                                <details className="bg-[#161616] border border-[#2a2a2a] rounded-[8px] p-[12px_16px] group [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="text-[#e0e0e0] font-bold text-sm cursor-pointer list-none flex justify-between items-center" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        <span>V2.0 — Analytika & OCR</span>
                                        <span className="text-[10px] bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded">7. 3. 2026</span>
                                    </summary>
                                    <ul className="text-[#888] text-[13px] flex flex-col gap-[6px] mt-3 pl-1">
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Collector rola — len collector + admin môžu nahrávať</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Canonical aliasy + fuzzy matching OCR</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Review queue — auto-approve / needs-review</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Freshness indikátor — farebný dot s modalom</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>MetricCard 2×2 — 7D MIN/MAX, AVG 7D/30D</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Graf — SALE/PURCHASE prepínač + 7d/30d overlay + MIN/MAX body</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Market Intel carousel — Top Movers 24H/7D/30D</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Pin item — max 5 sledovaných položiek</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Kategória Module + 4 nové položky</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>PWA manifest + ikony</li>
                                    </ul>
                                </details>

                                <details className="bg-[#161616] border border-[#2a2a2a] rounded-[8px] p-[12px_16px] group [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="text-[#e0e0e0] font-bold text-sm cursor-pointer list-none flex justify-between items-center" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        <span>V1.0 — MVP</span>
                                        <span className="text-[10px] bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded">6. 3. 2026</span>
                                    </summary>
                                    <ul className="text-[#888] text-[13px] flex flex-col gap-[6px] mt-3 pl-1">
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Login + základný market zoznam</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>OCR upload screenshotov</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Item detail + graf histórie</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>24 relic položiek v databáze</li>
                                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8520a] mt-1.5 shrink-0"></div>Firebase Hosting deploy</li>
                                    </ul>
                                </details>
                            </div>
                        </div>
                    ) : (
                        /* TAB 2: NÁVOD & TIPY */
                        <div className="flex flex-col gap-8">
                            {/* Sekcia 1 - Čo je CrossMarket */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Čo je CrossMarket?
                                    </h2>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#e8520a] rounded-xl p-[14px_18px] text-gray-300 text-sm leading-relaxed">
                                    CrossMarket je interný nástroj clanu na sledovanie cien relic položiek v Crossout Mobile. Namiesto odhadovania od oka máš históriu — vidíš či je item momentálne lacný alebo drahý v porovnaní s minulosťou. Funguje ako webová stránka, žiadna inštalácia nie je potrebná.
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#f0b429] rounded-xl p-4 flex items-start gap-3">
                                    <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        Na mobile si appku môžeš pridať na plochu. V Chrome klepni na menu (tri bodky) → Pridať na plochu. Na iPhone použi Safari → Zdieľať → Pridať na plochu.
                                    </p>
                                </div>
                            </div>

                            {/* Sekcia 2 - Ako začať */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Ako začať
                                    </h2>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                        <span className="text-sm text-gray-300">Prihlás sa · Nastav si meno a avatar v Profile</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                        <span className="text-sm text-gray-300">Pinnuj itemy ktoré obchoduješ · Zobrazia sa vždy hore</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                        <span className="text-sm text-gray-300">Po uploade screenshotu skontroluj confirm tabuľku · Potvrď alebo oprav</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-row items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">4</div>
                                        <div className="flex flex-col">
                                            <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Sleduj ceny</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">Na hlavnej obrazovke vidíš všetky položky s aktuálnymi cenami a trendom. Klepni na ľubovoľnú položku pre detail — graf, metriky a históriu.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sekcia 3 - Market Hlavná obrazovka */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Market — hlavná obrazovka
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-300">Tu vidíš všetky sledované položky s aktuálnymi cenami.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[12px_16px]">
                                        <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>🟠 SALE cena</h3>
                                        <p className="text-[#888888] text-xs leading-relaxed">Za toľko môžeš predať svoju položku na markete.</p>
                                    </div>
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[12px_16px]">
                                        <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>🟡 BUY cena</h3>
                                        <p className="text-[#888888] text-xs leading-relaxed">Za toľko môžeš položku kúpiť od iného hráča.</p>
                                    </div>
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[12px_16px]">
                                        <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>🟢 Trend šípka</h3>
                                        <p className="text-[#888888] text-xs leading-relaxed">Zelená ↑ = cena rastie oproti predchádzajúcemu záznamu. Červená ↓ = cena klesá.</p>
                                    </div>
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[12px_16px]">
                                        <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>📌 Pin</h3>
                                        <p className="text-[#888888] text-xs leading-relaxed">Pinnuj max 5 položiek ktoré sleduješ — zobrazia sa vždy hore v zozname.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sekcia 4 - Nahrávanie screenshotov */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Nahrávanie screenshotov
                                    </h2>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                        <span className="text-sm text-gray-300">Urob screenshot in-game marketu s relic položkami</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                        <span className="text-sm text-gray-300">Nahraj fotku do našej appky cez oranžové "+" tlačidlo</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-cx-orange/20 text-cx-orange flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                        <span className="text-sm text-gray-300">Umelá inteligencia fotku prečíta a vyplní ceny</span>
                                    </div>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#f0b429] rounded-xl p-4 flex items-start gap-3">
                                    <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        Celý proces trvá asi 2 minúty. Stačí raz za deň alebo keď vidíš pohyb cien. Čím viac ľudí nahrá, tým presnejšie dáta má celý clan.
                                    </p>
                                </div>
                            </div>

                            {/* Sekcia 5 - Market Eventy ako na to */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Market Eventy — ako na to
                                    </h2>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[14px] flex flex-row items-start gap-4">
                                        <div className="w-[28px] h-[28px] rounded-full bg-[#e8520a] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                                        <div className="flex flex-col">
                                            <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Otvor Nastavenia → Položky</h3>
                                            <p className="text-sm text-gray-300">Scrollni dole na sekciu Market Eventy. Vidíš ju len ako admin.</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[14px] flex flex-row items-start gap-4">
                                        <div className="w-[28px] h-[28px] rounded-full bg-[#e8520a] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                                        <div className="flex flex-col">
                                            <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Vyplň typ a dátum</h3>
                                            <p className="text-sm text-gray-300">Vyber typ (crafting / patch / event...), zadaj label, zaškrtni ovplyvnené položky a nastav dátum začiatku. Koniec je voliteľný.</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[8px] p-[14px] flex flex-row items-start gap-4">
                                        <div className="w-[28px] h-[28px] rounded-full bg-[#e8520a] text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                                        <div className="flex flex-col">
                                            <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Sleduj graf</h3>
                                            <p className="text-sm text-gray-300">Otvor detail ľubovoľnej označenej položky — uvidíš farebnú bodku s popisom na časovej osi grafu.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sekcia 6 - Tipy pre obchodovanie */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Tipy pre obchodovanie
                                    </h2>
                                </div>
                                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-4">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            Market Event bodka na grafe? Klepni na detail — uvidíš kedy event začal a skončil. Cena sa po skončení craftingu zvyčajne vráti hore.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            Spread je fixný ~20% pre všetky relic položky — zarábaš na pohybe ceny, nie na spread arbitráži.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            Porovnaj <span className="text-white font-medium">AVG 7D</span> a <span className="text-white font-medium">AVG 30D</span> — ak je 7D výrazne pod 30D, item môže byť na dne.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            Freshness dot <span className="text-cx-red font-medium">červená</span>? Dáta sú staré. Požiadať Collectora o update.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <span className="text-white font-medium">OBER graf</span> ti ukáže či sa spread mení — stabilný spread = stabilný trh.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-[#f0b429] mt-0.5 shrink-0" />
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <span className="text-white font-medium">Top Movers 7D</span> je spoľahlivejší ako 24H — menej náhodných výkyvov.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sekcia 7 - Pravidlá clanu */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Pravidlá clanu
                                    </h2>
                                </div>
                                <div className="flex flex-col gap-[10px]">
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#c0392b] p-[14px_18px] rounded-[8px] flex gap-3 items-start">
                                        <CheckCircle2 size={16} className="text-[#c0392b] mt-0.5 shrink-0" />
                                        <h3 className="text-gray-300 font-medium text-sm leading-relaxed" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Nahrávaj pravidelne — čím viac dát, tým lepšie rozhodnutia pre všetkých.</h3>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#c0392b] p-[14px_18px] rounded-[8px] flex gap-3 items-start">
                                        <CheckCircle2 size={16} className="text-[#c0392b] mt-0.5 shrink-0" />
                                        <h3 className="text-gray-300 font-medium text-sm leading-relaxed" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Oprav chyby — ak vidíš nesprávnu cenu v confirm tabuľke, oprav ju pred uložením.</h3>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#c0392b] p-[14px_18px] rounded-[8px] flex gap-3 items-start">
                                        <span className="text-[#c0392b] mt-0.5 shrink-0 font-bold" style={{ fontSize: '14px' }}>🔒</span>
                                        <h3 className="text-gray-300 font-medium text-sm leading-relaxed" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Nezdieľaj prístup — každý má vlastný účet. Link ani heslo nezdieľaj mimo clanu.</h3>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] border-l-[3px] border-l-[#c0392b] p-[14px_18px] rounded-[8px] flex gap-3 items-start">
                                        <Info size={16} className="text-[#c0392b] mt-0.5 shrink-0" />
                                        <h3 className="text-gray-300 font-medium text-sm leading-relaxed" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Nastavenia sú pre admina — uvidíš ich, ale nemusíš sa nimi zaoberať.</h3>
                                    </div>
                                </div>
                            </div>


                            {/* Čo príde ďalej */}
                            <div className="flex flex-col gap-4">
                                <div className="border-l-4 border-cx-orange pl-3">
                                    <h2 className="text-cx-orange font-bold uppercase tracking-wider text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                        Čo príde ďalej
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#f0b429]"></div>
                                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Buy/Sell signály</span>
                                        </div>
                                        <span className="text-[#888888] text-[9px] uppercase font-bold tracking-tighter">Roadmap</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Osobný P&L tracker</span>
                                        </div>
                                        <span className="text-[#888888] text-[9px] uppercase font-bold tracking-tighter">Roadmap</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 flex justify-between items-center shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#a855f7]"></div>
                                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Swap analyzer</span>
                                        </div>
                                        <span className="text-[#888888] text-[9px] uppercase font-bold tracking-tighter">Roadmap</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 text-center text-[#888888] text-[11px] tracking-wider font-medium opacity-60 uppercase">
                        CrossMarket · Clan interný nástroj · v3.0
                    </div>

                </div>
            </div>
        </div>
    );
}
