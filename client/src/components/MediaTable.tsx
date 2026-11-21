import { useState } from 'react';
import { Plus, Minus, ExternalLink, Star, BookOpen, Pencil } from 'lucide-react';
import { MediaTableRow } from './MediaTableRow';
import { UpdateBadge } from './UpdateBadge';
import { EditMediaDialog } from './EditMediaDialog';
import { getStatusLabel } from '../lib/media-utils';
import { useUpdateProgress, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import type { Media } from '../types/index';

interface MediaTableProps {
    mediaList: Media[];
    isLoading: boolean;
    filtersActive: boolean;
    onClearFilters: () => void;
}

function MobileCard({ media }: { media: Media }) {
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
            <div
                onClick={() => setIsEditOpen(true)}
                className={`flex flex-col gap-3 px-4 py-4 cursor-pointer transition-colors duration-(--dur-short) ${
                    isHot ? 'bg-paper-2 active:bg-paper-3' : 'active:bg-paper-2'
                }`}
            >
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <div className={`text-md leading-snug ${isHot ? 'text-ink font-medium' : 'text-ink-2'}`}>
                            {media.sourceUrl ? (
                                <a
                                    href={media.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-start gap-1.5 max-w-full rounded-sm focus-visible:outline-2 focus-visible:outline-focus"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="line-clamp-2 min-w-0">{media.title}</span>
                                    <ExternalLink size={12} className="shrink-0 mt-1.5 text-muted" aria-hidden="true" />
                                </a>
                            ) : (
                                <span className="line-clamp-2">{media.title}</span>
                            )}
                        </div>
                        <p className="text-sm text-muted mt-0.5">
                            {media.type === 'DONGHUA' ? 'Donghua' : 'Manhua'}
                            <span className="text-muted">, </span>
                            <span className={isFinished ? 'text-ink-2' : 'text-muted'}>
                                {isFinished ? 'Completed' : getStatusLabel(media.status, media.type)}
                            </span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                        aria-label={`Edit ${media.title}`}
                        className="btn btn-icon btn-quiet -mt-2 min-h-11 min-w-11 text-muted!"
                        title="Edit"
                    >
                        <Pencil size={16} strokeWidth={2} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            updateMedia.mutate({ id: media.id, isPinned: !media.isPinned });
                        }}
                        disabled={updateMedia.isPending}
                        className={`btn btn-icon btn-quiet -mr-2 -mt-2 min-h-11 min-w-11 ${media.isPinned ? 'text-ink!' : 'text-muted!'}`}
                        aria-label={media.isPinned ? 'Unpin' : 'Pin to top'}
                        aria-pressed={Boolean(media.isPinned)}
                        title={media.isPinned ? 'Unpin from top' : 'Pin to top'}
                    >
                        <Star size={16} className={media.isPinned ? 'fill-current' : 'fill-none'} strokeWidth={2} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm text-ink tabular-nums whitespace-nowrap">
                                <span key={pulseCount} className="progress-pulse">{label} {media.currentChapter}</span>
                                {media.totalChapters ? <span className="text-muted ml-1">{`/ ${media.totalChapters}`}</span> : ''}
                            </span>
                            {hasUpdate && media.latestReleasedChapter != null && (
                                <UpdateBadge
                                    count={media.latestReleasedChapter - media.currentChapter}
                                    type={media.type}
                                    muted={!isHot}
                                />
                            )}
                        </div>
                        {media.totalChapters ? (
                            <div className="meter mt-2">
                                <span style={{ transform: `scaleX(${progress / 100})` }} />
                            </div>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleQuickDecrement}
                            aria-label={`Decrement ${unit}`}
                            className="btn btn-quiet btn-icon min-h-11 min-w-11"
                            title={`Previous ${label}`}
                        >
                            <Minus size={16} strokeWidth={2.25} />
                        </button>
                        <button
                            type="button"
                            onClick={handleQuickIncrement}
                            aria-label={`Increment ${unit}`}
                            className={`btn btn-icon min-h-11 min-w-11 ${isHot ? 'btn-primary' : 'btn-ghost'}`}
                            title={`Next ${label}`}
                        >
                            <Plus size={18} strokeWidth={2.25} />
                        </button>
                    </div>
                </div>
            </div>

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

export function MediaTable({ mediaList, isLoading, filtersActive, onClearFilters }: MediaTableProps) {
    if (isLoading) {
        return (
            <div className="border-y border-rule md:border md:rounded-card overflow-hidden" aria-busy="true" aria-label="Loading entries">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-rule last:border-b-0">
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-paper-2 rounded-full w-2/3 animate-pulse keep-motion" />
                            <div className="h-3 bg-paper-2 rounded-full w-1/4 animate-pulse keep-motion" />
                        </div>
                        <div className="hidden lg:block h-4 w-24 bg-paper-2 rounded-full animate-pulse keep-motion" />
                        <div className="h-9 w-20 bg-paper-2 rounded-full animate-pulse keep-motion" />
                    </div>
                ))}
            </div>
        );
    }

    if (mediaList.length === 0) {
        return (
            <div className="border-y border-rule md:border md:rounded-card px-6 py-16 text-center">
                <BookOpen size={32} className="mx-auto mb-4 text-muted" strokeWidth={1.5} aria-hidden="true" />
                {filtersActive ? (
                    <>
                        <h2 className="text-2xl text-ink mx-auto">No matches</h2>
                        <p className="text-sm text-muted mt-2 mx-auto">Nothing fits the current search or filters.</p>
                        <button type="button" onClick={onClearFilters} className="btn btn-ghost min-h-11 px-5 mt-6">
                            Clear filters
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl text-ink mx-auto">No entries yet</h2>
                        <p className="text-sm text-muted mt-2 mx-auto">Press New to add your first entry.</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="-mx-4 md:mx-0 border-y border-rule md:border md:rounded-card overflow-hidden">
            {/* Desktop: table view */}
            <table className="hidden lg:table w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-12" />
                    <col />
                    <col className="w-28" />
                    <col className="w-32" />
                    <col className="w-36" />
                </colgroup>
                <thead>
                    <tr className="border-b border-rule">
                        <th scope="col" className="py-2.5 pl-4 pr-2 text-right text-sm font-medium text-muted">#</th>
                        <th scope="col" className="py-2.5 pr-4 text-left text-sm font-medium text-muted">Title</th>
                        <th scope="col" className="py-2.5 pr-4 text-left text-sm font-medium text-muted">Behind</th>
                        <th scope="col" className="py-2.5 pr-4 text-left text-sm font-medium text-muted">Progress</th>
                        <th scope="col" className="py-2.5 pr-4 text-right text-sm font-medium text-muted">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mediaList.map((media, index) => (
                        <MediaTableRow key={media.id} media={media} rank={index + 1} />
                    ))}
                </tbody>
            </table>

            {/* Phones and tablets: card list view */}
            <div className="lg:hidden divide-y divide-rule">
                {mediaList.map((media) => (
                    <MobileCard key={media.id} media={media} />
                ))}
            </div>
        </div>
    );
}
