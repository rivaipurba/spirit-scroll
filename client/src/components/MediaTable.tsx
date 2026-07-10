import { useState } from 'react';
import { Plus, Minus, ExternalLink } from 'lucide-react';
import { MediaTableRow } from './MediaTableRow';
import { EditMediaDialog } from './EditMediaDialog';
import { STATUS_COLORS, getStatusLabel } from '../lib/media-utils';
import { useUpdateProgress } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import type { Media } from '../types/index';

interface MediaTableProps {
    mediaList: Media[];
    isLoading: boolean;
}

function MobileCard({ media }: { media: Media }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const updateProgress = useUpdateProgress();
    const toast = useToastContext();

    const hasUpdate = media.latestReleasedChapter != null && media.latestReleasedChapter > media.currentChapter;
    const progress = media.totalChapters ? Math.min((media.currentChapter / media.totalChapters) * 100, 100) : 0;
    const label = media.type === 'DONGHUA' ? 'Ep.' : 'Ch.';

    const handleQuickIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prevChapter = media.currentChapter;
        const nextChapter = media.currentChapter + 1;

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
            updateProgress.mutate({ id: media.id, currentChapter: media.currentChapter - 1 });
        }
    };

    return (
        <>
            <div
                onClick={() => setIsEditOpen(true)}
                className="flex flex-col gap-2 px-3 py-3 border-b border-mal-border hover:bg-mal-hover transition-colors cursor-pointer last:border-0"
            >
                <div className="flex gap-3">
                    {/* Cover */}
                    <div className="w-[50px] h-[70px] rounded overflow-hidden bg-mal-card flex-shrink-0 shadow-sm">
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
                    </div>

                    {/* Title + subtitle */}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-mal-text leading-tight">
                            {media.sourceUrl ? (
                                <a
                                    href={media.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-mal-blue transition-colors inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="truncate">{media.title}</span>
                                    <ExternalLink size={12} className="opacity-40 flex-shrink-0" />
                                </a>
                            ) : (
                                <span className="line-clamp-2">{media.title}</span>
                            )}
                        </div>
                        <div className="text-xs text-mal-text-secondary/60 mt-0.5">
                            {media.type === 'DONGHUA' ? 'Donghua' : 'Manhua'}
                            {hasUpdate && media.latestReleasedChapter != null && (
                                <span className="ml-2 text-mal-red font-medium">
                                    NEW ({media.latestReleasedChapter - media.currentChapter} {media.type === 'DONGHUA' ? 'unwatched' : 'unread'})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-mal-text">
                            {label} {media.currentChapter}
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
                    </div>

                    {/* Status badge */}
                    <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-xs font-bold text-black ${STATUS_COLORS[media.status] || 'bg-mal-gray'}`}>
                        {getStatusLabel(media.status, media.type)}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={handleQuickDecrement}
                            className="p-1.5 rounded-md border border-mal-border text-mal-text-secondary hover:text-white hover:bg-mal-hover transition-colors cursor-pointer"
                            title={`Previous ${label}`}
                        >
                            <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={handleQuickIncrement}
                            className="p-1.5 rounded-md bg-mal-blue text-white hover:bg-mal-blue-dark transition-colors cursor-pointer"
                            title={`Next ${label}`}
                        >
                            <Plus size={12} strokeWidth={2.5} />
                        </button>
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
}

export function MediaTable({ mediaList, isLoading }: MediaTableProps) {
    if (isLoading) {
        return (
            <div className="bg-mal-panel rounded-lg border border-mal-border p-4">
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-mal-border last:border-0">
                            <div className="w-8 h-4 bg-mal-card rounded animate-pulse" />
                            <div className="w-[50px] h-[70px] bg-mal-card rounded animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-mal-card rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-mal-card rounded w-1/2 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-3 py-3 border-b border-mal-border last:border-0">
                            <div className="w-[50px] h-[70px] bg-mal-card rounded animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-mal-card rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-mal-card rounded w-1/2 animate-pulse" />
                                <div className="h-3 bg-mal-card rounded w-1/3 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (mediaList.length === 0) {
        return (
            <div className="bg-mal-panel rounded-lg border border-mal-border p-12 text-center">
                <div className="text-mal-text-secondary/40 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <p className="text-mal-text-secondary font-medium">No entries found</p>
                <p className="text-mal-text-secondary/60 text-sm mt-1">Add your first entry to get started!</p>
            </div>
        );
    }

    return (
        <div className="bg-mal-panel rounded-lg border border-mal-border overflow-hidden">
            {/* Desktop: table view */}
            <table className="hidden md:table w-full">
                <thead>
                    <tr className="border-b border-mal-border bg-mal-card/50">
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-mal-text-secondary uppercase tracking-wider w-10">#</th>
                        <th className="py-2.5 text-xs font-semibold text-mal-text-secondary uppercase tracking-wider w-[60px]">Cover</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold text-mal-text-secondary uppercase tracking-wider">Title</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold text-mal-text-secondary uppercase tracking-wider w-32">Progress</th>
                        <th className="py-2.5 pr-4 text-left text-xs font-semibold text-mal-text-secondary uppercase tracking-wider w-28">Status</th>
                        <th className="py-2.5 text-left text-xs font-semibold text-mal-text-secondary uppercase tracking-wider w-24">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mediaList.map((media, index) => (
                        <MediaTableRow key={media.id} media={media} rank={index + 1} />
                    ))}
                </tbody>
            </table>

            {/* Mobile: card list view */}
            <div className="md:hidden divide-y divide-mal-border">
                {mediaList.map((media) => (
                    <MobileCard key={media.id} media={media} />
                ))}
            </div>
        </div>
    );
}
