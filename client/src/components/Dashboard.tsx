import { useState } from 'react';
import { Loader2, Book, Sparkles } from 'lucide-react';
import { useMediaList, useScanUpdates } from '../hooks/useMedia';
import { MediaCard } from './MediaCard';
import { NewEntryDialog } from './NewEntryDialog';
import { ScanProgressBar } from './ScanProgressBar';
import type { Media } from '../types/index';
import { useSearch } from '../context/SearchContext';

interface DashboardProps {
    isDialogOpen: boolean;
    onCloseDialog: () => void;
}

type SortOption = 'updates' | 'title';
type TypeFilter = 'MANHUA' | 'DONGHUA';

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
    { id: 'MANHUA', label: 'Manhua' },
    { id: 'DONGHUA', label: 'Donghua' },
];

export function Dashboard({ isDialogOpen, onCloseDialog }: DashboardProps) {
    const [sortBy, setSortBy] = useState<SortOption>('updates');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('DONGHUA');
    const { searchQuery } = useSearch();
    const { startScan, cancelScan, isScanning, progress, result } = useScanUpdates();

    const { data: paginatedMedia, isLoading, error } = useMediaList(
        1,
        typeFilter,
        1000,
        sortBy,
        searchQuery
    );
    const mediaList = paginatedMedia?.data || [];

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

                    <div className="flex items-center gap-2">
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

                        {/* Scan button */}
                        <button
                            onClick={startScan}
                            disabled={isScanning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Sparkles size={11} className={isScanning ? 'animate-pulse' : ''} />
                            {isScanning ? 'Scanning...' : 'Scan'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4">
                {(isScanning || result) && (
                    <ScanProgressBar
                        isScanning={isScanning}
                        progress={progress}
                        result={result}
                        onCancel={cancelScan}
                    />
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
                                <p className="text-sm font-medium text-slate-400">No {typeFilter.toLowerCase()} entries yet</p>
                                <p className="text-xs text-slate-500 mt-2">Add your first {typeFilter === 'MANHUA' ? 'manhua' : 'donghua'} to get started!</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
        </div>
    );
}
