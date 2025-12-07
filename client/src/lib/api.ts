import { hc } from "hono/client";
import type { AppType } from "../../../server/src/index";

// MY LOCAL NETWORK IP
const BASE_URL = 'http://10.201.14.203:3000/';

export const client = hc<AppType>(BASE_URL);
