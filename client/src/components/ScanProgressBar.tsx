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
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-mal-blue rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2">
                    {isScanning && progress ? (
                        <>
                            <span className="text-xs text-gray-500 truncate max-w-[80%]">
                                Checking {progress.current}/{progress.total}: <span className="text-gray-700 font-medium">{progress.currentTitle}</span>
                            </span>
                            <button
                                onClick={onCancel}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-2 font-medium cursor-pointer"
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
