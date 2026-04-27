interface ScanProgressBarProps {
    isScanning: boolean;
    progress: { current: number; total: number; currentTitle: string } | null;
    result: { updated: number } | null;
    onCancel: () => void;
}

export function ScanProgressBar({ isScanning, progress, result, onCancel }: ScanProgressBarProps) {
    const percent = progress ? Math.round((progress.current / progress.total) * 100) : 100;

    return (
        <div className="mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="flex items-center justify-between mt-1.5">
                {isScanning && progress ? (
                    <>
                        <span className="text-xs text-slate-500 truncate max-w-[80%]">
                            Checking {progress.current}/{progress.total}: <span className="text-slate-400">{progress.currentTitle}</span>
                        </span>
                        <button
                            onClick={onCancel}
                            className="text-xs text-slate-600 hover:text-slate-400 transition-colors shrink-0 ml-2"
                        >
                            Cancel
                        </button>
                    </>
                ) : result ? (
                    <span className="text-xs text-emerald-400">
                        Scan complete — {result.updated} update{result.updated !== 1 ? 's' : ''} found
                    </span>
                ) : null}
            </div>
        </div>
    );
}
