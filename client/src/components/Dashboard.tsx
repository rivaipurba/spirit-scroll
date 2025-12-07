import { useState, useMemo } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useMediaList } from '../hooks/useMedia';
import { MediaCard } from './MediaCard';
import { NewEntryDialog } from './NewEntryDialog';

export function Dashboard() {
    const { data: mediaList, isLoading, error } = useMediaList();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const sortedMedia = useMemo(() => {
        if (!mediaList) return [];

        return [...mediaList].sort((a: any, b: any) => {
            // Calculate the "Gap" (Unread count)
            // specific check: ensure we don't get negative numbers if data is weird
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
            // Using updatedAt if available, otherwise fallback to ID (usually chronological)
            const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.id;
            const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.id;

            return timeB - timeA;
        });
    }, [mediaList]);

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
            <header className="flex justify-between items-center px-6 py-6 sticky top-0 z-20 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">SpiritScroll</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ring-1 ring-white/5">
                        <Search size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ring-1 ring-white/5"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            <div className="flex flex-col px-4 pt-4">
                {sortedMedia?.map((media: any) => (
                    <MediaCard key={media.id} media={media} />
                ))}
            </div>

            <NewEntryDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
        </div>
    );
}
