import { useUpdateProgress, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import { useState } from 'react';
import { EditMediaDialog } from './EditMediaDialog';
import { UpdateBadge } from './UpdateBadge';
import { Plus, Minus, ExternalLink, Star } from 'lucide-react';
import { getStatusLabel } from '../lib/media-utils';
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
                className={`group border-b border-rule last:border-b-0 cursor-pointer transition-colors duration-(--dur-short) ${
                    hasUpdate ? 'bg-paper-2 hover:bg-paper-3' : 'hover:bg-paper-2'
                }`}
            >
                <td className="py-3 pl-4 pr-2 text-right text-sm text-muted tabular-nums w-12 align-middle">
                    {rank}
                </td>

                <td className="py-3 pr-4 align-middle">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                updateMedia.mutate({ id: media.id, isPinned: !media.isPinned });
                            }}
                            disabled={updateMedia.isPending}
                            className={`hit shrink-0 -ml-1 p-1 rounded-full transition-colors duration-(--dur-short) focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-55 ${
                                media.isPinned ? 'text-ink' : 'text-muted hover:text-ink'
                            }`}
                            aria-label={media.isPinned ? 'Unpin' : 'Pin to top'}
                            aria-pressed={Boolean(media.isPinned)}
                            title={media.isPinned ? 'Unpin from top' : 'Pin to top'}
                        >
                            <Star size={14} className={media.isPinned ? 'fill-current' : 'fill-none'} strokeWidth={2} />
                        </button>
                        <div className={`min-w-0 text-md leading-snug ${hasUpdate ? 'text-ink font-medium' : 'text-ink-2'}`}>
                            {media.sourceUrl ? (
                                <a
                                    href={media.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 max-w-full rounded-sm hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="truncate min-w-0">{media.title}</span>
                                    <ExternalLink size={12} className="shrink-0 text-muted" aria-hidden="true" />
                                </a>
                            ) : (
                                <span className="block truncate">{media.title}</span>
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-muted mt-0.5 pl-6">
                        {media.type === 'DONGHUA' ? 'Donghua' : 'Manhua'}
                    </div>
                </td>

                <td className="py-3 pr-4 w-32 align-middle">
                    {hasUpdate && media.latestReleasedChapter != null && (
                        <UpdateBadge
                            count={media.latestReleasedChapter - media.currentChapter}
                            type={media.type}
                        />
                    )}
                </td>

                <td className="py-3 pr-4 w-40 align-middle">
                    <div className="text-sm text-ink tabular-nums whitespace-nowrap">
                        <span key={pulseCount} className="progress-pulse">{label} {media.currentChapter}</span>
                        {media.totalChapters ? <span className="text-muted">{` / ${media.totalChapters}`}</span> : ''}
                    </div>
                    {media.totalChapters ? (
                        <div className="meter mt-1.5">
                            <span style={{ transform: `scaleX(${progress / 100})` }} />
                        </div>
                    ) : null}
                </td>

                <td className="py-3 pr-4 w-32 align-middle text-sm whitespace-nowrap">
                    <span className={isFinished ? 'text-ink' : 'text-ink-2'}>
                        {isFinished ? 'Completed' : getStatusLabel(media.status, media.type)}
                    </span>
                </td>

                <td className="py-3 pr-4 w-28 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={handleQuickDecrement}
                            aria-label={`Decrement ${unit}`}
                            className="btn btn-quiet btn-icon hit min-h-9 min-w-9"
                            title={`Previous ${label}`}
                        >
                            <Minus size={14} strokeWidth={2.25} />
                        </button>
                        <button
                            type="button"
                            onClick={handleQuickIncrement}
                            aria-label={`Increment ${unit}`}
                            className={`btn btn-icon hit min-h-9 min-w-9 ${hasUpdate ? 'btn-primary' : 'btn-ghost'}`}
                            title={`Next ${label}`}
                        >
                            <Plus size={16} strokeWidth={2.25} />
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
