import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const moduleItems = [
    {
        name: 'Defence module "Averter"',
        category: 'module',
        power: 353,
        note: 'Passive module',
        imageUrl: null,
        active: true,
    },
    {
        name: '"Pegasus" engine',
        category: 'module',
        power: 353,
        note: '',
        imageUrl: null,
        active: true,
    },
    {
        name: 'Projectile accelerator "Breakthrough"',
        category: 'module',
        power: 353,
        note: '',
        imageUrl: null,
        active: true,
    },
    {
        name: 'Active defence "Unkill"',
        category: 'module',
        power: 503,
        note: '',
        imageUrl: null,
        active: true,
    },
];

export async function seedModules() {
    console.log('🌱 Spúšťam seed modulov...');

    const itemsRef = collection(db, 'items');
    let createdCount = 0;
    let skippedCount = 0;

    for (const item of moduleItems) {
        // Skontroluj či item s rovnakým menom existuje
        const q = query(itemsRef, where("name", "==", item.name));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            await addDoc(itemsRef, {
                ...item,
                createdAt: serverTimestamp(),
                createdBy: 'seed-modules',
            });
            console.log(`  ➕ Vytvorený modul: ${item.name}`);
            createdCount++;
        } else {
            console.log(`  ⏩ Preskakujem (už existuje): ${item.name}`);
            skippedCount++;
        }
    }

    console.log(`✅ Seed modulov dokončený — Vytvorených: ${createdCount}, Preskočených: ${skippedCount}`);
}
