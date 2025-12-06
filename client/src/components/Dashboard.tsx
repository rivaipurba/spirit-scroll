import { useState } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useMediaList } from '../hooks/useMedia';
import { MediaCard } from './MediaCard';
import { NewEntryDialog } from './NewEntryDialog';

export function Dashboard() {
    const { data: mediaList, isLoading, error } = useMediaList();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                <button className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ring-1 ring-white/5">
                    <Search size={20} strokeWidth={2.5} />
                </button>
            </header>

            <div className="flex flex-col px-4 pt-4">
                {mediaList?.map((media: any) => (
                    <MediaCard key={media.id} media={media} />
                ))}
            </div>

            <button
                onClick={() => setIsDialogOpen(true)}
                className="fixed bottom-24 right-6 sm:right-8 lg:right-[calc(50%-18rem)] w-14 h-14 bg-indigo-600 text-white rounded-full shadow-[0_4px_20px_rgba(79,70,229,0.4)] flex items-center justify-center hover:scale-105 hover:bg-indigo-500 active:scale-95 transition-all z-40 bg-gradient-to-br from-indigo-500 to-indigo-700 border border-indigo-400/20"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>

            <NewEntryDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
        </div>
    );
}
