import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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
        <div className="min-h-dvh bg-paper text-ink flex items-center justify-center px-4 py-12">
            <main className="w-full max-w-sm">
                <h1 className="text-[clamp(2.5rem,10vw,3.5rem)] leading-none text-ink mb-3">SpiritScroll</h1>
                <p className="text-md text-ink-2 mb-8">Enter your password to continue</p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="login-password" className="label">Password</label>
                        <div className="relative">
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                aria-invalid={Boolean(error)}
                                aria-describedby={error ? 'login-error' : undefined}
                                className="field pr-12 min-h-12"
                                autoFocus
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="btn btn-quiet btn-icon absolute right-1 top-1/2 -translate-y-1/2"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p id="login-error" role="alert" className="flex items-center gap-2 text-sm text-ink">
                            <AlertCircle size={16} className="text-error shrink-0" aria-hidden="true" />
                            <span>{error}</span>
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        aria-busy={isLoading}
                        className="btn btn-primary w-full min-h-12 text-md"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                                <span>Signing in…</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>

                <p className="text-sm text-muted mt-10">
                    Personal media tracker
                </p>
            </main>
        </div>
    );
}
