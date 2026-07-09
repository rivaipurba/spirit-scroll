import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export function Login() {
    const { login } = useAuth();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }
        setIsLoading(true);
        setError('');
        const result = await login(password);
        if (!result.success) {
            setError(result.error || 'Invalid password');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-mal-page flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mal-blue shadow-lg shadow-mal-blue/25 mb-4">
                        <Lock size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-mal-text mb-1">SpiritScroll</h1>
                    <p className="text-mal-text-secondary text-sm">Enter your password to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 bg-mal-card border border-mal-border rounded-xl text-mal-text placeholder-mal-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all pr-12 shadow-sm"
                            autoFocus
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-mal-text-secondary hover:text-white transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-mal-red/15 border border-mal-red/30 rounded-xl text-mal-red text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-mal-blue hover:bg-mal-blue-dark text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                <p className="text-center text-mal-text-secondary/50 text-xs mt-6">
                    Personal media tracker
                </p>
            </div>
        </div>
    );
}
