interface ScanProgressBarProps {
    isScanning: boolean;
    progress: { current: number; total: number; currentTitle: string } | null;
    result: { updated: number } | null;
    onCancel: () => void;
}

export function ScanProgressBar({ isScanning, progress, result, onCancel }: ScanProgressBarProps) {
    const percent = progress ? Math.round((progress.current / progress.total) * 100) : 100;

    return (
        <div className="mb-4 animate-in fade-in duration-200">
            <div className="bg-mal-panel rounded-lg border border-mal-border p-3 shadow-sm">
                <div className="h-1.5 bg-mal-card rounded-full overflow-hidden">
                    <div
                        className="h-full bg-mal-blue rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2">
                    {isScanning && progress ? (
                        <>
                            <span className="text-xs text-mal-text-secondary/70 truncate max-w-[80%]">
                                Checking {progress.current}/{progress.total}: <span className="text-mal-text font-medium">{progress.currentTitle}</span>
                            </span>
                            <button
                                onClick={onCancel}
                                className="text-xs text-mal-text-secondary hover:text-white transition-colors shrink-0 ml-2 font-medium cursor-pointer"
                            >
                                Cancel
                            </button>
                        </>
                    ) : result ? (
                        <span className="text-xs text-mal-green font-medium">
                            Scan complete — {result.updated} update{result.updated !== 1 ? 's' : ''} found
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
