import type { Context, Next } from "hono";

// JWT Secret and Password from environment
type AuthBindings = {
    JWT_SECRET: string;
    AUTH_PASSWORD_HASH: string;
};

// Simple base64url encoding/decoding for JWT
function base64urlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}

// Create JWT token (24 hour expiry)
export async function createToken(secret: string): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        sub: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const headerB64 = base64urlEncode(JSON.stringify(header));
    const payloadB64 = base64urlEncode(JSON.stringify(payload));
    const message = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const signatureB64 = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));

    return `${message}.${signatureB64}`;
}

// Verify JWT token
export async function verifyToken(token: string, secret: string): Promise<boolean> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        const [headerB64, payloadB64, signatureB64] = parts;
        const message = `${headerB64}.${payloadB64}`;

        // Verify signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const signatureBytes = Uint8Array.from(base64urlDecode(signatureB64!), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(message));

        if (!valid) return false;

        // Check expiry
        const payload = JSON.parse(base64urlDecode(payloadB64!));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

// Hash password using SHA-256 (simple but effective for single user)
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

