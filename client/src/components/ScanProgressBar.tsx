import { Check } from 'lucide-react';

interface ScanProgressBarProps {
    isScanning: boolean;
    progress: { current: number; total: number; currentTitle: string } | null;
    result: { updated: number } | null;
    onCancel: () => void;
}

export function ScanProgressBar({ isScanning, progress, result, onCancel }: ScanProgressBarProps) {
    const fraction = progress && progress.total > 0 ? progress.current / progress.total : 1;

    return (
        <div className="mb-4 fade-in rounded-well bg-paper-2 border border-rule px-4 py-3" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3 min-h-9">
                {isScanning && progress ? (
                    <>
                        <p className="min-w-0 truncate text-sm text-ink-2">
                            Checking <span className="tabular-nums">{progress.current}/{progress.total}</span>:{' '}
                            <span className="text-ink font-medium">{progress.currentTitle}</span>
                        </p>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-quiet min-h-11 sm:min-h-9 px-3 shrink-0"
                        >
                            Cancel
                        </button>
                    </>
                ) : result ? (
                    <p className="flex items-center gap-2 text-sm text-ink">
                        <Check size={16} className="text-success shrink-0" aria-hidden="true" />
                        Scan complete. {result.updated} update{result.updated !== 1 ? 's' : ''} found
                    </p>
                ) : null}
            </div>
            <div className="meter mt-2">
                <span style={{ transform: `scaleX(${fraction})` }} className="bg-accent!" />
            </div>
        </div>
    );
}
