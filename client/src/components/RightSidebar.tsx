import { ArrowUpRight, TrendingUp } from 'lucide-react';
import type { Media } from '../types/index';

interface RightSidebarProps {
    mediaList: Media[];
}

export function RightSidebar({ mediaList }: RightSidebarProps) {
    const totalEntries = mediaList.length;
    const readingCount = mediaList.filter(m => m.status === 'READING').length;
    const completedCount = mediaList.filter(m => m.status === 'COMPLETED').length;
    const totalChapters = mediaList.reduce((sum, m) => sum + m.currentChapter, 0);
    const hasUpdates = mediaList.filter(
        m => m.latestReleasedChapter != null && m.latestReleasedChapter > m.currentChapter
    );

    // Top 5 latest updated entries
    const latestUpdates = [...mediaList]
        .sort((a, b) => {
            const aGap = (a.latestReleasedChapter ?? 0) - a.currentChapter;
            const bGap = (b.latestReleasedChapter ?? 0) - b.currentChapter;
            return bGap - aGap;
        })
        .slice(0, 5);

    const maxCount = Math.max(readingCount, completedCount, 1);

    return (
        <aside className="hidden lg:block w-64 shrink-0 p-4 space-y-5">
            {/* Stats Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    Stats
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Entries</span>
                        <span className="text-sm font-bold text-gray-800">{totalEntries}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Chapters Read</span>
                        <span className="text-sm font-bold text-gray-800">{totalChapters}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">With Updates</span>
                        <span className="text-sm font-bold text-mal-red">{hasUpdates.length}</span>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="mt-4 space-y-2">
                    <StatusBar label="Reading" count={readingCount} max={maxCount} color="bg-mal-green" />
                    <StatusBar label="Completed" count={completedCount} max={maxCount} color="bg-mal-blue-status" />
                    <StatusBar label="On Hold" count={mediaList.filter(m => m.status === 'ON_HOLD').length} max={maxCount} color="bg-mal-yellow" />
                    <StatusBar label="Dropped" count={mediaList.filter(m => m.status === 'DROPPED').length} max={maxCount} color="bg-mal-red" />
                    <StatusBar label="Plan to Read" count={mediaList.filter(m => m.status === 'PLAN_TO_READ').length} max={maxCount} color="bg-mal-gray" />
                </div>
            </div>

            {/* Latest Updates */}
            {latestUpdates.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <ArrowUpRight size={14} />
                        Latest Updates
                    </h3>
                    <div className="space-y-2.5">
                        {latestUpdates.map((m) => {
                            const gap = (m.latestReleasedChapter ?? 0) - m.currentChapter;
                            return gap > 0 ? (
                                <div key={m.id} className="flex items-start gap-2.5">
                                    <div className="w-[30px] h-[42px] rounded overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                                        {m.coverUrl ? (
                                            <img src={m.coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" width="30" height="42" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-[7px] font-semibold">
                                                {m.type === 'DONGHUA' ? 'A' : 'M'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-700 truncate leading-tight">
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

function StatusBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
    const pct = max > 0 ? (count / max) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-700">{count}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-0.5 overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
