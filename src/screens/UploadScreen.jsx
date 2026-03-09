import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Check, X, AlertTriangle } from 'lucide-react';
import { extractPricesFromScreenshot } from '../services/ocr';
import { fuzzyMatchItem, isSuspiciousPrice } from '../utils/itemAliases';
import { getItems } from '../services/items';
import { addPrice } from '../services/prices';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatCoins } from '../utils/formatters';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function UploadScreen({ onBack }) {
    const { currentUser, userProfile } = useAuth();

    // Stavy: 'idle' | 'preview' | 'processing' | 'confirm' | 'saving' | 'saved'
    const [screenState, setScreenState] = useState('idle');

    const [selectedFiles, setSelectedFiles] = useState([]); // Pole súborov
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processingIndex, setProcessingIndex] = useState(0); // Index aktuálne spracovávaného súboru
    const [autoExpanded, setAutoExpanded] = useState(false);

    const [dbItems, setDbItems] = useState([]);
    const [extractedData, setExtractedData] = useState([]);
    const [confirmRows, setConfirmRows] = useState([]); // [{ id, ocrName, mappedItemId, mappedName, sale, purchase, confirmed, raw }]

    const [errorMsg, setErrorMsg] = useState('');
    const [saveStats, setSaveStats] = useState({ saved: 0, ignored: 0 });

    const fileInputRef = useRef(null);

    // Načítanie DB položiek pri mounte pre mapovanie
    useEffect(() => {
        async function loadItems() {
            try {
                const items = await getItems();
                setDbItems(items);
            } catch (err) {
                console.error("Failed to load DB items for upload mapping", err);
            }
        }
        loadItems();
    }, []);

    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validácia veľkosti (aspoň jeden)
        const tooBig = files.some(f => f.size > 10 * 1024 * 1024);
        if (tooBig) {
            setErrorMsg('Niektoré súbory sú príliš veľké (max 10MB na súbor).');
            return;
        }

        setErrorMsg('');
        setSelectedFiles(files);

        // Pre náhľad použijeme prvý súbor
        const objUrl = URL.createObjectURL(files[0]);
        setPreviewUrl(objUrl);
        setScreenState('preview');
    }

    function handleCancelPreview() {
        setScreenState('idle');
        setSelectedFiles([]);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setProcessingIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // Pomocná funkcia na konverziu súboru na base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function handleAnalyze() {
        setScreenState('processing');
        setErrorMsg('');
        setProcessingIndex(0);

        let allExtracted = [];
        let allRows = [];

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                setProcessingIndex(i);
                const file = selectedFiles[i];
                const b64 = await fileToBase64(file);

                const result = await extractPricesFromScreenshot(b64);

                if (Array.isArray(result)) {
                    allExtracted = [...allExtracted, ...result];

                    // Mapovanie pre tento konkrétny súbor
                    const rows = result.map((ocrItem, subIndex) => {
                        const matchResult = fuzzyMatchItem(ocrItem.name || '', dbItems);
                        let mappedItemId = null;
                        let mappedName = null;
                        let confirmed = false;
                        let status = "unmatched";

                        if (matchResult) {
                            if (matchResult.exact) {
                                status = "ok";
                                confirmed = true;
                                mappedItemId = matchResult.item.id;
                                mappedName = matchResult.item.name;
                            } else if (matchResult.score >= 0.9) {
                                status = "fuzzy";
                                confirmed = true;
                                mappedItemId = matchResult.item.id;
                                mappedName = matchResult.item.name;
                            }
                        }

                        const suspicious = isSuspiciousPrice(Number(ocrItem.sale), Number(ocrItem.purchase));

                        let reviewGroup = 'needs-review';
                        let reviewStatus = 'manual';
                        if (status === 'ok' && !suspicious) {
                            reviewGroup = 'auto-approved';
                            reviewStatus = 'auto';
                        }

                        return {
                            id: `f${i}-r${subIndex}`,
                            ocrName: ocrItem.name,
                            mappedItemId,
                            mappedName,
                            sale: ocrItem.sale,
                            purchase: ocrItem.purchase,
                            confirmed,
                            status,
                            suspicious,
                            reviewGroup,
                            reviewStatus,
                            raw: ocrItem
                        };
                    });
                    allRows = [...allRows, ...rows];
                }
            }

            if (allRows.length === 0) {
                setErrorMsg('Žiadne položky sa nenašli v žiadnom screenshotu.');
                setScreenState('preview');
                return;
            }

            setExtractedData(allExtracted);
            setConfirmRows(allRows);
            setScreenState('confirm');

        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || 'Chyba pri analýze obrázkov.');
            setScreenState('preview');
        }
    }

    function toggleConfirmRow(rowId) {
        setConfirmRows(prev => prev.map(r =>
            r.id === rowId ? { ...r, confirmed: !r.confirmed } : r
        ));
    }

    function handleRowChange(rowId, field, value) {
        setConfirmRows(prev => prev.map(r =>
            r.id === rowId ? { ...r, [field]: value } : r
        ));
    }

    function handleMapItem(rowId, dbItemId) {
        const dbItem = dbItems.find(i => i.id === dbItemId);
        setConfirmRows(prev => prev.map(r => {
            if (r.id === rowId) {
                return {
                    ...r,
                    mappedItemId: dbItemId,
                    mappedName: dbItem ? dbItem.name : null,
                    confirmed: !!dbItem,
                    status: dbItem ? "ok" : "unmatched"
                };
            }
            return r;
        }));
    }

    async function handleSave() {
        const toSave = confirmRows.filter(r => r.confirmed && r.mappedItemId && r.sale && r.purchase);
        if (toSave.length === 0) return;

        setScreenState('saving');

        try {
            let savedCount = 0;
            for (const row of toSave) {
                await addPrice(row.mappedItemId, {
                    sale: Number(row.sale),
                    purchase: Number(row.purchase),
                    source: 'ocr',
                    reviewStatus: row.reviewStatus || 'manual'
                }, currentUser.uid);
                savedCount++;
            }

            const ignoredCount = confirmRows.length - savedCount;

            // Zapíš do uploadLog
            await addDoc(collection(db, 'uploadLog'), {
                uid: currentUser.uid,
                timestamp: serverTimestamp(),
                itemsExtracted: confirmRows.length,
                itemsConfirmed: savedCount,
                screenshotDeleted: true,
                multipleFiles: selectedFiles.length > 1
            });

            setSaveStats({ saved: savedCount, ignored: ignoredCount });
            setScreenState('saved');

            // Clear image from memory
            if (previewUrl) URL.revokeObjectURL(previewUrl);

        } catch (err) {
            console.error("Save error:", err);
            alert('Chyba pri ukladaní dát: ' + err.message);
            setScreenState('confirm');
        }
    }

    function renderHeader(title) {
        return (
            <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-cx-border bg-cx-bg">
                <button onClick={onBack} className="p-1 -ml-1 text-cx-text hover:text-cx-orange transition-colors cursor-pointer">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {title}
                </h1>
            </div>
        );
    }

    // ============== STATES ==============

    if (screenState === 'idle') {
        const isAllowed = userProfile?.role === 'admin' || userProfile?.role === 'collector';

        return (
            <div className="min-h-screen bg-cx-bg flex flex-col">
                {renderHeader('Nahrať screenshoty')}
                <div className="flex-1 p-6 flex flex-col justify-center items-center gap-6">
                    {!isAllowed ? (
                        <div className="w-full max-w-sm bg-cx-surface border-l-4 border-cx-orange p-4 rounded text-cx-muted text-sm shadow-sm leading-relaxed">
                            <span className="text-cx-text font-bold block mb-1">Prístup odmietnutý</span>
                            Nahrávanie screenshotov je dostupné len pre Collectorov.<br />
                            Požiadaj admina o pridelenie roly.
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-sm aspect-square border-2 border-dashed border-cx-border hover:border-cx-orange transition-colors rounded-xl flex flex-col items-center justify-center bg-cx-surface cursor-pointer text-cx-muted hover:text-cx-orange"
                            >
                                <Camera size={48} className="mb-4" />
                                <p className="font-bold text-lg" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Klepni pre výber</p>
                                <p className="text-sm">aj viacerých screenshotov</p>
                            </div>

                            {errorMsg && (
                                <div className="w-full max-w-sm bg-cx-red/10 border border-cx-red text-cx-red p-3 rounded text-sm text-center">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="text-center text-cx-muted text-xs">
                                <p>Podporované: PNG, JPG, WebP</p>
                                <p className="mt-1">Max veľkosť: 10MB / súbor</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (screenState === 'preview' || screenState === 'processing') {
        return (
            <div className="min-h-screen bg-cx-bg flex flex-col">
                {renderHeader('Pripravené na analýzu')}
                <div className="flex-1 p-4 flex flex-col relative">

                    <div className="mb-4 px-3 py-2 bg-cx-surface border border-cx-border rounded text-sm flex justify-between items-center">
                        <span className="text-cx-muted">Vybrané súbory:</span>
                        <span className="font-bold text-cx-orange">{selectedFiles.length} screenshoty</span>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 bg-cx-red/10 border border-cx-red text-cx-red p-3 rounded text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <div className="relative flex-1 bg-cx-surface border border-cx-border rounded overflow-hidden flex items-center justify-center min-h-[200px] max-h-[40vh]">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className={`max-w-full max-h-full object-contain ${screenState === 'processing' ? 'opacity-30' : ''}`}
                        />

                        {screenState === 'processing' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40">
                                <span className="inline-block w-10 h-10 border-4 border-cx-orange/30 border-t-cx-orange rounded-full animate-spin mb-4" />
                                <p className="font-bold tracking-wide text-lg" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    Analyzujem {processingIndex + 1} / {selectedFiles.length}...
                                </p>
                                <p className="text-xs text-cx-muted mt-2 max-w-xs text-center">Claude Vision API číta ceny...</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 pb-8">
                        <button
                            onClick={handleAnalyze}
                            disabled={screenState === 'processing'}
                            className="w-full py-3.5 bg-cx-orange text-white font-bold rounded cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        >
                            Spustiť analýzu ({selectedFiles.length})
                        </button>
                        <button
                            onClick={handleCancelPreview}
                            disabled={screenState === 'processing'}
                            className="w-full py-3.5 bg-cx-surface border border-cx-border text-cx-text font-bold rounded cursor-pointer hover:border-cx-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Zrušiť
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (screenState === 'confirm') {
        const statsExact = confirmRows.filter(r => r.mappedItemId).length;
        const statsTotal = confirmRows.length;

        const autoApprovedRows = confirmRows.filter(r => r.reviewGroup === 'auto-approved');
        const needsReviewRows = confirmRows.filter(r => r.reviewGroup === 'needs-review');
        const hasUnmatchedNeedsReview = needsReviewRows.some(r => !r.mappedItemId);

        const renderRow = (row, isReadOnly) => {
            let borderClass = "border border-cx-border";
            if (row.status === "fuzzy") borderClass = "border-y border-r border-cx-border border-l-4 border-l-blue-500";
            else if (row.status === "unmatched") borderClass = "border-y border-r border-cx-border border-l-4 border-l-red-500";

            const cellBg = row.suspicious ? "bg-yellow-500/20" : "";

            return (
                <tr key={row.id} className={`bg-cx-surface rounded-lg shadow-sm transition-opacity ${!row.confirmed ? 'opacity-60 grayscale' : ''} ${borderClass}`}>
                    <td className="p-2 align-top rounded-l-lg border-r border-cx-border">
                        <div className="flex items-start gap-1.5">
                            {row.mappedItemId ? (
                                <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                            ) : (
                                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                            )}

                            {row.mappedItemId ? (
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-cx-text truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{row.mappedName}</p>
                                        {row.status === 'fuzzy' && (
                                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold shrink-0">~opravené</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-cx-muted leading-tight mt-0.5">OCR: "{row.ocrName}"</p>
                                </div>
                            ) : (
                                <div className="flex flex-col w-full min-w-0">
                                    <p className="font-bold text-cx-text line-through truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{row.ocrName}</p>
                                    <select
                                        className="mt-1 bg-cx-bg border border-cx-border text-xs p-1 rounded text-cx-text w-full"
                                        value=""
                                        onChange={(e) => handleMapItem(row.id, e.target.value)}
                                        disabled={isReadOnly}
                                    >
                                        <option value="" disabled>Vyber z DB...</option>
                                        {dbItems.sort((a, b) => a.name.localeCompare(b.name)).map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </td>

                    <td className={`p-2 align-top border-r border-cx-border w-24 ${cellBg}`}>
                        <input
                            type="number"
                            value={row.sale || ''}
                            onChange={(e) => handleRowChange(row.id, 'sale', Number(e.target.value))}
                            disabled={isReadOnly}
                            className="w-full bg-cx-bg border border-cx-border rounded px-1.5 py-1 text-cx-gold font-bold text-sm disabled:opacity-70 disabled:bg-cx-surface"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        />
                    </td>

                    <td className={`p-2 align-top border-r border-cx-border w-24 ${cellBg}`}>
                        <div className="flex flex-col gap-1 items-end">
                            <div className="w-full flex items-center justify-between">
                                <input
                                    type="number"
                                    value={row.purchase || ''}
                                    onChange={(e) => handleRowChange(row.id, 'purchase', Number(e.target.value))}
                                    disabled={isReadOnly}
                                    className="w-full bg-cx-bg border border-cx-border rounded px-1.5 py-1 text-cx-gold font-bold text-sm disabled:opacity-70 disabled:bg-cx-surface"
                                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                                />
                            </div>
                            {row.suspicious && (
                                <div className="flex items-center gap-1 text-yellow-500 mt-0.5">
                                    <AlertTriangle size={12} />
                                    <span className="text-[9px] font-bold uppercase">Podozrivé</span>
                                </div>
                            )}
                        </div>
                    </td>

                    <td className="p-2 align-middle text-center rounded-r-lg w-10">
                        <button
                            onClick={() => toggleConfirmRow(row.id)}
                            disabled={isReadOnly}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-colors mx-auto ${row.confirmed ? 'bg-cx-orange text-white' : 'bg-cx-bg text-cx-muted border border-cx-border'} disabled:opacity-50`}
                        >
                            {row.confirmed ? <Check size={16} /> : <X size={16} />}
                        </button>
                    </td>
                </tr>
            );
        };

        return (
            <div className="min-h-screen bg-cx-bg flex flex-col">
                {renderHeader('Potvrdenie cien')}

                <div className="px-4 py-3 bg-cx-surface border-b border-cx-border text-xs flex justify-between items-center">
                    <div>
                        <p className="text-cx-text">Extrahovaných: <span className="font-bold text-cx-orange">{statsTotal}</span> položiek</p>
                        <p className="text-cx-muted mt-0.5">Zhoduje sa s DB: {statsExact} / {statsTotal}</p>
                    </div>
                    <div className="text-right text-cx-muted">
                        Zdroj: {selectedFiles.length} súbory
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-cx-bg p-3 pb-24">

                    {autoApprovedRows.length > 0 && (
                        <div className="mb-4">
                            <div
                                className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors hover:bg-green-500/20"
                                onClick={() => setAutoExpanded(!autoExpanded)}
                            >
                                <span className="text-green-500 font-bold flex items-center gap-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    <Check size={18} /> Auto-schválené ({autoApprovedRows.length})
                                </span>
                                <span className="text-green-500 text-xs font-bold uppercase tracking-wider">
                                    {autoExpanded ? 'Skryť' : 'Zobraziť'}
                                </span>
                            </div>
                            {autoExpanded && (
                                <div className="mt-3">
                                    <table className="w-full text-left text-sm border-separate" style={{ borderSpacing: '0 8px' }}>
                                        <tbody>
                                            {autoApprovedRows.map(r => renderRow(r, true))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {needsReviewRows.length > 0 && (
                        <div className="mb-4">
                            <div className="bg-cx-orange/10 border border-cx-orange/30 p-3 rounded-lg flex justify-between items-center mb-3">
                                <span className="text-cx-orange font-bold flex items-center gap-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                    <AlertTriangle size={18} /> Vyžadujú kontrolu ({needsReviewRows.length})
                                </span>
                            </div>
                            <table className="w-full text-left text-sm border-separate" style={{ borderSpacing: '0 8px' }}>
                                <tbody>
                                    {needsReviewRows.map(r => renderRow(r, false))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-cx-bg border-t border-cx-border p-4 pb-24 md:pb-4 flex flex-col gap-2 z-10">
                    {hasUnmatchedNeedsReview && (
                        <div className="text-red-500 text-xs text-center font-bold mb-1">
                            ⚠️ Niektoré položky nemajú vybranú zhodu
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancelPreview}
                            className="flex-1 py-3 bg-cx-surface border border-cx-border rounded text-cx-text font-bold uppercase tracking-wider"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        >
                            Zrušiť
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={hasUnmatchedNeedsReview || confirmRows.filter(r => r.confirmed && r.mappedItemId).length === 0}
                            className="flex-1 py-3 bg-cx-orange text-white rounded font-bold uppercase tracking-wider disabled:opacity-50 transition-opacity"
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        >
                            Potvrdiť a uložiť
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (screenState === 'saving') {
        return (
            <div className="min-h-screen bg-cx-bg flex flex-col items-center justify-center p-6 text-center">
                <span className="inline-block w-12 h-12 border-4 border-cx-orange/30 border-t-cx-orange rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-bold text-cx-text mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    Ukladám do databázy...
                </h2>
                <p className="text-cx-muted">Zapisujem {confirmRows.filter(r => r.confirmed).length} záznamov.</p>
            </div>
        );
    }

    if (screenState === 'saved') {
        return (
            <div className="min-h-screen bg-cx-bg flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <Check size={40} className="text-green-500" />
                </div>

                <h2 className="text-2xl font-bold text-cx-text mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    Uložené úspešne!
                </h2>

                <div className="bg-cx-surface border border-cx-border rounded-xl p-4 w-full max-w-sm mb-8">
                    <div className="flex justify-between py-2 border-b border-cx-border/50">
                        <span className="text-cx-muted">Uložených záznamov:</span>
                        <span className="font-bold text-cx-text">{saveStats.saved}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-cx-muted">Ignorovaných riadkov:</span>
                        <span className="font-bold text-cx-text">{saveStats.ignored}</span>
                    </div>
                    <div className="flex justify-between py-2 mt-1 pt-1 opacity-70 text-xs">
                        <span className="text-cx-muted">Pôvodných súborov:</span>
                        <span className="text-cx-text">{selectedFiles.length}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-sm pb-24 md:pb-0">
                    <button
                        onClick={() => setScreenState('idle')}
                        className="w-full py-3.5 bg-cx-orange text-white rounded font-bold uppercase tracking-wider"
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                        Nahrať ďalšie
                    </button>
                    <button
                        onClick={onBack}
                        className="w-full py-3.5 bg-transparent border-none text-cx-muted hover:text-cx-text rounded font-bold uppercase tracking-wider transition-colors"
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                        Späť na Market
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
