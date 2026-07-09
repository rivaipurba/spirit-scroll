import { useState, useEffect } from 'react';
import { Loader2, Book } from 'lucide-react';
import { useMediaList, useScanUpdates } from '../hooks/useMedia';
import { MediaTable } from './MediaTable';
import { ScanProgressBar } from './ScanProgressBar';
import { NewEntryDialog } from './NewEntryDialog';
import { useSearch } from '../context/SearchContext';
import { useFilters } from '../context/FilterContext';
import type { Media } from '../types/index';

interface DashboardProps {
    isDialogOpen: boolean;
    onCloseDialog: () => void;
    onCountsChange: (counts: Record<string, number>, total: number, allMedia: Media[]) => void;
    registerScanFn: (fn: () => void) => void;
    onScanningChange: (scanning: boolean) => void;
}

type SortOption = 'updates' | 'title';

const PAGE_SIZE = 50;

export function Dashboard({ isDialogOpen, onCloseDialog, onCountsChange, registerScanFn, onScanningChange }: DashboardProps) {
    const [sortBy, setSortBy] = useState<SortOption>('updates');
    const [page, setPage] = useState(1);
    const { searchQuery } = useSearch();
    const { statusFilter, typeFilter } = useFilters();

    const apiType = typeFilter === 'ALL' ? undefined : typeFilter as 'MANHUA' | 'DONGHUA';

    const { data: allData, isLoading } = useMediaList(1, apiType, 10000, sortBy, searchQuery);
    const { data: paginatedData, isLoading: isPageLoading } = useMediaList(page, apiType, PAGE_SIZE, sortBy, searchQuery);

    const { startScan, cancelScan, isScanning, progress, result } = useScanUpdates();

    useEffect(() => {
        registerScanFn(startScan);
    }, [registerScanFn, startScan]);

    useEffect(() => {
        onScanningChange(isScanning);
    }, [isScanning, onScanningChange]);

    const allMedia = (allData?.data || []) as Media[];
    const paginatedMedia = (paginatedData?.data || []) as Media[];
    const totalItems = allData?.meta?.total || allMedia.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    // Compute counts and pass to parent
    useEffect(() => {
        const counts: Record<string, number> = {
            ALL: allMedia.length,
            READING: 0,
            COMPLETED: 0,
            ON_HOLD: 0,
            DROPPED: 0,
            PLAN_TO_READ: 0,
            MANHUA: 0,
            DONGHUA: 0,
        };

        for (const m of allMedia) {
            if (counts[m.status] !== undefined) counts[m.status]++;
            if (m.type === 'MANHUA') counts['MANHUA']++;
            if (m.type === 'DONGHUA') counts['DONGHUA']++;
        }

        onCountsChange(counts, allMedia.length, allMedia);
    }, [allMedia, onCountsChange]);

    const displayMedia: Media[] = statusFilter === 'ALL'
        ? paginatedMedia
        : paginatedMedia.filter(m => m.status === statusFilter);

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
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-mal-blue" />
                <p className="text-sm font-medium">Loading...</p>
            </div>
        );
    }

    if (allMedia.length === 0 && !searchQuery) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Book size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No entries yet</p>
                <p className="text-gray-400 text-sm mt-1">Click the + button above to add your first entry!</p>
            </div>
        );
    }

    return (
        <div>
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                        <button
                            onClick={() => { setSortBy('updates'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                sortBy === 'updates'
                                    ? 'bg-mal-blue text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Updates
                        </button>
                        <button
                            onClick={() => { setSortBy('title'); setPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                sortBy === 'title'
                                    ? 'bg-mal-blue text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            A–Z
                        </button>
                    </div>
                </div>

                <div className="text-xs text-gray-400">
                    {totalItems} entries
                </div>
            </div>

            {/* Scan Progress */}
            {(isScanning || result) && (
                <ScanProgressBar
                    isScanning={isScanning}
                    progress={progress}
                    result={result}
                    onCancel={cancelScan}
                />
            )}

            {/* Table */}
            <MediaTable
                mediaList={displayMedia}
                isLoading={isPageLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={handlePrevPage}
                        disabled={page <= 1}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={page >= totalPages}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Next →
                    </button>
                </div>
            )}

            <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
        </div>
    );
}
