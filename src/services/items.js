import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const itemsRef = collection(db, 'items');

// Načítaj všetky aktívne položky alebo všetky
export async function getItems(includeArchived = false) {
    const q = includeArchived ? query(itemsRef) : query(itemsRef, where('active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// Načítaj jednu položku podľa ID
export async function getItem(itemId) {
    const docSnap = await getDoc(doc(db, 'items', itemId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
}

// Pridaj novú položku (len admin)
export async function addItem(data, uid) {
    const docRef = await addDoc(itemsRef, {
        name: data.name,
        category: data.category,
        power: data.power || null,
        imageUrl: data.imageUrl || null,
        note: data.note || '',
        active: true,
        createdAt: serverTimestamp(),
        createdBy: uid,
    });
    return docRef.id;
}

// Aktualizuj položku
export async function updateItem(itemId, data) {
    await updateDoc(doc(db, 'items', itemId), data);
}

// Archivuj položku (active = false, NEMAZ)
export async function archiveItem(itemId) {
    console.log('archiving:', itemId);
    await updateDoc(doc(db, 'items', itemId), { active: false });
}

// Zmaž položku
export async function deleteItem(itemId) {
    await deleteDoc(doc(db, 'items', itemId));
}

// Real-time listener na všetky aktívne položky
// Vráti unsubscribe funkciu
export function subscribeToItems(callback) {
    const q = query(itemsRef, where('active', '==', true));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        callback(items);
    });
}

// Real-time listener na vsetky polozky
export function subscribeToAllItems(callback) {
    const q = query(itemsRef);
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.name.localeCompare(b.name));
        callback(items);
    });
}
