import { Plus, ExternalLink, Minus } from 'lucide-react';
import React, { useState } from 'react';
import type { Media } from '../types/index';
import { EditMediaDialog } from './EditMediaDialog';
import { useUpdateProgress } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';

interface MediaCardProps {
    media: Media;
    priority?: boolean;
}

export const MediaCard = React.memo(function MediaCard({ media, priority = false }: MediaCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const updateProgress = useUpdateProgress();
    const toast = useToastContext();
    const hasUpdate = media.latestReleasedChapter != null && media.latestReleasedChapter > media.currentChapter;
    const isFinished = media.status === 'COMPLETED' || Boolean(media.totalChapters && media.currentChapter >= media.totalChapters);
    const statusBadgeLabel = isFinished ? 'FINISHED' : media.type === 'DONGHUA' ? 'WATCHING' : 'READING';
    const statusBadgeClass = isFinished ? 'bg-emerald-600/90' : 'bg-indigo-600/90';
    const cardToneClass = hasUpdate
        ? 'bg-red-950/20 hover:bg-red-950/30 border-red-500/15 hover:border-red-500/25'
        : isFinished
            ? 'bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-500/15 hover:border-emerald-500/25'
            : media.status === 'ON_HOLD'
                ? 'bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/15 hover:border-amber-500/25'
                : media.status === 'DROPPED'
                    ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/15 hover:border-rose-500/25'
                    : media.status === 'PLAN_TO_READ'
                        ? 'bg-cyan-950/20 hover:bg-cyan-950/30 border-cyan-500/15 hover:border-cyan-500/25'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10';

    const handleQuickIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prevChapter = media.currentChapter;
        const nextChapter = media.currentChapter + 1;
        const label = media.type === 'DONGHUA' ? 'Ep.' : 'Ch.';

        updateProgress.mutate({ id: media.id, currentChapter: nextChapter }, {
            onSuccess: () => {
                toast.success(
                    `${label} ${nextChapter} marked as read`,
                    undefined,
                    5000,
                    {
                        label: 'Undo',
                        onClick: () => updateProgress.mutate({ id: media.id, currentChapter: prevChapter }),
                    }
                );
            }
        });
    };

    const handleQuickDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (media.currentChapter > 0) {
            updateProgress.mutate({
                id: media.id,
                currentChapter: media.currentChapter - 1
            });
        }
    };

    return (
        <>
            <div
                className={`group relative flex items-center rounded-xl p-3 border transition-all duration-300 backdrop-blur-sm cursor-pointer ${cardToneClass}`}
                onClick={() => setIsEditOpen(true)}
            >
                {/* Cover Image */}
                <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 shadow-lg bg-black/40 mr-4">
                    {media.coverUrl ? (
                        <img
                            src={media.coverUrl}
                            alt={media.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading={priority ? "eager" : "lazy"}
                            width="80"
                            height="112"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-900/20 text-indigo-200/40 text-xs font-medium">
                            {media.type === 'DONGHUA' ? 'ANIME' : 'MANHUA'}
                        </div>
                    )}

                    {/* Badge Logic: Priority given to NEW updates */}
                    <div className="absolute top-1 left-1 z-10 flex flex-col items-start gap-1">
                        {hasUpdate ? (
                            <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-md animate-pulse">
                                NEW
                            </span>
                        ) : (
                            <span className={`rounded-md ${statusBadgeClass} px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur-sm`}>
                                {statusBadgeLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="mb-1">
                        <h3 className="font-semibold text-slate-100 text-base leading-tight line-clamp-2 group-hover:text-white transition-colors">
                            {(media.sourceUrl || (media as any).source_url) ? (
                                <a
                                    href={media.sourceUrl || (media as any).source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-indigo-400 transition-colors inline cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {media.title}
                                    <ExternalLink className="w-3 h-3 ml-1 opacity-50 inline align-baseline" />
                                </a>
                            ) : (
                                media.title
                            )}
                        </h3>
                    </div>

                    <div className="flex items-center text-xs text-slate-400 mb-3 space-x-2">
                        <span className={hasUpdate ? "text-orange-400 font-medium" : ""}>
                            {media.type === 'DONGHUA' ? 'Ep.' : 'Ch.'} {media.currentChapter}
                            {hasUpdate && media.latestReleasedChapter != null && media.latestReleasedChapter > 0 && (
                                ` / ${media.latestReleasedChapter} (${media.latestReleasedChapter - media.currentChapter})`
                            )}
                        </span>
                        {(media.totalChapters || 0) > 0 && (
                            <>
                                <span className="text-slate-600">•</span>
                                <span>Total: {media.totalChapters}</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500'
                                    }`}
                                style={{ width: `${media.totalChapters ? Math.min((media.currentChapter / media.totalChapters) * 100, 100) : 0}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-1 transition-opacity duration-200">
                            <button
                                onClick={handleQuickDecrement}
                                aria-label="Go back one chapter"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Go back one chapter"
                            >
                                <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={handleQuickIncrement}
                                aria-label="Mark next chapter as read"
                                className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer"
                                title="Mark next chapter as read"
                            >
                                <Plus size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <EditMediaDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                media={media}
            />
        </>
    );
});
