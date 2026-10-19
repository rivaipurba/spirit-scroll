import { useState, useEffect } from 'react';
import { Loader2, Book } from 'lucide-react';
import { useMediaList, useMediaStats, useScanUpdates } from '../hooks/useMedia';
import { MediaTable } from './MediaTable';
import { ScanProgressBar } from './ScanProgressBar';
import { NewEntryDialog } from './NewEntryDialog';
import { useSearch } from '../context/SearchContext';
import { useFilters } from '../context/FilterContext';
import type { Media, MediaStats } from '../types/index';

interface DashboardProps {
    isDialogOpen: boolean;
    onCloseDialog: () => void;
    onStatsChange: (stats: MediaStats) => void;
    registerScanFn: (fn: () => void) => void;
    onScanningChange: (scanning: boolean) => void;
}

type SortOption = 'updates' | 'title' | 'unwatched';

const PAGE_SIZE = 50;

export function Dashboard({ isDialogOpen, onCloseDialog, onStatsChange, registerScanFn, onScanningChange }: DashboardProps) {
    const [sortBy, setSortBy] = useState<SortOption>('updates');
    const [page, setPage] = useState(1);
    const { searchQuery } = useSearch();
    const { statusFilter, typeFilter } = useFilters();

    const apiType = typeFilter === 'ALL' ? undefined : typeFilter as 'MANHUA' | 'DONGHUA';
    const apiStatus = statusFilter === 'ALL' ? undefined : statusFilter;

    // Any filter change invalidates the current page number
    const [filterKey, setFilterKey] = useState({ statusFilter, typeFilter, searchQuery });
    if (filterKey.statusFilter !== statusFilter || filterKey.typeFilter !== typeFilter || filterKey.searchQuery !== searchQuery) {
        setFilterKey({ statusFilter, typeFilter, searchQuery });
        setPage(1);
    }

    const { data: stats, isLoading } = useMediaStats(apiType, searchQuery);
    const { data: paginatedData, isLoading: isPageLoading } = useMediaList(page, apiType, PAGE_SIZE, sortBy, searchQuery, apiStatus);

    const { startScan, cancelScan, isScanning, progress, result } = useScanUpdates();

    useEffect(() => {
        registerScanFn(startScan);
    }, [registerScanFn, startScan]);

    useEffect(() => {
        onScanningChange(isScanning);
    }, [isScanning, onScanningChange]);

    useEffect(() => {
        if (stats) onStatsChange(stats);
    }, [stats, onStatsChange]);

    const displayMedia = (paginatedData?.data || []) as Media[];
    const totalItems = paginatedData?.meta?.total ?? 0;
    const totalPages = Math.max(1, paginatedData?.meta?.totalPages ?? 1);

    const handlePrevPage = () => {
        setPage(p => Math.max(1, p - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNextPage = () => {
        setPage(p => Math.min(totalPages, p + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-mal-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-mal-blue" />
                <p className="text-sm font-medium">Loading...</p>
            </div>
        );
    }

    if (stats?.total === 0 && !searchQuery && !apiType) {
        return (
            <>
                <div className="bg-mal-panel rounded-lg border border-mal-border p-12 text-center">
                    <Book size={48} className="mx-auto mb-4 text-mal-text-secondary/30" />
                    <p className="text-mal-text-secondary font-medium">No entries yet</p>
                    <p className="text-mal-text-secondary/60 text-sm mt-1">Click the + button above to add your first entry!</p>
                </div>
                <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
            </>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-mal-panel border border-mal-border rounded-lg p-0.5 shadow-sm">
                        <button
                            onClick={() => { setSortBy('updates'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                sortBy === 'updates'
                                    ? 'bg-mal-blue text-white shadow-sm'
                                    : 'text-mal-text-secondary hover:text-white'
                            }`}
                        >
                            Updates
                        </button>
                        <button
                            onClick={() => { setSortBy('unwatched'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                sortBy === 'unwatched'
                                    ? 'bg-mal-blue text-white shadow-sm'
                                    : 'text-mal-text-secondary hover:text-white'
                            }`}
                        >
                            Most unwatched
                        </button>
                        <button
                            onClick={() => { setSortBy('title'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                sortBy === 'title'
                                    ? 'bg-mal-blue text-white shadow-sm'
                                    : 'text-mal-text-secondary hover:text-white'
                            }`}
                        >
                            A–Z
                        </button>
                    </div>
                </div>

                <div className="text-xs text-mal-text-secondary/60">
                    {totalItems} entries
                </div>
            </div>

            {(isScanning || result) && (
                <ScanProgressBar
                    isScanning={isScanning}
                    progress={progress}
                    result={result}
                    onCancel={cancelScan}
                />
            )}

            <MediaTable
                mediaList={displayMedia}
                isLoading={isPageLoading}
            />

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={handlePrevPage}
                        disabled={page <= 1}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-mal-border bg-mal-panel text-mal-text-secondary hover:bg-mal-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-mal-text-secondary/60">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={page >= totalPages}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-mal-border bg-mal-panel text-mal-text-secondary hover:bg-mal-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Next →
                    </button>
                </div>
            )}

            <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
        </div>
    );
}
