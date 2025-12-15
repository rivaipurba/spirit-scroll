import { hc } from "hono/client";
// import type { AppType } from "../../../server/src/index";

// MY LOCAL NETWORK IP
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/';

export const client = hc<any>(BASE_URL) as any;
