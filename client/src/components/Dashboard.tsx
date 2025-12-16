import { useMemo, useState, useEffect } from 'react';
import { Loader2, ArrowUpDown, Book, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMediaList } from '../hooks/useMedia';
import { MediaCard } from './MediaCard';
import { NewEntryDialog } from './NewEntryDialog';
import { useSearch } from '../context/SearchContext';

interface DashboardProps {
    isDialogOpen: boolean;
    onCloseDialog: () => void;
}

type SortOption = 'updates' | 'title' | 'progress' | 'recent' | 'type';

export function Dashboard({ isDialogOpen, onCloseDialog }: DashboardProps) {
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('updates');
    const { searchQuery } = useSearch();
    
    // Use larger page size for better sorting, but still paginate for performance
    const { data: paginatedMedia, isLoading, error, isPlaceholderData } = useMediaList(page, undefined, 20, searchQuery);
    const mediaList = paginatedMedia?.data;
    const meta = paginatedMedia?.meta;

    // Reset to page 1 when search query changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const sortedMedia = useMemo(() => {
        if (!mediaList) return [];

        let result = mediaList;

        // Search is now handled server-side, no need for client-side filtering

        // Sort based on selected option
        return [...result].sort((a: any, b: any) => {
            switch (sortBy) {
                case 'updates': {
                    // Calculate the "Gap" (Unread count)
                    const gapA = Math.max(0, (a.latestReleasedChapter || 0) - a.currentChapter);
                    const gapB = Math.max(0, (b.latestReleasedChapter || 0) - b.currentChapter);

                    // 1. If both have updates, the one with the LARGER gap comes first
                    if (gapA > 0 && gapB > 0) {
                        return gapB - gapA;
                    }

                    // 2. If only A has updates, A comes first
                    if (gapA > 0) return -1;

                    // 3. If only B has updates, B comes first
                    if (gapB > 0) return 1;

                    // 4. If neither has updates, sort by last modified (Newest first)
                    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.id;
                    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.id;

                    return timeB - timeA;
                }

                case 'title':
                    return a.title.localeCompare(b.title);

                case 'progress': {
                    // Sort by completion percentage (highest first)
                    const progressA = a.totalChapters ? (a.currentChapter / a.totalChapters) * 100 : 0;
                    const progressB = b.totalChapters ? (b.currentChapter / b.totalChapters) * 100 : 0;
                    return progressB - progressA;
                }

                case 'recent': {
                    // Sort by most recently updated (newest first)
                    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.id;
                    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.id;
                    return timeB - timeA;
                }

                case 'type':
                    // Sort by type (DONGHUA first, then MANHUA), then by title
                    if (a.type !== b.type) {
                        return a.type === 'DONGHUA' ? -1 : 1;
                    }
                    return a.title.localeCompare(b.title);

                default:
                    return 0;
            }
        });
    }, [mediaList, searchQuery, sortBy]);

    if (isLoading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                <p className="text-sm font-medium">Loading your path...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center text-red-500 p-4 text-center">
                <p className="font-bold mb-1">Failed to connect</p>
                <p className="text-sm text-slate-400">Could not reach the server. Make sure the API is running.</p>
                <p className="text-xs text-slate-600 mt-2 font-mono bg-white/5 p-2 rounded max-w-full overflow-hidden text-ellipsis border border-white/5">
                    {(error as Error).message}
                </p>
            </div>
        );
    }

    const sortOptions = [
        { value: 'updates', label: 'Updates First', icon: '🔥', desc: 'Items with new chapters first' },
        { value: 'title', label: 'Title A-Z', icon: '📝', desc: 'Alphabetical order' },
        { value: 'progress', label: 'Progress %', icon: '📊', desc: 'Most completed first' },
        { value: 'recent', label: 'Recently Updated', icon: '⏰', desc: 'Last modified first' },
        { value: 'type', label: 'Type (Anime/Manga)', icon: '🎭', desc: 'Group by content type' },
    ];

    return (
        <div className="pb-24">
            {/* Sorting Options */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <ArrowUpDown size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-300">Sort by:</span>
                    </div>
                    <span className="text-xs text-slate-500">
                        {meta ? `${meta.total} total • Page ${meta.page}/${meta.totalPages}` : `${sortedMedia.length} items`}
                    </span>
                </div>
                {meta && meta.totalPages > 1 && searchQuery && (
                    <div className="mb-2">
                        <p className="text-xs text-slate-500 text-center">
                            Search results • Sorting applies to current page only
                        </p>
                    </div>
                )}
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                setSortBy(option.value as SortOption);
                                setPage(1); // Reset to first page when sorting changes
                            }}
                            title={option.desc}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                sortBy === option.value
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                        >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col px-4">
                {isPlaceholderData && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                )}
                {sortedMedia?.map((media: any) => (
                    <MediaCard key={media.id} media={media} />
                ))}

                {sortedMedia.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        {searchQuery ? (
                            <p className="text-sm font-medium text-slate-400">No matches found for "{searchQuery}"</p>
                        ) : (
                            <>
                                <Book size={48} className="mb-4 text-slate-600" />
                                <p className="text-sm font-medium text-slate-400">No items to display</p>
                                <p className="text-xs text-slate-500 mt-2">Add some manga or anime to get started!</p>
                            </>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8 pb-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-300" />
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                                Page {meta.page} of {meta.totalPages}
                            </span>
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                            disabled={page === meta.totalPages || isPlaceholderData}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} className="text-slate-300" />
                        </button>
                    </div>
                )}
            </div>

            <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
        </div>
    );
}
