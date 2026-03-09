// 12576 → "12 576"
export function formatCoins(number) {
    if (number == null) return '—';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// 0.032 → "+3.2%"  |  -0.032 → "-3.2%"
export function formatPercent(number) {
    if (number == null) return '—';
    const sign = number >= 0 ? '+' : '';
    return `${sign}${(number * 100).toFixed(1)}%`;
}

export function proxyImageUrl(url) {
    if (!url) return null;
    if (url.includes('wikia.nocookie.net') || url.includes('wikia.com')) {
        return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    }
    return url;
}
