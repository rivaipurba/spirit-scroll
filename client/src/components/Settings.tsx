import { Download, Upload, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useMediaList as useMedia, useMediaStats, useImportMedia } from '../hooks/useMedia';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import type { Media } from '../types/index';
import { useRef, useState } from 'react';

export function Settings() {
    const { data: paginatedMedia } = useMedia(1, undefined, 10000);
    const media = paginatedMedia?.data;
    const { data: mediaStats, isLoading: isStatsLoading } = useMediaStats();
    const importMedia = useImportMedia();
    const { logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [pendingImport, setPendingImport] = useState<Partial<Media>[] | null>(null);

    const handleExport = () => {
        if (!media) return;
        const dataStr = JSON.stringify(media, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `spiritscroll_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const confirmImport = () => {
        const data = pendingImport;
        setPendingImport(null);
        if (!data) return;
        importMedia.mutate(data, {
            onSuccess: () => {
                setImportStatus({ type: 'success', message: `Successfully imported ${data.length} entries` });
                setTimeout(() => setImportStatus(null), 5000);
            },
            onError: (err) => {
                setImportStatus({ type: 'error', message: `Import failed: ${err.message}` });
                setTimeout(() => setImportStatus(null), 5000);
            }
        });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) {
                    // Wait for the owner's confirmation before touching the library
                    setPendingImport(data);
                } else {
                    setImportStatus({ type: 'error', message: 'Invalid JSON format: expected an array of entries' });
                    setTimeout(() => setImportStatus(null), 5000);
                }
            } catch {
                setImportStatus({ type: 'error', message: 'Failed to parse JSON file' });
                setTimeout(() => setImportStatus(null), 5000);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const stats = {
        total: mediaStats?.total ?? 0,
        chapters: mediaStats?.chaptersRead ?? 0,
        reading: (mediaStats?.counts.READING ?? 0) + (mediaStats?.counts.WATCHING ?? 0),
        completed: mediaStats?.counts.COMPLETED ?? 0,
    };

    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl text-ink mb-8 md:mb-10">Settings</h1>

            <section aria-labelledby="library-stats-head" className="pb-10 border-b border-rule">
                <h2 id="library-stats-head" className="text-xl text-ink mb-5">Library Stats</h2>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-6">
                    <StatBox label="Total Series" value={isStatsLoading ? null : stats.total} />
                    <StatBox label="Total Chapters" value={isStatsLoading ? null : stats.chapters} />
                    <StatBox label="Reading" value={isStatsLoading ? null : stats.reading} />
                    <StatBox label="Completed" value={isStatsLoading ? null : stats.completed} />
                </dl>
            </section>

            <section aria-labelledby="backup-head" className="py-10 border-b border-rule">
                <h2 id="backup-head" className="text-xl text-ink mb-5">Backup & Restore</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={!media}
                        className="btn btn-primary min-h-11 px-5"
                    >
                        <Download size={16} aria-hidden="true" />
                        {media ? 'Export JSON' : 'Preparing export…'}
                    </button>
                    <button
                        type="button"
                        onClick={handleImportClick}
                        className="btn btn-ghost min-h-11 px-5"
                    >
                        <Upload size={16} aria-hidden="true" />
                        Import JSON
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {importStatus && (
                    <p role="status" className="mt-4 flex items-center gap-2 text-sm text-ink">
                        {importStatus.type === 'success'
                            ? <CheckCircle2 size={16} className="text-success shrink-0" aria-hidden="true" />
                            : <AlertCircle size={16} className="text-error shrink-0" aria-hidden="true" />}
                        {importStatus.message}
                    </p>
                )}
            </section>

            <ConfirmDialog
                isOpen={pendingImport !== null}
                title="Import entries?"
                message={`This file has ${pendingImport?.length ?? 0} entries. They are added to your library, so titles you already have may appear twice, and there is no undo. Export a backup first if unsure.`}
                confirmText="Import"
                onConfirm={confirmImport}
                onCancel={() => setPendingImport(null)}
            />

            <section className="pt-10">
                <button
                    type="button"
                    onClick={logout}
                    className="btn btn-danger min-h-11 px-5"
                >
                    <LogOut size={16} aria-hidden="true" />
                    Log Out
                </button>
            </section>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: number | null }) {
    return (
        <div className="pr-4 sm:border-l sm:border-rule sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="figure text-3xl text-ink mt-2">
                {value === null
                    ? <span className="block h-[1em] w-16 rounded-full bg-paper-2 animate-pulse keep-motion" aria-label="Loading" />
                    : value}
            </dd>
        </div>
    );
}
