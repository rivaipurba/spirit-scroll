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

    private constructor() {
        // Load tokens from environment if available
        this.accessToken = process.env.MAL_ACCESS_TOKEN || null;
        this.refreshToken = process.env.MAL_REFRESH_TOKEN || null;
        
        // If we have an access token but no expiry, assume it's valid for 1 hour
        if (this.accessToken && !this.expiresAt) {
            this.expiresAt = Date.now() + (3600 * 1000);
        }
    }

    static getInstance(): MALTokenManager {
        if (!MALTokenManager.instance) {
            MALTokenManager.instance = new MALTokenManager();
        }
        return MALTokenManager.instance;
    }

    async getValidToken(): Promise<string | null> {
        // If we have a valid token, return it
        if (this.accessToken && Date.now() < this.expiresAt) {
            return this.accessToken;
        }

        // Try to refresh the token if we have a refresh token
        if (this.refreshToken) {
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
            const clientId = process.env.MAL_CLIENT_ID;
            const clientSecret = process.env.MAL_CLIENT_SECRET;

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

            const tokenData: MALTokenResponse = await response.json();
            
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
async function getMALToken(): Promise<string | null> {
    const tokenManager = MALTokenManager.getInstance();
    return await tokenManager.getValidToken();
}

export async function searchMALAnime(query: string): Promise<MALAnimeData | null> {
    try {
        const token = await getMALToken();
        if (!token) {
            console.log('[MAL] No access token available, skipping MAL search');
            return null;
        }

        const searchUrl = `${MAL_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=1&fields=id,title,main_picture,mean,rank,popularity,synopsis,genres,status,start_date,end_date,num_episodes,media_type`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'SpiritScroll/1.0'
            }
        });

        if (!response.ok) {
            console.error(`[MAL] Search failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: MALSearchResult = await response.json();
        
        if (data.data && data.data.length > 0) {
            return data.data[0].node;
        }

        return null;
    } catch (error) {
        console.error('[MAL] Search error:', error);
        return null;
    }
}

export async function getMALAnimeDetails(malId: number): Promise<MALAnimeData | null> {
    try {
        const token = await getMALToken();
        if (!token) {
            console.log('[MAL] No access token available, skipping MAL details fetch');
            return null;
        }

        const detailsUrl = `${MAL_BASE_URL}/anime/${malId}?fields=id,title,main_picture,mean,rank,popularity,synopsis,genres,status,start_date,end_date,num_episodes,media_type`;
        
        const response = await fetch(detailsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'SpiritScroll/1.0'
            }
        });

        if (!response.ok) {
            console.error(`[MAL] Details fetch failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: MALAnimeData = await response.json();
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