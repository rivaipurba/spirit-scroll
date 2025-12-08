import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useMediaList } from '../hooks/useMedia';
import { MediaCard } from './MediaCard';
import { NewEntryDialog } from './NewEntryDialog';
import { useSearch } from '../context/SearchContext';

interface DashboardProps {
    isDialogOpen: boolean;
    onCloseDialog: () => void;
}

export function Dashboard({ isDialogOpen, onCloseDialog }: DashboardProps) {
    const { data: paginatedMedia, isLoading, error } = useMediaList(1, undefined, 10000);
    const mediaList = paginatedMedia?.data;
    const { searchQuery } = useSearch();

    const sortedMedia = useMemo(() => {
        if (!mediaList) return [];

        let result = mediaList;

        // Filter by Search Query
        if (searchQuery.trim()) {
            result = result.filter((m: any) =>
                m.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort
        return [...result].sort((a: any, b: any) => {
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
        });
    }, [mediaList, searchQuery]);

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
            {/* Header removed - now in Layout */}

            <div className="flex flex-col px-4 pt-4">
                {sortedMedia?.map((media: any) => (
                    <MediaCard key={media.id} media={media} />
                ))}

                {sortedMedia.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <p className="text-sm font-medium text-slate-400">No matches found for "{searchQuery}"</p>
                    </div>
                )}
            </div>

            <NewEntryDialog isOpen={isDialogOpen} onClose={onCloseDialog} />
        </div>
    );
}
