import { ArrowUpRight, TrendingUp } from 'lucide-react';
import type { Media } from '../types/index';

interface RightSidebarProps {
    mediaList: Media[];
}

export function RightSidebar({ mediaList }: RightSidebarProps) {
    const isFinished = (m: Media) => m.status === 'COMPLETED' || (m.totalChapters != null && m.totalChapters > 0 && m.currentChapter >= m.totalChapters);

    const totalEntries = mediaList.length;
    const readingCount = mediaList.filter(m => m.status === 'READING' && !isFinished(m) && m.type === 'MANHUA').length;
    const watchingCount = mediaList.filter(m => m.status === 'READING' && !isFinished(m) && m.type === 'DONGHUA').length;
    const completedCount = mediaList.filter(m => isFinished(m)).length;
    const totalChapters = mediaList.reduce((sum, m) => sum + m.currentChapter, 0);
    const hasUpdates = mediaList.filter(
        m => m.latestReleasedChapter != null && m.latestReleasedChapter > m.currentChapter
    );

    const latestUpdates = [...mediaList]
        .sort((a, b) => {
            const aGap = (a.latestReleasedChapter ?? 0) - a.currentChapter;
            const bGap = (b.latestReleasedChapter ?? 0) - b.currentChapter;
            return bGap - aGap;
        })
        .slice(0, 5);

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
                        <span className="text-sm font-bold text-mal-text">{totalEntries}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-mal-text-secondary">Chapters Read</span>
                        <span className="text-sm font-bold text-mal-text">{totalChapters}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-mal-text-secondary">With Updates</span>
                        <span className="text-sm font-bold text-mal-red">{hasUpdates.length}</span>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <StatusBar label="Reading" count={readingCount} />
                    <StatusBar label="Watching" count={watchingCount} />
                    <StatusBar label="Completed" count={completedCount} />
                    <StatusBar label="On Hold" count={mediaList.filter(m => m.status === 'ON_HOLD' && !isFinished(m)).length} />
                    <StatusBar label="Dropped" count={mediaList.filter(m => m.status === 'DROPPED' && !isFinished(m)).length} />
                    <StatusBar label="Plan to Read" count={mediaList.filter(m => m.status === 'PLAN_TO_READ' && !isFinished(m)).length} />
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
                                <div key={m.id} className="flex items-start gap-2.5">
                                    <div className="w-[30px] h-[42px] rounded overflow-hidden bg-mal-card shrink-0 shadow-sm">
                                        {m.coverUrl ? (
                                            <img src={m.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" width="30" height="42" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-mal-card text-mal-text-secondary/50 text-[7px] font-semibold">
                                                {m.type === 'DONGHUA' ? 'A' : 'M'}
                                            </div>
                                        )}
                                    </div>
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
