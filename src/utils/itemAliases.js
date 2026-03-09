export const ITEM_ALIASES = {
    "CC18 Typhoon": "CC-18 Typhoon",
    "CC 18 Typhoon": "CC-18 Typhoon",
    "Jormungand": "Jormungandr",
    "Jörmungandr": "Jormungandr",
    "RL9 Helicon": "RL-9 Helicon",
    "RL 9 Helicon": "RL-9 Helicon",
    "ZS52 Mastodon": "ZS-52 Mastodon",
    "ZS 52 Mastodon": "ZS-52 Mastodon",
    "RA1 Heather": "RA-1 Heather",
    "RA 1 Heather": "RA-1 Heather",
    "Thyrsus": "Thyrsus II",
};

export function resolveAlias(name) {
    if (!name) return name;
    return ITEM_ALIASES[name.trim()] ?? name.trim();
}

// Jednoduchý fuzzy match — Levenshtein distance
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

// Vráti canonical item name zo zoznamu itemov (items = [{id, name}])
// Ak zhoda > 90% (distance / maxLen < 0.1) → vráti match
// Inak → vráti null
export function fuzzyMatchItem(ocrName, items) {
    const resolved = resolveAlias(ocrName);
    const lower = resolved.toLowerCase();
    let best = null, bestDist = Infinity;
    for (const item of items) {
        const dist = levenshtein(lower, item.name.toLowerCase());
        if (dist < bestDist) { bestDist = dist; best = item; }
    }
    if (!best) return null;
    const maxLen = Math.max(resolved.length, best.name.length);
    const score = 1 - bestDist / maxLen;
    return { item: best, score, exact: bestDist === 0 };
}

// Vráti true ak je cena podozrivá
// Pravidlá:
// - sale > purchase → podozrivé (trh zvyčajne purchase > sale)
// - ak je history (pole čísel sale), cena mimo 10x priemer → podozrivé
export function isSuspiciousPrice(sale, purchase, saleHistory = []) {
    if (sale > purchase) return true;
    if (saleHistory.length >= 3) {
        const avg = saleHistory.reduce((a, b) => a + b, 0) / saleHistory.length;
        if (sale > avg * 10 || sale < avg / 10) return true;
    }
    return false;
}
