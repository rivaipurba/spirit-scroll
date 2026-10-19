import { describe, expect, it } from "bun:test";
import { mapWithConcurrency } from "./concurrency";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("mapWithConcurrency", () => {
    it("returns results in input order even when later items finish first", async () => {
        const delays = [30, 5, 20, 1, 10];
        const results = await mapWithConcurrency(delays, 3, async (ms, i) => {
            await sleep(ms);
            return i;
        });
        expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it("never runs more than limit tasks at the same time", async () => {
        let inFlight = 0;
        let peak = 0;
        await mapWithConcurrency(Array.from({ length: 12 }, (_, i) => i), 5, async (i) => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await sleep(1 + (i % 3) * 3);
            inFlight--;
        });
        expect(peak).toBe(5);
    });

    it("handles an empty list", async () => {
        let calls = 0;
        const results = await mapWithConcurrency([], 5, async () => { calls++; });
        expect(results).toEqual([]);
        expect(calls).toBe(0);
    });

    it("works when limit is larger than the number of items", async () => {
        const results = await mapWithConcurrency([1, 2], 10, async (n) => n * 2);
        expect(results).toEqual([2, 4]);
    });

    it("calls fn exactly once per item", async () => {
        const seen: number[] = [];
        await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
            seen.push(n);
            await sleep(1);
        });
        expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
});
