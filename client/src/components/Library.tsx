import { useState } from 'react';
import { useMediaList } from '../hooks/useMedia';
import { Loader2, Book, Youtube } from 'lucide-react';

export function Library() {
    const { data: mediaList, isLoading } = useMediaList();
    const [activeTab, setActiveTab] = useState<'ALL' | 'MANHUA' | 'DONGHUA'>('ALL');

    if (isLoading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const filteredMedia = mediaList?.filter((media: any) => {
        if (activeTab === 'ALL') return true;
        return media.type === activeTab;
    }) || [];

    const tabs = [
        { id: 'ALL', label: 'All' },
        { id: 'MANHUA', label: 'Manhua' },
        { id: 'DONGHUA', label: 'Donghua' },
    ];

    return (
        <div className="pb-24 pt-6 px-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-6 px-2">Library</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {filteredMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {filteredMedia.map((media: any) => <LibraryCard key={media.id} media={media} />)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <Book size={48} className="mb-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No scriptures found in this section.</p>
                </div>
            )}
        </div>
    );
}

function LibraryCard({ media }: { media: any }) {
    const isManhua = media.type === 'MANHUA';

    return (
        <div className="flex flex-col gap-2 group cursor-pointer">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
                {media.coverUrl ? (
                    <img
                        src={media.coverUrl}
                        alt={media.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/20">No Cover</div>
                )}

                {/* Type Badge Overlay */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5`}>
                    {isManhua ? (
                        <Book size={10} className="text-orange-400" />
                    ) : (
                        <Youtube size={10} className="text-blue-400" />
                    )}
                    <span className={`text-[8px] font-bold tracking-wider ${isManhua ? 'text-orange-400' : 'text-blue-400'}`}>
                        {media.type}
                    </span>
                </div>
            </div>

            <h3 className="text-xs font-semibold text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                {media.title}
            </h3>
        </div>
    )
}
