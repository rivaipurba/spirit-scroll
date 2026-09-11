import { Plus, ExternalLink, Minus, Star } from 'lucide-react';
import React, { useState } from 'react';
import type { Media } from '../types/index';
import { EditMediaDialog } from './EditMediaDialog';
import { useUpdateProgress, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';

interface MediaCardProps {
    media: Media;
    priority?: boolean;
}

export const MediaCard = React.memo(function MediaCard({ media }: MediaCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const updateProgress = useUpdateProgress();
    const updateMedia = useUpdateMedia();
    const toast = useToastContext();
    const hasUpdate = media.latestReleasedChapter != null && media.latestReleasedChapter > media.currentChapter;
    const isFinished = media.status === 'COMPLETED' || Boolean(media.totalChapters && media.currentChapter >= media.totalChapters);
    const cardBorderClass = hasUpdate
        ? 'border-mal-red/30 hover:border-mal-red/50'
        : isFinished
            ? 'border-mal-green/20 hover:border-mal-green/40'
            : media.status === 'ON_HOLD'
                ? 'border-mal-yellow/20 hover:border-mal-yellow/40'
                : media.status === 'DROPPED'
                    ? 'border-mal-red/20 hover:border-mal-red/40'
                    : media.status === 'PLAN_TO_READ'
                        ? 'border-mal-gray/20 hover:border-mal-gray/40'
                        : 'border-mal-border hover:border-mal-text-secondary/30';

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
                className={`group relative flex items-center rounded-xl p-3 border bg-mal-card shadow-sm transition-all duration-200 cursor-pointer ${cardBorderClass}`}
                onClick={() => setIsEditOpen(true)}
            >
                <div className="flex-1 min-w-0 py-1">
                    <div className="mb-1 flex items-start gap-2">
                        <h3 className="min-w-0 flex-1 font-semibold text-mal-text text-base leading-tight line-clamp-2 group-hover:text-mal-blue transition-colors">
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
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                updateMedia.mutate({ id: media.id, isPinned: !media.isPinned });
                            }}
                            disabled={updateMedia.isPending}
                            className="p-1 rounded text-mal-text-secondary hover:text-mal-yellow hover:bg-mal-hover transition-colors cursor-pointer"
                            aria-label={media.isPinned ? 'Unpin' : 'Pin to top'}
                            title={media.isPinned ? 'Unpin from top' : 'Pin to top'}
                        >
                            <Star
                                size={16}
                                className={media.isPinned ? 'text-mal-yellow fill-mal-yellow' : 'fill-none'}
                                strokeWidth={2}
                            />
                        </button>
                    </div>

                    <div className="flex items-center text-xs text-mal-text-secondary/70 mb-3 space-x-2">
                        <span className={hasUpdate ? "text-mal-red font-medium" : ""}>
                            {media.type === 'DONGHUA' ? 'Ep.' : 'Ch.'} {media.currentChapter}
                            {hasUpdate && media.latestReleasedChapter != null && media.latestReleasedChapter > 0 && (
                                ` / ${media.latestReleasedChapter} (${media.latestReleasedChapter - media.currentChapter})`
                            )}
                        </span>
                        {(media.totalChapters || 0) > 0 && (
                            <>
                                <span className="text-mal-border">•</span>
                                <span>Total: {media.totalChapters}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-mal-border rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isFinished ? 'bg-mal-green' : 'bg-mal-blue'}`}
                                style={{ width: `${media.totalChapters ? Math.min((media.currentChapter / media.totalChapters) * 100, 100) : 0}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-1 transition-opacity duration-200">
                            <button
                                onClick={handleQuickDecrement}
                                aria-label="Go back one chapter"
                                className="p-1.5 rounded-lg border border-mal-border text-mal-text-secondary hover:text-white hover:bg-mal-hover transition-colors cursor-pointer"
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
