import {
    Wrench, Zap, Shield, Target, Flame,
    Skull, Star, Crosshair, Crown, Sword
} from 'lucide-react';

export const avatarIcons = [
    { id: 1, Icon: Wrench, color: '#e8520a' },
    { id: 2, Icon: Zap, color: '#f0b429' },
    { id: 3, Icon: Shield, color: '#3b82f6' },
    { id: 4, Icon: Target, color: '#c0392b' },
    { id: 5, Icon: Flame, color: '#f97316' },
    { id: 6, Icon: Skull, color: '#8b5cf6' },
    { id: 7, Icon: Star, color: '#22c55e' },
    { id: 8, Icon: Crosshair, color: '#14b8a6' },
    { id: 9, Icon: Crown, color: '#ec4899' },
    { id: 10, Icon: Sword, color: '#6b7280' },
];

export function getAvatar(avatarId) {
    return avatarIcons.find(a => a.id === avatarId) || avatarIcons[0];
}
