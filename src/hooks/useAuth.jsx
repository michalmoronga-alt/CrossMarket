import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let profileUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    // Posledná aktivita
                    await updateDoc(doc(db, 'users', user.uid), { lastSeen: serverTimestamp() }).catch(e => console.error(e));

                    // Namiesto getDoc použijeme onSnapshot, aby sme mali realtime zmeny (napr. roly)
                    profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
                        if (docSnap.exists()) {
                            setUserProfile({ uid: docSnap.id, ...docSnap.data() });
                        } else {
                            setUserProfile(null);
                        }
                    });
                } catch (err) {
                    console.error('Failed to setup user profile listener:', err);
                    setUserProfile(null);
                }
            } else {
                if (profileUnsubscribe) {
                    profileUnsubscribe();
                    profileUnsubscribe = null;
                }
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    async function login(email, password) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', credential.user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            // User exists in Auth but not in Firestore — auto-create default profile
            const defaultProfile = {
                displayName: email.split('@')[0],
                role: 'member',
                avatarId: 1,
                active: true,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
            };
            await setDoc(userDocRef, defaultProfile);
            setUserProfile({ uid: credential.user.uid, ...defaultProfile });
        } else {
            setUserProfile({ uid: credential.user.uid, ...docSnap.data() });
        }
        return credential.user;
    }

    async function logout() {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
    }

    const value = {
        currentUser,
        userProfile,
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
