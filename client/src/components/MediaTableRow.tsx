import { useUpdateProgress } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import { useState } from 'react';
import { EditMediaDialog } from './EditMediaDialog';
import { Plus, Minus, ExternalLink } from 'lucide-react';
import { STATUS_COLORS, getStatusLabel } from '../lib/media-utils';
import type { Media } from '../types/index';

interface MediaTableRowProps {
    media: Media;
    rank: number;
}


export function MediaTableRow({ media, rank }: MediaTableRowProps) {
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
            <tr
                onClick={() => setIsEditOpen(true)}
                className="border-b border-mal-border hover:bg-mal-hover transition-colors cursor-pointer group"
            >
                <td className="py-3 px-3 text-center text-sm text-mal-text-secondary/60 font-medium w-10">
                    {rank}
                </td>

                <td className="py-3 w-[60px]">
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
                </td>

                <td className="py-3 pr-4">
                    <div className="text-sm font-semibold text-mal-text leading-tight group-hover:text-mal-blue transition-colors">
                        {media.sourceUrl ? (
                            <a
                                href={media.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-mal-blue transition-colors inline-flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {media.title}
                                <ExternalLink size={12} className="opacity-40" />
                            </a>
                        ) : (
                            media.title
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
                </td>

                <td className="py-3 pr-4 w-32">
                    <div className="text-sm font-medium text-mal-text">
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
                </td>

                <td className="py-3 pr-4 w-28">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold text-black ${STATUS_COLORS[media.status] || 'bg-mal-gray'}`}>
                        {getStatusLabel(media.status, media.type)}
                    </span>
                </td>

                <td className="py-3 w-24">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
