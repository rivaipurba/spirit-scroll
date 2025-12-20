interface MALAnimeData {
    id: number;
    title: string;
    main_picture?: {
        medium: string;
        large: string;
    };
    mean?: number; // Score (0-10)
    rank?: number; // Ranking
    popularity?: number; // Popularity ranking
    synopsis?: string;
    genres?: Array<{ id: number; name: string }>;
    status?: string; // finished_airing, currently_airing, not_yet_aired
    start_date?: string;
    end_date?: string;
    num_episodes?: number;
    media_type?: string; // tv, movie, ova, etc.
}

interface MALSearchResult {
    data: Array<{
        node: MALAnimeData;
    }>;
}

interface MALTokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token: string;
}

const MAL_BASE_URL = 'https://api.myanimelist.net/v2';
const MAL_AUTH_URL = 'https://myanimelist.net/v1/oauth2';

// OAuth2 Token Management
class MALTokenManager {
    private static instance: MALTokenManager;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private expiresAt: number = 0;
    private env: any = null;

    private constructor() {
        // Tokens will be set from environment when needed
    }

    static getInstance(): MALTokenManager {
        if (!MALTokenManager.instance) {
            MALTokenManager.instance = new MALTokenManager();
        }
        return MALTokenManager.instance;
    }

    // Set environment context (for Cloudflare Workers)
    setEnv(env: any) {
        this.env = env;
        this.accessToken = env.MAL_ACCESS_TOKEN || null;
        this.refreshToken = env.MAL_REFRESH_TOKEN || null;
        
        // If we have an access token but no expiry, assume it's valid for 1 hour
        if (this.accessToken && !this.expiresAt) {
            this.expiresAt = Date.now() + (3600 * 1000);
        }
    }

    async getValidToken(): Promise<string | null> {
        // If we have a valid token, return it
        if (this.accessToken && Date.now() < this.expiresAt) {
            return this.accessToken;
        }

        // Try to refresh the token if we have a refresh token
        if (this.refreshToken && this.env) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                return this.accessToken;
            }
        }

        // No valid token available
        console.log('[MAL] No valid access token available. Please complete OAuth2 flow.');
        return null;
    }

    private async refreshAccessToken(): Promise<boolean> {
        try {
            const clientId = this.env?.MAL_CLIENT_ID || process.env.MAL_CLIENT_ID;
            const clientSecret = this.env?.MAL_CLIENT_SECRET || process.env.MAL_CLIENT_SECRET;

            if (!clientId || !clientSecret || !this.refreshToken) {
                return false;
            }

            const response = await fetch(`${MAL_AUTH_URL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                }),
            });

            if (!response.ok) {
                console.error('[MAL] Token refresh failed:', response.status, response.statusText);
                return false;
            }

            const tokenData = await response.json() as MALTokenResponse;
            
            this.accessToken = tokenData.access_token;
            this.refreshToken = tokenData.refresh_token;
            this.expiresAt = Date.now() + (tokenData.expires_in * 1000);

            console.log('[MAL] Token refreshed successfully');
            return true;
        } catch (error) {
            console.error('[MAL] Token refresh error:', error);
            return false;
        }
    }

    // Method to set tokens (for initial OAuth2 flow)
    setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = Date.now() + (expiresIn * 1000);
    }
}

// Get token instance
async function getMALToken(env?: any): Promise<string | null> {
    const tokenManager = MALTokenManager.getInstance();
    if (env) {
        tokenManager.setEnv(env);
    }
    return await tokenManager.getValidToken();
}

export async function searchMALAnime(query: string, env?: any): Promise<MALAnimeData | null> {
    try {
        const token = await getMALToken(env);
        if (!token) {
            console.log('[MAL] No access token available, skipping MAL search');
            return null;
        }

        console.log(`[MAL] Searching for: "${query}"`);
        
        // Try multiple search strategies
        const searchStrategies = [
            query, // Original query
            query.toLowerCase(), // Lowercase
            query.replace(/[^\w\s]/g, ''), // Remove special characters
            query.split(/[:\-–—]/).map(s => s.trim()).filter(s => s)[0] || query, // Take first part before colon/dash
        ];

        // Remove duplicates
        const uniqueQueries = [...new Set(searchStrategies)];
        
        for (const searchQuery of uniqueQueries) {
            console.log(`[MAL] Trying search query: "${searchQuery}"`);
            
            const searchUrl = `${MAL_BASE_URL}/anime?q=${encodeURIComponent(searchQuery)}&limit=5&fields=id,title,main_picture,mean,rank,popularity,synopsis,genres,status,start_date,end_date,num_episodes,media_type`;
            
            console.log(`[MAL] Search URL: ${searchUrl}`);
            
            const response = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-MAL-CLIENT-ID': (env?.MAL_CLIENT_ID || process.env.MAL_CLIENT_ID) || '',
                }
            });

            console.log(`[MAL] Response status: ${response.status}`);

            if (!response.ok) {
                console.error(`[MAL] Search failed: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error(`[MAL] Error response: ${errorText}`);
                continue; // Try next strategy
            }

            const data = await response.json() as MALSearchResult;
            console.log(`[MAL] Search results count: ${data.data?.length || 0}`);
            
            if (data.data && data.data.length > 0) {
                // Log all results for debugging
                data.data.forEach((item, index) => {
                    console.log(`[MAL] Result ${index + 1}: ${item.node.title} (ID: ${item.node.id})`);
                });
                
                // Return the first result
                console.log(`[MAL] Found anime:`, data.data[0].node);
                return data.data[0].node;
            }
        }

        console.log(`[MAL] No results found for any search strategy of: "${query}"`);
        return null;
    } catch (error) {
        console.error('[MAL] Search error:', error);
        return null;
    }
}

export async function getMALAnimeDetails(malId: number, env?: any): Promise<MALAnimeData | null> {
    try {
        const token = await getMALToken(env);
        if (!token) {
            console.log('[MAL] No access token available, skipping MAL details fetch');
            return null;
        }

        const detailsUrl = `${MAL_BASE_URL}/anime/${malId}?fields=id,title,main_picture,mean,rank,popularity,synopsis,genres,status,start_date,end_date,num_episodes,media_type`;
        
        const response = await fetch(detailsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-MAL-CLIENT-ID': (env?.MAL_CLIENT_ID || process.env.MAL_CLIENT_ID) || '',
            }
        });

        if (!response.ok) {
            console.error(`[MAL] Details fetch failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json() as MALAnimeData;
        return data;
    } catch (error) {
        console.error('[MAL] Details fetch error:', error);
        return null;
    }
}

export function shouldUpdateMALData(lastUpdated: number | null): boolean {
    if (!lastUpdated) return true;
    
    // Update MAL data if it's older than 7 days
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - lastUpdated > oneWeek;
}