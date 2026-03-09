const KEY = (uid) => `crossmarket_pins_${uid}`;

export function getPins(uid) {
    try {
        return JSON.parse(localStorage.getItem(KEY(uid)) || '[]');
    } catch { return []; }
}

export function togglePin(uid, itemId) {
    const pins = getPins(uid);
    const idx = pins.indexOf(itemId);
    if (idx !== -1) {
        pins.splice(idx, 1);
    } else {
        if (pins.length >= 5) return { error: 'max' };
        pins.push(itemId);
    }
    localStorage.setItem(KEY(uid), JSON.stringify(pins));
    return { pins };
}

export function isPinned(uid, itemId) {
    return getPins(uid).includes(itemId);
}
