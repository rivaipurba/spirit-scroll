import { Plus } from 'lucide-react';
import { useUpdateProgress } from '../hooks/useMedia';

interface MediaCardProps {
    media: {
        id: number;
        title: string;
        type: "MANHUA" | "DONGHUA";
        status: "READING" | "COMPLETED";
        currentChapter: number;
        totalChapters: number;
        coverUrl: string | null;
    };
}

export function MediaCard({ media }: MediaCardProps) {
    const updateProgress = useUpdateProgress();

    const handleQuickIncrement = () => {
        updateProgress.mutate({
            id: media.id,
            currentChapter: media.currentChapter + 1,
        });
    };

    const isManhua = media.type === 'MANHUA';
    const progress = Math.min((media.currentChapter / media.totalChapters) * 100, 100);

    return (
        <div className="group relative flex flex-row items-center gap-4 p-4 mb-4 rounded-2xl bg-[#111111] border border-white/5 shadow-lg overflow-hidden transition-all hover:bg-white/[0.02]">
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none ${isManhua ? 'bg-orange-500' : 'bg-blue-500'}`} />

            {/* Cover Image */}
            <div className={`h-24 w-16 bg-white/5 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-white/20 text-[10px] text-center border border-white/10 ring-1 ring-white/5 shadow-inner`}>
                {media.coverUrl ? (
                    <img src={media.coverUrl} alt={media.title} className="h-full w-full object-cover rounded-lg" />
                ) : (
                    <span className="px-2">No Cover</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isManhua
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                        {media.type}
                    </span>
                    <span className={`text-[9px] font-semibold tracking-wide ${media.status === 'READING' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {media.status}
                    </span>
                </div>

                <h3 className="font-semibold text-slate-100 text-base leading-tight mb-2 truncate group-hover:text-white transition-colors">
                    {media.title}
                </h3>

                {/* Progress Bar & Text */}
                <div className="w-full">
                    <div className="flex justify-between items-end mb-1">
                        <p className="text-xs text-slate-400">
                            Ch. <span className="font-semibold text-slate-200 text-sm">{media.currentChapter}</span>
                            <span className="text-slate-600 mx-1">/</span>
                            {media.totalChapters}
                        </p>
                        <span className="text-[10px] text-slate-500 font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${isManhua ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleQuickIncrement}
                disabled={updateProgress.isPending}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/90 bg-white/5 border border-white/10 shadow-lg hover:bg-indigo-500 hover:border-indigo-400 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:bg-white/5 z-10 group/btn"
            >
                <Plus size={18} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
            </button>
        </div>
    );
}
