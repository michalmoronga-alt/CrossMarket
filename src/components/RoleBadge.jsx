export default function RoleBadge({ role, className = '' }) {
    const r = role || 'member';

    let bg = '#888888';
    let label = 'MEMBER';

    if (r === 'admin') {
        bg = '#c0392b';
        label = 'ADMIN';
    } else if (r === 'collector') {
        bg = '#3b82f6';
        label = 'COLLECTOR';
    }

    return (
        <span
            className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold text-white shrink-0 inline-flex items-center justify-center ${className}`}
            style={{ backgroundColor: bg }}
        >
            {label}
        </span>
    );
}
