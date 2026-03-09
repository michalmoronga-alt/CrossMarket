import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, PackagePlus, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getAllUsers, deactivateUser, activateUser, createUser, updateUserRole } from '../services/users';
import { subscribeToAllItems, addItem, updateItem, archiveItem, deleteItem, getItems } from '../services/items';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getAvatar } from '../utils/avatars';
import RoleBadge from '../components/RoleBadge';
import { addMarketEvent, getMarketEvents, deleteMarketEvent } from '../services/marketEvents';

export default function SettingsScreen({ onBack }) {
    const { currentUser, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    if (userProfile?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-cx-bg flex flex-col">
                <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-cx-border bg-cx-bg">
                    <button onClick={onBack} className="p-1 -ml-1 text-cx-text hover:text-cx-orange transition-colors cursor-pointer">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Prístup odmietnutý</h1>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-cx-red font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Nemáš oprávnenie zobraziť túto sekciu.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cx-bg flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-20 flex flex-col border-b border-cx-border bg-cx-bg">
                <div className="flex items-center gap-3 px-4 py-4">
                    <button onClick={onBack} className="p-1 -ml-1 text-cx-text hover:text-cx-orange transition-colors cursor-pointer">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Nastavenia</h1>
                </div>

                {/* Taby */}
                <div className="flex px-4 gap-4">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb - 3 border - b - 2 font - medium transition - colors ${activeTab === 'users' ? 'border-cx-orange text-cx-orange' : 'border-transparent text-cx-muted hover:text-cx-text'} `}
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                        👥 Používatelia
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`pb - 3 border - b - 2 font - medium transition - colors ${activeTab === 'items' ? 'border-cx-orange text-cx-orange' : 'border-transparent text-cx-muted hover:text-cx-text'} `}
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                        📦 Položky
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 pb-24 max-w-md mx-auto w-full">
                {activeTab === 'users' ? <UsersTab currentUser={currentUser} /> : (
                    <div className="flex flex-col">
                        <ItemsTab />
                        <MarketEventsSection />
                    </div>
                )}
                <UploadLogSection />
            </div>
        </div>
    );
}

// -----------------------------------------
// USERS TAB
// -----------------------------------------
function UsersTab({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active, archived, all

    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'member', avatarId: 1 });
    const [showPassword, setShowPassword] = useState(false);
    const [formState, setFormState] = useState({ loading: false, error: '', success: '' });
    const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await getAllUsers(); // Fetch all including archived
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(user => {
        if (filter === 'active') return user.active !== false;
        if (filter === 'archived') return user.active === false;
        return true;
    });

    async function handleCreateUser() {
        if (!formData.name || !formData.email || !formData.password) {
            setFormState({ loading: false, error: 'Vyplň všetky polia', success: '' });
            return;
        }
        if (formData.password.length < 6) {
            setFormState({ loading: false, error: 'Heslo musí mať min. 6 znakov', success: '' });
            return;
        }

        setFormState({ loading: true, error: '', success: '' });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
            const newUid = userCredential.user.uid;
            await createUser(newUid, {
                displayName: formData.name.trim(),
                role: formData.role,
                avatarId: formData.avatarId
            });

            setFormState({ loading: false, error: '', success: `Účet vytvorený: ${formData.name}. Boli ste doň prihlásený.` });
            setFormVisible(false);
            setFormData({ name: '', email: '', password: '', role: 'member', avatarId: 1 });
            loadUsers();
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/email-already-in-use') msg = 'Email je už použitý';
            if (err.code === 'auth/invalid-email') msg = 'Neplatný format emailu';
            setFormState({ loading: false, error: msg, success: '' });
        }
    }

    async function handleReset(user) {
        // Tu zistíme email z auth, ale my ho nemáme vyexponovaný vo firestore (bezpečnosť), 
        // prompt predpokladal `userEmail`. Ak sme si uchovávali email, fajn. 
        // V P2 sme ho do Firestore neukladali. P2 prompt: "name, role, avatarId, createdAt".
        // Ako admin viem resetnúť heslo len ak viem presný e-mail.
        // Prompt hovorí: "import { sendPasswordResetEmail } zober userEmail" - budeme si
        // musieť email vziať od admina prompt okne, keďže ho nepoznáme z Firestore profilu.
        const userEmail = window.prompt(`Zadaj presný e - mail pre používateľa: ${user.displayName || 'Hráč'} na reset hesla: `);
        if (!userEmail) return;

        try {
            await sendPasswordResetEmail(auth, userEmail.trim());
            alert(`Reset email odoslaný na ${userEmail} `);
        } catch (err) {
            alert('Chyba: ' + err.message);
        }
    }

    async function handleToggleActive(user) {
        try {
            if (user.active === false) {
                await activateUser(user.uid);
            } else {
                await deactivateUser(user.uid);
            }
            setConfirmDeactivateId(null);
            loadUsers();
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleChangeRole(user, newRole) {
        if (user.role === newRole) return;
        try {
            await updateUserRole(user.uid, newRole);
            loadUsers();
        } catch (err) {
            alert('Chyba: ' + err.message);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {!formVisible && (
                <button
                    onClick={() => setFormVisible(true)}
                    className="w-full py-3 bg-cx-surface border border-cx-border hover:border-cx-orange transition-colors flex items-center justify-center gap-2 text-cx-text font-bold rounded"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                    <UserPlus size={18} /> Pridať používateľa
                </button>
            )}

            {formState.success && <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded text-sm">{formState.success}</div>}

            {formVisible && (
                <div className="bg-cx-surface p-4 border border-cx-border rounded-lg flex flex-col gap-3">
                    <h3 className="font-bold text-cx-text mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Nový používateľ</h3>

                    {formState.error && <p className="text-cx-red text-sm">{formState.error}</p>}

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Meno</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange" />
                    </div>
                    <div className="flex flex-col gap-1 relative">
                        <label className="text-xs text-cx-muted">Heslo</label>
                        <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange w-full" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-6 text-cx-muted hover:text-cx-text p-1 cursor-pointer">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Rola</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange">
                            <option value="member">Member</option>
                            <option value="collector">Collector</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Avatar ID</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button key={num} type="button" onClick={() => setFormData({ ...formData, avatarId: num })} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${formData.avatarId === num ? 'bg-cx-orange text-white' : 'bg-cx-bg border border-cx-border text-cx-muted hover:text-cx-text cursor-pointer'}`}>
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button onClick={handleCreateUser} disabled={formState.loading} className="flex-1 bg-cx-orange text-white py-2 rounded font-bold transition-opacity disabled:opacity-50" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {formState.loading ? 'Vytváram...' : 'Vytvoriť'}
                        </button>
                        <button onClick={() => setFormVisible(false)} className="flex-1 bg-cx-bg border border-cx-border text-cx-text py-2 rounded font-bold hover:border-cx-muted transition-colors" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Zrušiť
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 mt-2">
                {loading ? (
                    <div className="flex justify-center p-6"><Loader className="animate-spin text-cx-orange" /></div>
                ) : (
                    <>
                        <div className="flex gap-2 p-1 bg-cx-surface border border-cx-border rounded">
                            {[
                                { key: 'active', label: 'Aktívni' },
                                { key: 'archived', label: 'Deaktivovaní' },
                                { key: 'all', label: 'Všetci' }
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`flex-1 py-1 text-xs font-bold rounded uppercase tracking-wider transition-colors ${filter === f.key ? 'bg-cx-bg text-cx-orange border border-cx-border shadow-sm' : 'text-cx-muted hover:text-cx-text border border-transparent'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        {filteredUsers.map(user => {
                            const isArchived = user.active === false;
                            const avatarData = getAvatar(user.avatarId || 1);
                            const AvatarIcon = avatarData.Icon;
                            const avatarColor = avatarData.color;
                            const isSelf = user.uid === currentUser?.uid;
                            const dateStr = user.lastSeen ? new Date(user.lastSeen?.toMillis?.() || user.lastSeen).toLocaleDateString('sk-SK') : '—';

                            return (
                                <div key={user.uid} className={`bg-cx-surface border border-cx-border rounded p-4 flex flex-col gap-3 ${isArchived ? 'opacity-60 grayscale' : ''}`}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-3">
                                            {/* Avatar */}
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: avatarColor + '22', border: `2px solid ${avatarColor}` }}
                                            >
                                                <AvatarIcon size={20} color={avatarColor} />
                                            </div>

                                            {/* Detail */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-cx-text truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{user.displayName || 'Hráč'}</h3>
                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                    <RoleBadge role={user.role} />
                                                    <span className="text-cx-muted truncate">Aktivita: {dateStr}</span>
                                                    {isArchived && <span className="text-cx-red font-bold">DEAKTIVOVANÝ</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!isSelf && (
                                        <div className="flex flex-col gap-2 border-t border-cx-border pt-3 mt-1">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleChangeRole(user, 'member')} disabled={user.role === 'member'} className={`px-3 py-1 flex-1 border rounded text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${user.role === 'member' ? 'bg-cx-orange border-cx-orange text-white' : 'bg-cx-bg border-cx-border text-cx-muted hover:text-cx-text'}`}>
                                                    Member
                                                </button>
                                                <button onClick={() => handleChangeRole(user, 'collector')} disabled={user.role === 'collector'} className={`px-3 py-1 flex-1 border rounded text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${user.role === 'collector' ? 'bg-cx-orange border-cx-orange text-white' : 'bg-cx-bg border-cx-border text-cx-muted hover:text-cx-text'}`}>
                                                    Collector
                                                </button>
                                                <button onClick={() => handleChangeRole(user, 'admin')} disabled={user.role === 'admin'} className={`px-3 py-1 flex-1 border rounded text-xs transition-colors cursor-pointer disabled:cursor-not-allowed ${user.role === 'admin' ? 'bg-cx-orange border-cx-orange text-white' : 'bg-cx-bg border-cx-border text-cx-muted hover:text-cx-text'}`}>
                                                    Admin
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleReset(user)} className="flex-1 px-3 py-1.5 bg-cx-bg border border-cx-border rounded text-xs text-cx-text hover:border-cx-muted transition-colors cursor-pointer">
                                                    Reset hesla
                                                </button>
                                                {isArchived ? (
                                                    <button onClick={() => handleToggleActive(user)} className="flex-[1.5] px-3 py-1.5 border rounded text-xs transition-colors cursor-pointer bg-cx-orange/10 border-cx-orange text-cx-orange hover:bg-cx-orange hover:text-white">
                                                        Aktivovať
                                                    </button>
                                                ) : confirmDeactivateId === user.uid ? (
                                                    <div className="flex-[1.5] flex gap-1">
                                                        <button onClick={() => handleToggleActive(user)} className="flex-1 px-2 py-1.5 bg-red-500 border border-red-500 rounded text-xs text-white font-bold transition-colors cursor-pointer">Deaktivovať</button>
                                                        <button onClick={() => setConfirmDeactivateId(null)} className="flex-1 px-2 py-1.5 bg-cx-bg border border-cx-border rounded text-xs text-cx-text font-bold transition-colors cursor-pointer">Zrušiť</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeactivateId(user.uid)} className="flex-[1.5] px-3 py-1.5 border rounded text-xs transition-colors cursor-pointer bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white">
                                                        Deaktivovať
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}

// -----------------------------------------
// ITEMS TAB
// -----------------------------------------
function ItemsTab() {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState('active'); // active, archived, all
    const [editingItem, setEditingItem] = useState(null); // null, { id: 'new', ... } alebo { id: '123', ... }
    const [formLoading, setFormLoading] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToAllItems((data) => {
            setItems(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredItems = items.filter(it => {
        if (filter === 'active') return it.active !== false;
        if (filter === 'archived') return it.active === false;
        return true;
    });

    function openNewForm() {
        setEditingItem({
            id: 'new',
            name: '',
            category: 'weapon',
            power: '',
            imageUrl: '',
            note: ''
        });
    }

    async function handleSaveItem() {
        if (!editingItem.name) {
            alert('Názov je povinný');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                name: editingItem.name,
                category: editingItem.category,
                power: editingItem.power ? Number(editingItem.power) : null,
                imageUrl: editingItem.imageUrl,
                note: editingItem.note
            };

            if (editingItem.id === 'new') {
                await addItem(payload, currentUser.uid);
            } else {
                await updateItem(editingItem.id, payload);
            }
            setEditingItem(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setFormLoading(false);
        }
    }

    async function handleArchive(item) {
        try {
            await archiveItem(item.id);
        } catch (err) {
            alert('Chyba pri archivácii: ' + err.message);
        }
    }

    async function handleRestore(item) {
        try {
            await updateItem(item.id, { active: true });
        } catch (err) {
            alert('Chyba pri obnove: ' + err.message);
        }
    }

    async function handleDelete(item) {
        try {
            await deleteItem(item.id);
            setConfirmDeleteId(null);
        } catch (err) {
            alert('Chyba pri mazaní: ' + err.message);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 p-1 bg-cx-surface border border-cx-border rounded">
                {[
                    { key: 'active', label: 'Aktívne' },
                    { key: 'archived', label: 'Archivované' },
                    { key: 'all', label: 'Všetky' }
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex-1 py-1 text-xs font-bold rounded uppercase tracking-wider transition-colors ${filter === f.key ? 'bg-cx-bg text-cx-orange border border-cx-border shadow-sm' : 'text-cx-muted hover:text-cx-text border border-transparent'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {!editingItem && filter !== 'archived' && (
                <button
                    onClick={openNewForm}
                    className="w-full py-3 bg-cx-surface border border-cx-border hover:border-cx-orange transition-colors flex items-center justify-center gap-2 text-cx-text font-bold rounded"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                    <PackagePlus size={18} /> Pridať položku
                </button>
            )}

            {editingItem && (
                <div className="bg-cx-surface p-4 border border-cx-orange rounded-lg flex flex-col gap-3">
                    <h3 className="font-bold text-cx-orange mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {editingItem.id === 'new' ? 'Nová položka' : 'Upraviť položku'}
                    </h3>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Názov</label>
                        <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text" />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs text-cx-muted">Kategória</label>
                            <select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text">
                                <option value="weapon">Weapon</option>
                                <option value="cabin">Cabin</option>
                                <option value="movement">Movement</option>
                                <option value="module">Module</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs text-cx-muted">Power</label>
                            <input type="number" value={editingItem.power} onChange={e => setEditingItem({ ...editingItem, power: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Image URL (voliteľné)</label>
                        <input type="text" placeholder="https://..." value={editingItem.imageUrl} onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Poznámka</label>
                        <textarea value={editingItem.note} onChange={e => setEditingItem({ ...editingItem, note: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text min-h-[60px]" />
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button onClick={handleSaveItem} disabled={formLoading} className="flex-1 bg-cx-orange text-white py-2 rounded font-bold transition-opacity disabled:opacity-50" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {formLoading ? 'Ukladám...' : 'Uložiť'}
                        </button>
                        <button onClick={() => setEditingItem(null)} className="flex-1 bg-cx-bg border border-cx-border text-cx-text py-2 rounded font-bold hover:border-cx-muted transition-colors" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            Zrušiť
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 mt-2 pb-10">
                {loading ? (
                    <div className="flex justify-center p-6"><Loader className="animate-spin text-cx-orange" /></div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-cx-muted">
                        <PackagePlus className="mb-2 opacity-50" size={32} />
                        <p style={{ fontFamily: "'Rajdhani', sans-serif" }}>Žiadne položky</p>
                    </div>
                ) : filteredItems.map(item => {
                    const isArchived = item.active === false;

                    return (
                        <div key={item.id} className={`p-3 bg-cx-surface border border-cx-border rounded flex flex-col gap-3 ${isArchived ? 'opacity-60 grayscale' : ''}`}>
                            <div>
                                <h3 className="font-bold text-cx-text truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{item.name}</h3>
                                <p className="text-xs text-cx-muted capitalize">{item.category} {item.power ? `· P${item.power} ` : ''}</p>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingItem({
                                    id: item.id,
                                    name: item.name,
                                    category: item.category,
                                    power: item.power || '',
                                    imageUrl: item.imageUrl || '',
                                    note: item.note || ''
                                })} className="px-3 py-1 bg-cx-bg border border-cx-border rounded text-xs text-cx-text hover:border-cx-muted transition-colors">
                                    Upraviť
                                </button>

                                {isArchived ? (
                                    <>
                                        {filter === 'archived' && (
                                            confirmDeleteId === item.id ? (
                                                <div className="flex gap-1 shrink-0">
                                                    <button onClick={() => handleDelete(item)} className="px-3 py-1 bg-red-500 border border-red-500 text-white rounded text-xs font-bold transition-colors cursor-pointer">Natrvalo</button>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 bg-cx-bg border border-cx-border text-cx-text rounded text-xs font-bold transition-colors cursor-pointer">Zrušiť</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmDeleteId(item.id)} className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-cx-red rounded text-xs transition-colors cursor-pointer">
                                                    🗑️ Natrvalo zmazať
                                                </button>
                                            )
                                        )}
                                        <button onClick={() => handleRestore(item)} className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 rounded text-xs transition-colors">
                                            Obnoviť
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => handleArchive(item)} className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-xs transition-colors">
                                        Archivovať
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// -----------------------------------------
// UPLOAD LOG SECTION
// -----------------------------------------
function UploadLogSection() {
    const [logs, setLogs] = useState([]);
    const [usersMap, setUsersMap] = useState({});

    useEffect(() => {
        async function fetchLogs() {
            try {
                // Fetch users for mapping UID -> Name
                const usersCache = {};
                try {
                    const allU = await getAllUsers();
                    allU.forEach(u => { usersCache[u.uid] = u.displayName || 'Hráč'; });
                    setUsersMap(usersCache);
                } catch (e) { console.error("Could not fetch users for log mapping", e); }

                const q = query(collection(db, 'uploadLog'), orderBy('timestamp', 'desc'), limit(10));
                const snap = await getDocs(q);
                setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Failed to fetch logs", err);
            }
        }
        fetchLogs();
    }, []);

    if (logs.length === 0) return null;

    return (
        <div className="mt-8 border-t border-cx-border pt-6 pb-6">
            <h3 className="font-bold text-cx-text mb-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Posledné uploady</h3>
            <div className="flex flex-col gap-2">
                {logs.map(log => {
                    const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
                    const dateStr = d.toLocaleString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    const userName = usersMap[log.uid] || `UID: ${log.uid.slice(0, 5)}...`;

                    return (
                        <div key={log.id} className="text-[11px] text-cx-muted flex gap-2 items-start py-1.5 border-b border-cx-border/50 last:border-0">
                            <span className="shrink-0">{dateStr}</span>
                            <span className="truncate flex-1 font-bold text-cx-text" title={log.uid}>{userName}</span>
                            <span className="shrink-0">extrahovaných: <span className="text-cx-text font-bold">{log.itemsExtracted}</span></span>
                            <span className="shrink-0">uložených: <span className="text-cx-orange font-bold">{log.itemsConfirmed}</span></span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// -----------------------------------------
// MARKET EVENTS SECTION
// -----------------------------------------
function MarketEventsSection() {
    const [events, setEvents] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [formData, setFormData] = useState({
        type: 'event',
        label: '',
        affectedItems: [],
        startDate: '',
        endDate: '',
        note: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const evts = await getMarketEvents();
            evts.sort((a, b) => b.startDate.seconds - a.startDate.seconds);
            setEvents(evts);

            const fetchedItems = await getItems();
            setItems(fetchedItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddEvent(e) {
        e.preventDefault();
        if (!formData.label || !formData.type || !formData.startDate) {
            alert('Vyplň povinné polia (typ, label, začiatok).');
            return;
        }
        setFormLoading(true);
        try {
            await addMarketEvent(formData);
            setFormData({
                type: 'event',
                label: '',
                affectedItems: [],
                startDate: '',
                endDate: '',
                note: ''
            });
            loadData();
        } catch (err) {
            alert(err.message);
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDeleteEvent(eventId) {
        try {
            await deleteMarketEvent(eventId);
            setConfirmDeleteId(null);
            loadData();
        } catch (err) {
            alert(err.message);
        }
    }

    function toggleItem(itemId) {
        setFormData(prev => {
            const newItems = prev.affectedItems.includes(itemId)
                ? prev.affectedItems.filter(id => id !== itemId)
                : [...prev.affectedItems, itemId];
            return { ...prev, affectedItems: newItems };
        });
    }

    return (
        <div className="mt-8 border-t border-cx-border pt-6 pb-6">
            <h2 className="text-xl font-bold text-cx-text mb-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Market Eventy</h2>

            <div className="bg-cx-surface p-4 border border-cx-border rounded-lg flex flex-col gap-4 mb-6">
                <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Typ</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange">
                            <option value="crafting">crafting</option>
                            <option value="battlepass">battlepass</option>
                            <option value="event">event</option>
                            <option value="patch">patch</option>
                            <option value="availability">availability</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Label</label>
                        <input type="text" placeholder="napr. Breaker craftiteľný (Underground factory)" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Ovplyvnené položky</label>
                        <div className="max-h-32 overflow-y-auto bg-cx-bg border border-cx-border rounded p-2 flex flex-col gap-2">
                            {items.map(item => (
                                <label key={item.id} className="flex items-center gap-2 text-sm text-cx-text cursor-pointer">
                                    <input type="checkbox" checked={formData.affectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="accent-cx-orange" />
                                    {item.name}
                                </label>
                            ))}
                            {items.length === 0 && <span className="text-xs text-cx-muted">Načítavam položky...</span>}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs text-cx-muted">Začiatok</label>
                            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange [color-scheme:dark]" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-xs text-cx-muted">Koniec (voliteľné)</label>
                            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange [color-scheme:dark]" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-cx-muted">Poznámka (voliteľné)</label>
                        <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="bg-cx-bg border border-cx-border rounded p-2 text-sm text-cx-text outline-none focus:border-cx-orange min-h-[60px]" />
                    </div>

                    <button type="submit" disabled={formLoading} className="w-full bg-cx-orange text-white py-2 rounded font-bold transition-opacity disabled:opacity-50 mt-2 hover:opacity-90 cursor-pointer" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {formLoading ? 'Pridávam...' : 'Pridať event'}
                    </button>
                </form>
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="font-bold text-cx-text" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Existujúce eventy</h3>
                {loading ? (
                    <div className="flex justify-center p-6"><Loader className="animate-spin text-cx-orange" /></div>
                ) : events.length === 0 ? (
                    <p className="text-sm text-cx-muted">Zatiaľ žiadne eventy.</p>
                ) : (
                    events.map(evt => {
                        const sDate = evt.startDate?.toDate ? evt.startDate.toDate().toLocaleDateString('sk-SK') : '';
                        return (
                            <div key={evt.id} className="flex items-center justify-between p-3 bg-cx-surface border border-cx-border rounded">
                                <div className="flex flex-col min-w-0 pr-4">
                                    <h4 className="font-bold text-cx-text truncate text-sm" style={{ fontFamily: "'Rajdhani', sans-serif" }}>{evt.label}</h4>
                                    <p className="text-xs text-cx-muted capitalize">{evt.type} • {sDate ? `od ${sDate}` : ''}</p>
                                </div>
                                {confirmDeleteId === evt.id ? (
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => handleDeleteEvent(evt.id)} className="text-xs text-red-500 font-bold px-2 py-1 bg-red-500/10 rounded cursor-pointer">Zmazať</button>
                                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-cx-muted px-2 py-1 rounded cursor-pointer">Zrušiť</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setConfirmDeleteId(evt.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors shrink-0 cursor-pointer" title="Zmazať event">
                                        🗑️
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
