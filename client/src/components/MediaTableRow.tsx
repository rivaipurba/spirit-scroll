import { useUpdateProgress, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import { useState } from 'react';
import { EditMediaDialog } from './EditMediaDialog';
import { UpdateBadge } from './UpdateBadge';
import { Plus, Minus, ExternalLink, Star } from 'lucide-react';
import { STATUS_COLORS, getStatusLabel } from '../lib/media-utils';
import type { Media } from '../types/index';

interface MediaTableRowProps {
    media: Media;
    rank: number;
}


export function MediaTableRow({ media, rank }: MediaTableRowProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [pulseCount, setPulseCount] = useState(0);
    const updateProgress = useUpdateProgress();
    const updateMedia = useUpdateMedia();
    const toast = useToastContext();

    const hasUpdate = media.latestReleasedChapter != null && media.latestReleasedChapter > media.currentChapter;
    const isFinished = media.status === 'COMPLETED' || Boolean(media.totalChapters && media.currentChapter >= media.totalChapters);
    const progress = media.totalChapters ? Math.min((media.currentChapter / media.totalChapters) * 100, 100) : 0;
    const label = media.type === 'DONGHUA' ? 'Ep.' : 'Ch.';
    const unit = media.type === 'DONGHUA' ? 'episode' : 'chapter';

    const handleQuickIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPulseCount(c => c + 1);
        const prevChapter = media.currentChapter;
        const nextChapter = media.currentChapter + 1;

        updateProgress.mutate({ id: media.id, currentChapter: nextChapter, totalChapters: media.totalChapters }, {
            onSuccess: () => {
                toast.success(
                    `${label} ${nextChapter} marked as read`,
                    undefined,
                    2000,
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
            setPulseCount(c => c + 1);
            updateProgress.mutate({ id: media.id, currentChapter: media.currentChapter - 1 });
        }
    };

    return (
        <>
            <tr
                onClick={() => setIsEditOpen(true)}
                className="border-b border-mal-border hover:bg-mal-hover transition-colors cursor-pointer group"
            >
                <td className="py-3 px-3 text-center text-sm text-mal-text-secondary/60 font-medium w-10">
                    {rank}
                </td>

                <td className="py-3 w-[60px]">
                    <div className="relative w-[50px] h-[70px] rounded overflow-hidden bg-mal-card flex-shrink-0 shadow-sm">
                        {media.coverUrl ? (
                            <img
                                src={media.coverUrl}
                                alt={media.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                width="50"
                                height="70"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-mal-card text-mal-text-secondary/40 text-[9px] font-semibold">
                                {media.type === 'DONGHUA' ? 'ANIME' : 'MANGA'}
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                updateMedia.mutate({ id: media.id, isPinned: !media.isPinned });
                            }}
                            disabled={updateMedia.isPending}
                            className="absolute top-0.5 right-0.5 z-10 p-0.5 rounded bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
                            aria-label={media.isPinned ? 'Unpin' : 'Pin to top'}
                            title={media.isPinned ? 'Unpin from top' : 'Pin to top'}
                        >
                            <Star
                                size={10}
                                className={media.isPinned ? 'text-mal-yellow fill-mal-yellow' : 'text-white/70 fill-none'}
                                strokeWidth={2}
                            />
                        </button>
                    </div>
                </td>

                <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1 text-sm font-semibold text-mal-text leading-tight group-hover:text-mal-blue transition-colors">
                            {media.sourceUrl ? (
                                <a
                                    href={media.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-mal-blue transition-colors inline-flex items-center gap-1 max-w-full"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="truncate min-w-0">{media.title}</span>
                                    <ExternalLink size={12} className="opacity-40 flex-shrink-0" />
                                </a>
                            ) : (
                                <span className="block truncate">{media.title}</span>
                            )}
                        </div>
                        {hasUpdate && media.latestReleasedChapter != null && (
                            <UpdateBadge
                                count={media.latestReleasedChapter - media.currentChapter}
                                type={media.type}
                            />
                        )}
                    </div>
                    <div className="text-xs text-mal-text-secondary/60 mt-0.5">
                        {media.type === 'DONGHUA' ? 'Donghua' : 'Manhua'}
                    </div>
                </td>

                <td className="py-3 pr-4 w-32">
                    <div className="text-sm font-medium text-mal-text">
                        <span key={pulseCount} className="progress-pulse">{label} {media.currentChapter}</span>
                        {media.totalChapters ? ` / ${media.totalChapters}` : ''}
                    </div>
                    {media.totalChapters ? (
                        <div className="w-full h-1.5 bg-mal-card rounded-full mt-1 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-mal-blue transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    ) : null}
                </td>

                <td className="py-3 pr-4 w-28">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold text-black ${isFinished ? 'bg-mal-green' : (STATUS_COLORS[media.status] || 'bg-mal-gray')}`}>
                        {isFinished ? 'Completed' : getStatusLabel(media.status, media.type)}
                    </span>
                </td>

                <td className="py-3 w-24">
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                            onClick={handleQuickDecrement}
                            aria-label={`Decrement ${unit}`}
                            className="p-1.5 rounded-md border border-mal-border text-mal-text-secondary hover:text-white hover:bg-mal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mal-blue transition-colors cursor-pointer"
                            title={`Previous ${label}`}
                        >
                            <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={handleQuickIncrement}
                            aria-label={`Increment ${unit}`}
                            className="p-1.5 rounded-md bg-mal-blue text-white hover:bg-mal-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mal-blue transition-colors cursor-pointer"
                            title={`Next ${label}`}
                        >
                            <Plus size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                </td>
            </tr>

            <EditMediaDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                media={media}
            />
        </>
    );
}
