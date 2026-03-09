import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
    getDocs,
    updateDoc,
    doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const itemImages = {
    // Kabíny
    "Basan": "https://static.wikia.nocookie.net/crossout/images/8/8e/Basan.png/revision/latest/scale-to-width-down/200",
    "Kensei": "https://static.wikia.nocookie.net/crossout/images/9/9e/Kensei.png/revision/latest/scale-to-width-down/200",
    "Gladiator": "https://static.wikia.nocookie.net/crossout/images/4/4e/Gladiator.png/revision/latest/scale-to-width-down/200",
    // Pohyb
    "Bigram": "https://static.wikia.nocookie.net/crossout/images/b/b5/Bigram.png/revision/latest/scale-to-width-down/200",
    "Atom": "https://static.wikia.nocookie.net/crossout/images/a/a0/Atom.png/revision/latest/scale-to-width-down/200",
    // Zbrane
    "Breaker": "https://static.wikia.nocookie.net/crossout/images/3/3e/Breaker.png/revision/latest/scale-to-width-down/200",
    "Porcupine": "https://static.wikia.nocookie.net/crossout/images/8/8c/Porcupine.png/revision/latest/scale-to-width-down/200",
    "Punisher": "https://static.wikia.nocookie.net/crossout/images/6/6e/Punisher.png/revision/latest/scale-to-width-down/200",
    "Hyperion": "https://static.wikia.nocookie.net/crossout/images/5/5e/Hyperion.png/revision/latest/scale-to-width-down/200",
    "CC-18 Typhoon": "https://static.wikia.nocookie.net/crossout/images/2/2e/CC-18_Typhoon.png/revision/latest/scale-to-width-down/200",
    "Firebug": "https://static.wikia.nocookie.net/crossout/images/f/fe/Firebug.png/revision/latest/scale-to-width-down/200",
    "RL-9 Helicon": "https://static.wikia.nocookie.net/crossout/images/1/1e/RL-9_Helicon.png/revision/latest/scale-to-width-down/200",
    "ZS-52 Mastodon": "https://static.wikia.nocookie.net/crossout/images/7/7e/ZS-52_Mastodon.png/revision/latest/scale-to-width-down/200",
    "RA-1 Heather": "https://static.wikia.nocookie.net/crossout/images/4/4a/RA-1_Heather.png/revision/latest/scale-to-width-down/200",
    "Flash I": "https://static.wikia.nocookie.net/crossout/images/e/e5/Flash_I.png/revision/latest/scale-to-width-down/200",
    "Jormungandr": "https://static.wikia.nocookie.net/crossout/images/j/je/Jormungandr.png/revision/latest/scale-to-width-down/200",
    "Scorpion": "https://static.wikia.nocookie.net/crossout/images/s/se/Scorpion.png/revision/latest/scale-to-width-down/200",
    "Muramasa": "https://static.wikia.nocookie.net/crossout/images/m/me/Muramasa.png/revision/latest/scale-to-width-down/200",
    "Ripper": "https://static.wikia.nocookie.net/crossout/images/r/re/Ripper.png/revision/latest/scale-to-width-down/200",
    "Rumble": "https://static.wikia.nocookie.net/crossout/images/r/r0/Rumble.png/revision/latest/scale-to-width-down/200",
    "Thyrsus II": "https://static.wikia.nocookie.net/crossout/images/t/te/Thyrsus_II.png/revision/latest/scale-to-width-down/200",
    "Nemesis": "https://static.wikia.nocookie.net/crossout/images/n/ne/Nemesis.png/revision/latest/scale-to-width-down/200",
    "Destroyer": "https://static.wikia.nocookie.net/crossout/images/d/de/Destroyer.png/revision/latest/scale-to-width-down/200",
    "Charon": "https://static.wikia.nocookie.net/crossout/images/c/ce/Charon.png/revision/latest/scale-to-width-down/200",
};

