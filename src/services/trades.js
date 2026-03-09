import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';

export async function addTrade({ uid, itemId, boughtAt, targetSell, note }) {
    return await addDoc(collection(db, 'trades'), {
        uid,
        itemId,
        boughtAt: Number(boughtAt),
        boughtDate: Timestamp.now(),
        targetSell: Number(targetSell),
        status: 'open',
        soldAt: null,
        soldDate: null,
        note: note || '',
        createdAt: Timestamp.now()
    });
}

export async function getUserTrades(uid) {
    const q = query(
        collection(db, 'trades'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function closeTrade(tradeId, soldAt) {
    return await updateDoc(doc(db, 'trades', tradeId), {
        soldAt: Number(soldAt),
        soldDate: Timestamp.now(),
        status: 'closed'
    });
}
