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
    const statusBadgeClass = isFinished ? 'bg-mal-green' : 'bg-mal-blue';
    const cardBorderClass = hasUpdate
        ? 'border-red-200 hover:border-red-300'
        : isFinished
            ? 'border-mal-green/30 hover:border-mal-green/50'
            : media.status === 'ON_HOLD'
                ? 'border-mal-yellow/30 hover:border-mal-yellow/50'
                : media.status === 'DROPPED'
                    ? 'border-mal-red/30 hover:border-mal-red/50'
                    : media.status === 'PLAN_TO_READ'
                        ? 'border-mal-gray/30 hover:border-mal-gray/50'
                        : 'border-gray-200 hover:border-gray-300';

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
                className={`group relative flex items-center rounded-xl p-3 border bg-white shadow-sm transition-all duration-200 cursor-pointer ${cardBorderClass}`}
                onClick={() => setIsEditOpen(true)}
            >
                {/* Cover Image */}
                <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 shadow-sm bg-gray-100 mr-4">
                    {media.coverUrl ? (
                        <img
                            src={media.coverUrl}
                            alt={media.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading={priority ? "eager" : "lazy"}
                            width="80"
                            height="112"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs font-medium">
                            {media.type === 'DONGHUA' ? 'ANIME' : 'MANGA'}
                        </div>
                    )}

                    <div className="absolute top-1 left-1 z-10 flex flex-col items-start gap-1">
                        {hasUpdate ? (
                            <span className="rounded-md bg-mal-red px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                                NEW
                            </span>
                        ) : (
                            <span className={`rounded-md ${statusBadgeClass} px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm`}>
                                {statusBadgeLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="mb-1">
                        <h3 className="font-semibold text-gray-800 text-base leading-tight line-clamp-2 group-hover:text-mal-blue transition-colors">
                            {(media.sourceUrl || (media as any).source_url) ? (
                                <a
                                    href={media.sourceUrl || (media as any).source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-mal-blue transition-colors inline cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {media.title}
                                    <ExternalLink className="w-3 h-3 ml-1 opacity-40 inline align-baseline" />
                                </a>
                            ) : (
                                media.title
                            )}
                        </h3>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 mb-3 space-x-2">
                        <span className={hasUpdate ? "text-mal-red font-medium" : ""}>
                            {media.type === 'DONGHUA' ? 'Ep.' : 'Ch.'} {media.currentChapter}
                            {hasUpdate && media.latestReleasedChapter != null && media.latestReleasedChapter > 0 && (
                                ` / ${media.latestReleasedChapter} (${media.latestReleasedChapter - media.currentChapter})`
                            )}
                        </span>
                        {(media.totalChapters || 0) > 0 && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span>Total: {media.totalChapters}</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-mal-green' : 'bg-mal-blue'}`}
                                style={{ width: `${media.totalChapters ? Math.min((media.currentChapter / media.totalChapters) * 100, 100) : 0}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-1 transition-opacity duration-200">
                            <button
                                onClick={handleQuickDecrement}
                                aria-label="Go back one chapter"
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Go back one chapter"
                            >
                                <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={handleQuickIncrement}
                                aria-label="Mark next chapter as read"
                                className="p-1.5 rounded-lg bg-mal-blue text-white hover:bg-mal-blue-dark transition-all shadow-sm cursor-pointer"
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
