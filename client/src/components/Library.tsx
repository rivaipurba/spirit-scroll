import { useState } from 'react';
import { useMediaList } from '../hooks/useMedia';
import { Loader2, Book, Youtube, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

type SortOption = 'title' | 'progress' | 'recent' | 'updates';

export function Library() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'MANHUA' | 'DONGHUA'>('ALL');
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('title');

    const { data, isLoading, isPlaceholderData } = useMediaList(page, activeTab === 'ALL' ? undefined : activeTab, 10, sortBy);

    const mediaList = data?.data || [];
    const meta = data?.meta;

    const handleTabChange = (tabId: 'ALL' | 'MANHUA' | 'DONGHUA') => {
        setActiveTab(tabId);
        setPage(1);
    };

    const handleSortChange = (newSortBy: SortOption) => {
        setSortBy(newSortBy);
        setPage(1); // Reset to first page when sorting changes
    };

    const sortOptions = [
        { value: 'title', label: 'Title A-Z', icon: '📝' },
        { value: 'progress', label: 'Progress %', icon: '📊' },
        { value: 'recent', label: 'Recent', icon: '⏰' },
        { value: 'updates', label: 'Updates', icon: '🔥' },
    ];

    if (isLoading) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const tabs = [
        { id: 'ALL', label: 'All' },
        { id: 'MANHUA', label: 'Manhua' },
        { id: 'DONGHUA', label: 'Donghua' },
    ];

    return (
        <div className="pb-24 pt-6 px-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-6 px-2">Library</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sorting Options */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-400">Sort by:</span>
                    </div>
                    <span className="text-xs text-slate-500">
                        {mediaList.length} item{mediaList.length !== 1 ? 's' : ''}
                    </span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value as SortOption)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                sortBy === option.value
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                            }`}
                        >
                            <span className="text-[10px]">{option.icon}</span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {mediaList.length > 0 ? (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        {mediaList.map((media: any) => <LibraryCard key={media.id} media={media} />)}
                    </div>

                    {/* Pagination Footer */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={20} className="text-slate-300" />
                            </button>

                            <span className="text-xs font-bold text-slate-400">
                                Page {meta.page} of {meta.totalPages}
                            </span>

                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages || isPlaceholderData}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={20} className="text-slate-300" />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <Book size={48} className="mb-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">
                        No scriptures found in this section.
                    </p>
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
