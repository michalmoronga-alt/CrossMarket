import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    function mapFirebaseError(err) {
        const code = err?.code || err?.message || '';
        if (code === 'no-profile') {
            return 'Účet nebol nájdený. Kontaktuj admina.';
        }
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
            return 'Nesprávny email alebo heslo';
        }
        if (code === 'auth/too-many-requests') {
            return 'Príliš veľa pokusov. Skús neskôr.';
        }
        return 'Chyba prihlásenia. Skús znova.';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Vyplň email a heslo');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(mapFirebaseError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-cx-bg flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        <span className="text-cx-text">CROSS</span>
                        <span className="text-cx-orange">MARKET</span>
                    </h1>
                    <p className="text-cx-muted text-sm mt-1">Clan Market Tracker</p>
                </div>

                {/* Card */}
                <div className="bg-cx-surface border border-cx-border p-8" style={{ borderRadius: '4px' }}>
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="mb-4">
                            <label className="block text-cx-muted text-xs uppercase tracking-wider mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-cx-bg border border-cx-border text-cx-text px-3 py-2.5 text-sm outline-none transition-colors focus:border-cx-orange"
                                style={{ borderRadius: '4px' }}
                                placeholder="email@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label className="block text-cx-muted text-xs uppercase tracking-wider mb-2">
                                Heslo
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-cx-bg border border-cx-border text-cx-text px-3 py-2.5 text-sm outline-none transition-colors focus:border-cx-orange pr-10"
                                    style={{ borderRadius: '4px' }}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cx-muted hover:text-cx-text transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cx-orange text-white font-bold py-2.5 text-sm uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif" }}
                        >
                            {loading && (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {loading ? 'Prihlasujem...' : 'LOGIN'}
                        </button>

                        {/* Error */}
                        {error && (
                            <p className="text-cx-red text-sm text-center mt-4">{error}</p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
