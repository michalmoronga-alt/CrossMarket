import { LayoutGrid, Camera, Settings, User, Activity } from 'lucide-react';
import { getAvatar } from '../utils/avatars';
import RoleBadge from './RoleBadge';

export default function Sidebar({ screen, onNavigate, userProfile }) {
    const isVisible = ['market', 'upload', 'profile', 'settings', 'signal'].includes(screen);
    if (!isVisible) return null;

    const avatar = getAvatar(userProfile?.avatarId);
    const { Icon, color } = avatar;

    const navItems = [
        { id: 'market', label: 'Market', icon: <LayoutGrid size={20} /> },
        { id: 'upload', label: 'Upload', icon: <Camera size={20} /> },
        { id: 'signal', label: 'Signal', icon: <Activity size={20} /> },
        { id: 'profile', label: 'Profil', icon: <User size={20} /> },
    ];

    if (userProfile?.role === 'admin') {
        navItems.push({ id: 'settings', label: 'Nastavenia', icon: <Settings size={20} /> });
    }

    return (
        <div className="w-[220px] h-screen bg-cx-surface border-r border-cx-border flex flex-col sticky top-0 hidden md:flex shrink-0">
            {/* Logo */}
            <div className="p-6">
                <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    <span className="text-cx-text">CROSS</span>
                    <br />
                    <span className="text-cx-orange">MARKET</span>
                </h1>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-3 py-4 flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = screen === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded text-left transition-all cursor-pointer font-bold ${isActive
                                ? 'bg-cx-orange/10 text-cx-orange border-l-2 border-cx-orange shadow-[inset_2px_0_0_0_rgba(232,82,10,1)] pl-3'
                                : 'text-cx-muted hover:text-cx-text hover:bg-cx-bg border-l-2 border-transparent'
                                }`}
                            style={{ fontFamily: "'Rajdhani', sans-serif" }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* User Profile Snippet */}
            <div
                className="p-4 border-t border-cx-border flex items-center gap-3 hover:bg-cx-bg transition-colors cursor-pointer"
                onClick={() => onNavigate('profile')}
            >
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: color + '22', border: `2px solid ${color}` }}
                >
                    <Icon size={20} color={color} />
                </div>
                <div className="flex flex-col min-w-0 items-start">
                    <span className="text-sm font-bold text-cx-text truncate max-w-full" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {userProfile?.displayName || 'Hráč'}
                    </span>
                    <RoleBadge role={userProfile?.role} className="mt-0.5" />
                </div>
            </div>
        </div>
    );
}
