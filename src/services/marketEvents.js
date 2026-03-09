import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, where } from 'firebase/firestore';

export async function addMarketEvent({ type, label, affectedItems, startDate, endDate, note }) {
    return await addDoc(collection(db, 'marketEvents'), {
        type,
        label,
        affectedItems,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
        note: note || '',
        createdAt: Timestamp.now()
    });
}

export async function getMarketEvents() {
    const snap = await getDocs(collection(db, 'marketEvents'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteMarketEvent(eventId) {
    return await deleteDoc(doc(db, 'marketEvents', eventId));
}

export async function getEventsForItem(itemId) {
    const q = query(
        collection(db, 'marketEvents'),
        where('affectedItems', 'array-contains', itemId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
