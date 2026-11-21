import { useUpdateProgress, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import { useState } from 'react';
import { EditMediaDialog } from './EditMediaDialog';
import { UpdateBadge } from './UpdateBadge';
import { Plus, Minus, ExternalLink, Star, Pencil } from 'lucide-react';
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
    // Only active entries (Reading/Watching) get the raised row and ember +1; others keep a muted badge
    const isHot = hasUpdate && media.status === 'READING';
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
            setPulseCount(c => c + 1);
            updateProgress.mutate({ id: media.id, currentChapter: media.currentChapter - 1 });
        }
    };

    return (
        <>
            <tr
                onClick={() => setIsEditOpen(true)}
                className={`group border-b border-rule last:border-b-0 cursor-pointer transition-colors duration-(--dur-short) ${
                    isHot ? 'bg-paper-2 hover:bg-paper-3' : 'hover:bg-paper-2'
                }`}
            >
                <td className="py-3 pl-4 pr-2 text-right text-sm text-muted tabular-nums align-middle">
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
                        <div className={`min-w-0 text-md leading-snug ${isHot ? 'text-ink font-medium' : 'text-ink-2'}`}>
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
                    <p className="text-sm text-muted mt-0.5 pl-6 truncate">
                        {media.type === 'DONGHUA' ? 'Donghua' : 'Manhua'}
                        {', '}
                        <span className={isFinished ? 'text-ink-2' : undefined}>
                            {isFinished ? 'Completed' : getStatusLabel(media.status, media.type)}
                        </span>
                    </p>
                </td>

                <td className="py-3 pr-4 align-middle">
                    {hasUpdate && media.latestReleasedChapter != null && (
                        <UpdateBadge
                            count={media.latestReleasedChapter - media.currentChapter}
                            type={media.type}
                            muted={!isHot}
                        />
                    )}
                </td>

                <td className="py-3 pr-4 align-middle">
                    <div className="text-sm text-ink tabular-nums whitespace-nowrap">
                        <span key={pulseCount} className="progress-pulse">{label} {media.currentChapter}</span>
                        {media.totalChapters ? <span className="text-muted ml-1">{`/ ${media.totalChapters}`}</span> : ''}
                    </div>
                    {media.totalChapters ? (
                        <div className="meter mt-1.5">
                            <span style={{ transform: `scaleX(${progress / 100})` }} />
                        </div>
                    ) : null}
                </td>

                <td className="py-3 pr-4 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                            aria-label={`Edit ${media.title}`}
                            className="btn btn-quiet btn-icon hit min-h-9 min-w-9 pointer-coarse:min-h-11 pointer-coarse:min-w-11 text-muted hover:text-ink"
                            title="Edit"
                        >
                            <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                            type="button"
                            onClick={handleQuickDecrement}
                            aria-label={`Decrement ${unit}`}
                            className="btn btn-quiet btn-icon hit min-h-9 min-w-9 pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                            title={`Previous ${label}`}
                        >
                            <Minus size={14} strokeWidth={2.25} />
                        </button>
                        <button
                            type="button"
                            onClick={handleQuickIncrement}
                            aria-label={`Increment ${unit}`}
                            className={`btn btn-icon hit min-h-9 min-w-9 pointer-coarse:min-h-11 pointer-coarse:min-w-11 ${isHot ? 'btn-primary' : 'btn-ghost'}`}
                            title={`Next ${label}`}
                        >
                            <Plus size={16} strokeWidth={2.25} />
                        </button>
                    </div>
                </td>
            </tr>

            {isEditOpen && (
                <EditMediaDialog
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    media={media}
                />
            )}
        </>
    );
}