const seedItems = [
    // Kabíny
    { name: "Basan", category: "cabin", power: 1975, sale: 83126, purchase: 99751, imageUrl: itemImages["Basan"] },
    { name: "Kensei", category: "cabin", power: 1975, sale: 89237, purchase: 107084, imageUrl: itemImages["Kensei"] },
    { name: "Gladiator", category: "cabin", power: 1975, sale: 147466, purchase: 176959, imageUrl: itemImages["Gladiator"] },
    // Pohyb
    { name: "Bigram", category: "movement", power: 167, sale: 12066, purchase: 14479, imageUrl: itemImages["Bigram"] },
    { name: "Atom", category: "movement", power: 137, sale: 16291, purchase: 19550, imageUrl: itemImages["Atom"] },
    // Zbrane
    { name: "Breaker", category: "weapon", power: 2099, sale: 12576, purchase: 15091, imageUrl: itemImages["Breaker"] },
    { name: "Porcupine", category: "weapon", power: 1574, sale: 13917, purchase: 16701, imageUrl: itemImages["Porcupine"] },
    { name: "Punisher", category: "weapon", power: 2099, sale: 14258, purchase: 17109, imageUrl: itemImages["Punisher"] },
    { name: "Hyperion", category: "weapon", power: 2099, sale: 14261, purchase: 17113, imageUrl: itemImages["Hyperion"] },
    { name: "CC-18 Typhoon", category: "weapon", power: 3148, sale: 14408, purchase: 17290, imageUrl: itemImages["CC-18 Typhoon"] },
    { name: "Firebug", category: "weapon", power: 3160, sale: 15989, purchase: 19187, imageUrl: itemImages["Firebug"] },
    { name: "RL-9 Helicon", category: "weapon", power: 3148, sale: 18326, purchase: 21991, imageUrl: itemImages["RL-9 Helicon"] },
    { name: "ZS-52 Mastodon", category: "weapon", power: 3148, sale: 18608, purchase: 22330, imageUrl: itemImages["ZS-52 Mastodon"] },
    { name: "RA-1 Heather", category: "weapon", power: 3148, sale: 19218, purchase: 23062, imageUrl: itemImages["RA-1 Heather"] },
    { name: "Flash I", category: "weapon", power: 2099, sale: 19328, purchase: 23193, imageUrl: itemImages["Flash I"] },
    { name: "Jormungandr", category: "weapon", power: 3148, sale: 20331, purchase: 24397, imageUrl: itemImages["Jormungandr"] },
    { name: "Scorpion", category: "weapon", power: 3148, sale: 21410, purchase: 25692, imageUrl: itemImages["Scorpion"] },
    { name: "Muramasa", category: "weapon", power: 3148, sale: 23472, purchase: 28167, imageUrl: itemImages["Muramasa"] },
];

export async function seedDatabase() {
    console.log('🌱 Spúšťam seed...');

    const itemsRef = collection(db, 'items');
    const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    let itemCount = 0;
    let priceCount = 0;

    for (const item of seedItems) {
        // Vytvor item
        const itemDoc = await addDoc(itemsRef, {
            name: item.name,
            category: item.category,
            power: item.power,
            imageUrl: item.imageUrl || null,
            note: '',
            active: true,
            createdAt: serverTimestamp(),
            createdBy: 'seed',
        });
        itemCount++;

        const pricesRef = collection(db, 'items', itemDoc.id, 'prices');

        // Cena pred 7 dňami (-5%)
        await addDoc(pricesRef, {
            sale: Math.round(item.sale * 0.95),
            purchase: Math.round(item.purchase * 0.95),
            source: 'seed',
            addedBy: 'seed',
            timestamp: sevenDaysAgo,
        });
        priceCount++;

        // Aktuálna cena
        await addDoc(pricesRef, {
            sale: item.sale,
            purchase: item.purchase,
            source: 'seed',
            addedBy: 'seed',
            timestamp: serverTimestamp(),
        });
        priceCount++;

        console.log(`  ✓ ${item.name}`);
    }

    console.log(`✅ Seed dokončený — ${itemCount} položiek, ${priceCount} cenových záznamov`);
}

export async function patchNewItems() {
    console.log('🔄 Spúšťam patch pre existujúce položky...');

    // Načítaj všetky dokumenty z kolekcie items
    const snapshot = await getDocs(collection(db, 'items'));
    const itemsDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundNames = [];

    // Nájdi zhodu podľa name a aktualizuj imageUrl
    for (const dbItem of itemsDb) {
        if (itemImages[dbItem.name]) {
            // Aktualizuj len pole imageUrl
            await updateDoc(doc(db, 'items', dbItem.id), {
                imageUrl: itemImages[dbItem.name]
            });
            console.log(`🖼️  Aktualizovaný obrázok pre: ${dbItem.name}`);
            updatedCount++;
        } else {
            notFoundCount++;
            if (!notFoundNames.includes(dbItem.name)) {
                notFoundNames.push(dbItem.name);
            }
        }
    }

    // Zvyšné položky z patchNewItems ak by neexistovali
    const newItems = [
        { name: "Ripper", category: "weapon", power: 3148 },
        { name: "Rumble", category: "weapon", power: 3148 },
        { name: "Thyrsus II", category: "weapon", power: 3148 },
        { name: "Nemesis", category: "weapon", power: 3148 },
        { name: "Destroyer", category: "weapon", power: 3148 },
        { name: "Charon", category: "weapon", power: 3148 },
    ];

    let createdCount = 0;
    for (const item of newItems) {
        const exists = itemsDb.find(dbItem => dbItem.name === item.name);
        if (!exists) {
            await addDoc(collection(db, 'items'), {
                ...item,
                imageUrl: itemImages[item.name] || null,
                note: "",
                active: true,
                createdAt: serverTimestamp(),
                createdBy: "seed"
            });
            console.log(`➕ Vytvorená nová stíhačka: ${item.name}`);
            createdCount++;
        }
    }

    console.log(`\n✅ Patch obrázkov dokončený:`);
    console.log(`   - Aktualizovaných: ${updatedCount}`);
    console.log(`   - Vytvorených nových: ${createdCount}`);
    console.log(`   - Položky bez prideleného obrázka: ${notFoundCount} (napr. ${notFoundNames.slice(0, 5).join(', ')}...)`);
}
