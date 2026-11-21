import type { MediaStats } from '../types/index';
import { HEAT_BG, heatTier } from '../lib/heat';

interface RightSidebarProps {
    stats: MediaStats;
}

export function RightSidebar({ stats }: RightSidebarProps) {
    const { counts, latestUpdates } = stats;
    const behind = latestUpdates
        .map((m) => ({ ...m, gap: (m.latestReleasedChapter ?? 0) - m.currentChapter }))
        .filter((m) => m.gap > 0);

    return (
        <aside className="hidden xl:block w-64 2xl:w-72 shrink-0 sticky top-16 self-start max-h-[calc(100dvh-4rem)] overflow-y-auto border-l border-rule px-5 py-6 2xl:px-6">
            {behind.length > 0 && (
                <section aria-labelledby="latest-updates-head" className="mb-10">
                    <h2 id="latest-updates-head" className="text-xl text-ink mb-4">Latest updates</h2>
                    <ul className="flex flex-col">
                        {behind.map((m) => (
                            <li key={m.id} className="flex items-center gap-3 py-2.5 border-t border-rule first:border-t-0 first:pt-0">
                                <p className="flex-1 min-w-0 text-sm text-ink truncate" title={m.title}>{m.title}</p>
                                <span className={`heat-key ${HEAT_BG[heatTier(m.gap)]}`} aria-hidden="true" />
                                <p className="shrink-0 text-sm text-ink-2">
                                    <span className="figure text-lg text-ink">{m.gap}</span> new {m.type === 'DONGHUA' ? 'ep' : 'ch'}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section aria-labelledby="stats-head">
                <h2 id="stats-head" className="text-xl text-ink mb-4">Stats</h2>
                <dl className="flex flex-col mb-6">
                    {[
                        ['Total Entries', stats.total],
                        ['Chapters Read', stats.chaptersRead],
                        ['With Updates', stats.withUpdates],
                    ].map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between gap-3 py-2 border-t border-rule first:border-t-0 first:pt-0">
                            <dt className="text-sm text-ink-2">{label}</dt>
                            <dd className="figure text-2xl text-ink">{value}</dd>
                        </div>
                    ))}
                </dl>

                <dl className="flex flex-col text-sm">
                    <StatusRow label="Reading" count={counts.READING} />
                    <StatusRow label="Watching" count={counts.WATCHING} />
                    <StatusRow label="Completed" count={counts.COMPLETED} />
                </dl>
            </section>
        </aside>
    );
}

function StatusRow({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-t border-rule">
            <dt className="text-ink-2">{label}</dt>
            <dd className="tabular-nums text-ink">{count}</dd>
        </div>
    );
}
