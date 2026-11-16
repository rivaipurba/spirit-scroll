import { useState, useEffect } from 'react';
import { Loader2, BookOpen, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
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

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: 'updates', label: 'Updates' },
    { id: 'unwatched', label: 'Most unwatched' },
    { id: 'title', label: 'A–Z' },
];

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

    const { data: stats, isLoading, isError: isStatsError, refetch: refetchStats } = useMediaStats(apiType, searchQuery);
    const { data: paginatedData, isLoading: isPageLoading, isError: isListError, refetch: refetchList } = useMediaList(page, apiType, PAGE_SIZE, sortBy, searchQuery, apiStatus);

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
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted" role="status">
                <Loader2 className="w-6 h-6 animate-spin keep-motion" aria-hidden="true" />
                <p className="text-sm">Loading…</p>
            </div>
        );
    }

    if (isStatsError || isListError) {
        return (
            <>
                <div role="alert" className="max-w-md mx-auto py-16 md:py-24 text-center">
                    <AlertTriangle size={28} className="mx-auto mb-6 text-error" strokeWidth={1.75} aria-hidden="true" />
                    <h1 className="text-3xl text-ink mx-auto">Couldn’t load your library</h1>
                    <p className="text-md text-ink-2 mt-3 mx-auto">Check your connection or the server, then try again.</p>
                    <button
                        type="button"
                        onClick={() => { refetchStats(); refetchList(); }}
                        className="btn btn-ghost min-h-11 px-5 mt-6"
                    >
                        <RefreshCw size={16} aria-hidden="true" />
                        Try again
                    </button>
                </div>
                <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
            </>
        );
    }

    if (stats?.total === 0 && !searchQuery && !apiType) {
        return (
            <>
                <div className="max-w-md mx-auto py-16 md:py-24 text-center">
                    <BookOpen size={32} className="mx-auto mb-6 text-muted" strokeWidth={1.5} aria-hidden="true" />
                    <h1 className="text-3xl text-ink mx-auto">No entries yet</h1>
                    <p className="text-md text-ink-2 mt-3 mx-auto">Click the + button above to add your first entry!</p>
                </div>
                <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
            </>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div role="group" aria-label="Sort entries" className="flex items-center gap-0.5 rounded-full bg-paper-2 p-1 shadow-[inset_0_0_0_1px_var(--color-rule)] overflow-x-auto [scrollbar-width:none]">
                    {SORT_OPTIONS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => { setSortBy(id); setPage(1); }}
                            aria-pressed={sortBy === id}
                            className={`btn min-h-11 lg:min-h-9 px-3 shrink-0 ${
                                sortBy === id
                                    ? 'bg-ink text-paper'
                                    : 'text-ink-2 hover:text-ink hover:bg-paper-3'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-muted tabular-nums whitespace-nowrap">
                    {totalItems} entries
                </p>
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
                <nav aria-label="Pagination" className="flex items-center justify-between md:justify-center gap-4 mt-6">
                    <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={page <= 1}
                        className="btn btn-ghost pl-3"
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                        Previous
                    </button>
                    <span className="text-sm text-muted tabular-nums">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={handleNextPage}
                        disabled={page >= totalPages}
                        className="btn btn-ghost pr-3"
                    >
                        Next
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </nav>
            )}

            <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
        </div>
    );
}
