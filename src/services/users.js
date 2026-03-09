import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    collection,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const usersRef = collection(db, 'users');

// Vytvor nového usera (volá admin)
export async function createUser(uid, data) {
    await setDoc(doc(db, 'users', uid), {
        displayName: data.displayName,
        role: data.role || 'member',
        avatarId: data.avatarId || 1,
        active: true,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
    });
}

// Načítaj profil usera
export async function getUser(uid) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    return { uid: docSnap.id, ...docSnap.data() };
}

// Aktualizuj lastSeen
export async function updateLastSeen(uid) {
    await updateDoc(doc(db, 'users', uid), {
        lastSeen: serverTimestamp(),
    });
}

// Načítaj všetkých userov (len admin)
export async function getAllUsers() {
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

// Deaktivuj usera
export async function deactivateUser(uid) {
    await updateDoc(doc(db, 'users', uid), { active: false });
}

// Aktivuj usera
export async function activateUser(uid) {
    await updateDoc(doc(db, 'users', uid), { active: true });
}

// Zmeň rolu usera
export async function updateUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role });
}
