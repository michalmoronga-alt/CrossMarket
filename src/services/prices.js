import {
    collection,
    doc,
    getDocs,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

function pricesRef(itemId) {
    return collection(db, 'items', itemId, 'prices');
}

// Pridaj cenový záznam pre položku
export async function addPrice(itemId, data, uid) {
    const docRef = await addDoc(pricesRef(itemId), {
        sale: data.sale,
        purchase: data.purchase,
        source: data.source || 'manual',
        addedBy: uid,
        timestamp: serverTimestamp(),
    });
    return docRef.id;
}

// Načítaj históriu cien pre položku (zoradené od najnovšej)
export async function getPrices(itemId, limitCount = 50) {
    const q = query(
        pricesRef(itemId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Real-time listener na ceny jednej položky
export function subscribeToPrices(itemId, callback) {
    const q = query(pricesRef(itemId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const prices = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(prices);
    });
}

// Načítaj poslednú cenu položky
export async function getLastPrice(itemId) {
    const q = query(pricesRef(itemId), orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() };
}
