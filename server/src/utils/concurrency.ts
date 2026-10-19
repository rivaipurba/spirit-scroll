// Map over items with at most `limit` calls to `fn` in flight at once.
// Results keep input order. A rejection from `fn` rejects the whole call,
// so callers that need per-item isolation should catch inside `fn`.
export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    const workerCount = Math.min(Math.max(1, Math.floor(limit) || 1), items.length);
    let next = 0;

    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index] as T, index);
        }
    };

    await Promise.all(Array.from({ length: workerCount }, worker));
    return results;
}
