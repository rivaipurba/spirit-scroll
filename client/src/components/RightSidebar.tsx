import { ArrowUpRight, TrendingUp } from 'lucide-react';
import type { MediaStats } from '../types/index';

interface RightSidebarProps {
    stats: MediaStats;
}

export function RightSidebar({ stats }: RightSidebarProps) {
    const { counts, latestUpdates } = stats;

    return (
        <aside className="hidden lg:block w-64 shrink-0 p-4 space-y-5">
            <div className="bg-mal-panel rounded-lg border border-mal-border p-4">
                <h3 className="text-xs font-semibold text-mal-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    Stats
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-mal-text-secondary">Total Entries</span>
                        <span className="text-sm font-bold text-mal-text">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-mal-text-secondary">Chapters Read</span>
                        <span className="text-sm font-bold text-mal-text">{stats.chaptersRead}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-mal-text-secondary">With Updates</span>
                        <span className="text-sm font-bold text-mal-red">{stats.withUpdates}</span>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <StatusBar label="Reading" count={counts.READING} />
                    <StatusBar label="Watching" count={counts.WATCHING} />
                    <StatusBar label="Completed" count={counts.COMPLETED} />
                    <StatusBar label="On Hold" count={counts.ON_HOLD} />
                    <StatusBar label="Dropped" count={counts.DROPPED} />
                    <StatusBar label="Plan to Read" count={counts.PLAN_TO_READ} />
                </div>
            </div>

            {latestUpdates.length > 0 && (
                <div className="bg-mal-panel rounded-lg border border-mal-border p-4">
                    <h3 className="text-xs font-semibold text-mal-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <ArrowUpRight size={14} />
                        Latest Updates
                    </h3>
                    <div className="space-y-2.5">
                        {latestUpdates.map((m) => {
                            const gap = (m.latestReleasedChapter ?? 0) - m.currentChapter;
                            return gap > 0 ? (
                                <div key={m.id}>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-mal-text truncate leading-tight">
                                            {m.title}
                                        </p>
                                        <p className="text-[11px] text-mal-red font-semibold mt-0.5">
                                            {gap} new {m.type === 'DONGHUA' ? 'ep' : 'ch'}
                                        </p>
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>
            )}
        </aside>
    );
}

function StatusBar({ label, count }: { label: string; count: number }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-mal-text-secondary">{label}</span>
            <span className="font-medium text-mal-text">{count}</span>
        </div>
    );
}
