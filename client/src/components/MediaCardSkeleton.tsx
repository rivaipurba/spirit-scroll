export function MediaCardSkeleton() {
    return (
        <div className="flex items-center bg-white/5 rounded-xl p-3 border border-white/5 mb-3 animate-pulse">
            {/* Cover Image Skeleton */}
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-white/10 flex-shrink-0 mr-4" />
            
            {/* Content Skeleton */}
            <div className="flex-1 min-w-0 py-1">
                {/* Title */}
                <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                
                {/* Chapter info */}
                <div className="h-3 bg-white/10 rounded mb-3 w-1/2" />
                
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full" />
                    <div className="flex gap-1">
                        <div className="w-7 h-7 bg-white/10 rounded-lg" />
                        <div className="w-7 h-7 bg-white/10 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}

