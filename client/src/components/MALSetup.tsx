import { useState } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface MALStatus {
    configured: boolean;
    authenticated: boolean;
    clientId: string | null;
    hasToken: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function MALSetup() {
    const [status, setStatus] = useState<MALStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [authUrl, setAuthUrl] = useState<string | null>(null);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/mal/status`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Failed to check MAL status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAuthUrl = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/mal/auth-url`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.authUrl) {
                setAuthUrl(data.authUrl);
            }
        } catch (error) {
            console.error('Failed to get auth URL:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">MyAnimeList Integration</h3>
            </div>

            <p className="text-sm text-slate-400 mb-6">
                Connect to MyAnimeList to get ratings, rankings, and additional metadata for your anime entries.
            </p>

            {!status && (
                <button
                    onClick={checkStatus}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Checking...' : 'Check MAL Status'}
                </button>
            )}

            {status && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            {status.configured ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm text-slate-300">
                                Client ID: {status.configured ? 'Configured' : 'Missing'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {status.authenticated ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="text-sm text-slate-300">
                                Token: {status.authenticated ? 'Active' : 'Missing'}
                            </span>
                        </div>
                    </div>

                    {status.clientId && (
                        <div className="text-xs text-slate-500">
                            Client ID: {status.clientId}
                        </div>
                    )}

                    {status.configured && !status.authenticated && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400">
                                Client ID is configured but authentication is needed.
                            </p>
                            
                            {!authUrl ? (
                                <button
                                    onClick={getAuthUrl}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Auth URL'}
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-400">
                                        Click the link below to authenticate with MyAnimeList:
                                    </p>
                                    <a
                                        href={authUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center justify-center"
                                    >
                                        Authenticate with MyAnimeList
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <p className="text-xs text-slate-500">
                                        After authentication, you'll receive tokens to set as environment variables.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {!status.configured && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <p className="text-sm text-yellow-200 mb-2">
                                MAL Client ID not configured. Please set the following environment variables:
                            </p>
                            <div className="text-xs font-mono text-yellow-300 space-y-1">
                                <div>MAL_CLIENT_ID=your_client_id</div>
                                <div>MAL_CLIENT_SECRET=your_client_secret</div>
                                <div>MAL_REDIRECT_URI=http://localhost:3000/api/mal/callback</div>
                            </div>
                        </div>
                    )}

                    {status.configured && status.authenticated && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-200 font-medium">
                                    MyAnimeList integration is active!
                                </span>
                            </div>
                            <p className="text-xs text-green-300 mt-1">
                                Anime entries will now automatically fetch MAL data including ratings and rankings.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={checkStatus}
                        disabled={loading}
                        className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                        {loading ? 'Refreshing...' : 'Refresh Status'}
                    </button>
                </div>
            )}
        </div>
    );
}