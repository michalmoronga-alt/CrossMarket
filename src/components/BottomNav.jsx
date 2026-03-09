import { LayoutGrid, Camera, Settings, UserCircle, Activity } from 'lucide-react';
import { getAvatar } from '../utils/avatars';

export default function BottomNav({ screen, onNavigate, userProfile }) {
    const isVisible = ['market', 'upload', 'profile', 'settings', 'signal'].includes(screen);
    if (!isVisible) return null;

    const avatar = getAvatar(userProfile?.avatarId);
    const { Icon, color } = avatar;

    return (
        <div className="fixed top-auto bottom-0 left-0 right-0 bg-cx-surface border-t border-cx-border h-[60px] flex items-center justify-around z-50 md:hidden">
            {/* Market */}
            <button
                onClick={() => onNavigate('market')}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors cursor-pointer ${screen === 'market' ? 'text-cx-orange' : 'text-cx-muted hover:text-cx-text'}`}
            >
                <LayoutGrid size={20} />
                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Market</span>
            </button>

            {/* Upload FAB */}
            <div className="relative flex items-center justify-center -top-6">
                <button
                    onClick={() => onNavigate('upload')}
                    className="w-[56px] h-[56px] bg-cx-orange rounded-full flex items-center justify-center text-white shadow-lg shadow-cx-orange/30 hover:scale-105 transition-transform cursor-pointer ring-4 ring-cx-bg"
                >
                    <Camera size={24} />
                </button>
            </div>

            {/* Signal */}
            <button
                onClick={() => onNavigate('signal')}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors cursor-pointer ${screen === 'signal' ? 'text-cx-orange' : 'text-cx-muted hover:text-cx-text'}`}
            >
                <Activity size={20} />
                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Signal</span>
            </button>

            {/* Profile */}
            <button
                onClick={() => onNavigate('profile')}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors cursor-pointer ${screen === 'profile' ? 'text-cx-orange' : 'text-cx-muted hover:text-cx-text'}`}
            >
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${screen === 'profile' ? 'ring-2 ring-cx-orange ring-offset-2 ring-offset-cx-surface scale-110' : ''}`}
                    style={{ backgroundColor: color + '22', border: `2px solid ${color}` }}
                >
                    <Icon size={14} color={color} />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Profil</span>
            </button>

            {/* Settings (Admin only) */}
            {userProfile?.role === 'admin' && (
                <button
                    onClick={() => onNavigate('settings')}
                    className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors cursor-pointer ${screen === 'settings' ? 'text-cx-orange' : 'text-cx-muted hover:text-cx-text'}`}
                >
                    <Settings size={20} />
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>Admin</span>
                </button>
            )}
        </div>
    );
}
