import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'spirit_scroll_auth_token';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);

            if (storedToken) {
                try {
                    const response = await fetch(`${API_URL}/api/auth/verify`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });

                    if (response.ok) {
                        setToken(storedToken);
                    } else {
                        localStorage.removeItem(TOKEN_KEY);
                    }
                } catch {
                    localStorage.removeItem(TOKEN_KEY);
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
                setToken(data.token);
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (e) {
            return { success: false, error: 'Network error' };
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!token,
            isLoading,
            token,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper to get auth headers for API requests
export function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}
