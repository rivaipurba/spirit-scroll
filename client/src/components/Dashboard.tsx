import { useState, useEffect } from 'react';
import { Loader2, Book, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMediaList } from '../hooks/useMedia';
import { MediaCard } from './MediaCard';
import { NewEntryDialog } from './NewEntryDialog';
import type { Media } from '../types/index';
import { useSearch } from '../context/SearchContext';

interface DashboardProps {
    isDialogOpen: boolean;
    onCloseDialog: () => void;
}

type SortOption = 'updates' | 'title';
type TypeFilter = 'ALL' | 'MANHUA' | 'DONGHUA';

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'MANHUA', label: 'Manhua' },
    { id: 'DONGHUA', label: 'Donghua' },
];

export function Dashboard({ isDialogOpen, onCloseDialog }: DashboardProps) {
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('updates');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
    const { searchQuery } = useSearch();

    // Use 12 items per page
    const { data: paginatedMedia, isLoading, error, isPlaceholderData } = useMediaList(
        page,
        typeFilter === 'ALL' ? undefined : typeFilter,
        12,
        sortBy,
        searchQuery
    );
    const mediaList = paginatedMedia?.data || [];
    const meta = paginatedMedia?.meta;

    // Reset to page 1 when search/filter changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery, typeFilter, sortBy]);

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



    return (
        <div className="pb-24">
            {/* Filter & Sort Bar */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between gap-3">
                    {/* Type filter tabs */}
                    <div className="flex gap-1.5">
                        {TYPE_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setTypeFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${typeFilter === tab.id
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort toggle */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                        <button
                            onClick={() => setSortBy('updates')}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${sortBy === 'updates'
                                ? 'bg-white/10 text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Updates
                        </button>
                        <button
                            onClick={() => setSortBy('title')}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${sortBy === 'title'
                                ? 'bg-white/10 text-white'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            A–Z
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4">
                {isPlaceholderData && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaList?.map((media: Media, index: number) => (
                        <MediaCard key={media.id} media={media} priority={index < 6} />
                    ))}
                </div>

                {mediaList.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-50">
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
                    <div className="col-span-full flex items-center justify-center gap-4 mt-8 pb-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            aria-label="Previous page"
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                            aria-label="Next page"
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
