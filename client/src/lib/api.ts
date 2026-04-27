import { hc } from "hono/client";
// import type { AppType } from "../../../server/src/index";

export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/').replace(/\/?$/, '/');
const TOKEN_KEY = 'spirit_scroll_auth_token';

// Get the stored auth token
export function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

// Custom fetch that adds Authorization header
const authFetch: typeof fetch = (input, init) => {
    const token = getAuthToken();
    const headers = new Headers(init?.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(input, {
        ...init,
        headers
    });
};

export const client = hc<any>(BASE_URL, { fetch: authFetch }) as any;
