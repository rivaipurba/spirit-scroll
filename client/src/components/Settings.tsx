import { Download, Upload, Database, FileJson, RefreshCw, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useMediaList as useMedia, useImportMedia, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { Media } from '../types/index';
import { useRef, useState } from 'react';

export function Settings() {
    const { data: paginatedMedia } = useMedia(1, undefined, 10000);
    const media = paginatedMedia?.data;
    const importMedia = useImportMedia();
    const updateMedia = useUpdateMedia();
    const toast = useToastContext();
    const { logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isReScraping, setIsReScraping] = useState(false);

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

    const handleReScrapeCovers = async () => {
        setIsReScraping(true);
        try {
            for (let i = 0; i < (media?.length || 0); i++) {
                const item = media[i];
                if (!item.coverUrl && item.sourceUrl) {
                    await updateMedia.mutateAsync({
                        id: item.id,
                        sourceUrl: item.sourceUrl,
                    });
                }
            }
            toast.success("Covers refreshed", "All missing covers have been re-scraped");
        } catch {
            toast.error("Refresh failed", "Something went wrong while re-scraping covers");
        }
        setIsReScraping(false);
    };

    const stats = {
        total: media?.length || 0,
        chapters: ((media as any[])?.reduce((sum: number, m: any) => sum + (m.currentChapter || 0), 0) || 0) as number,
        reading: media?.filter((m: Media) => m.status === 'READING').length || 0,
        completed: media?.filter((m: Media) => m.status === 'COMPLETED').length || 0,
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-mal-text">Settings</h2>

            <div className="bg-mal-panel rounded-lg border border-mal-border p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-mal-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database size={16} />
                    Library Stats
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatBox label="Total Series" value={stats.total} />
                    <StatBox label="Total Chapters" value={stats.chapters} />
                    <StatBox label="Reading" value={stats.reading} />
                    <StatBox label="Completed" value={stats.completed} />
                </div>
            </div>

            <div className="bg-mal-panel rounded-lg border border-mal-border p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-mal-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileJson size={16} />
                    Backup & Restore
                </h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-mal-blue text-white rounded-lg text-sm font-medium hover:bg-mal-blue-dark transition-colors shadow-sm cursor-pointer"
                    >
                        <Download size={16} />
                        Export JSON
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-2.5 border border-mal-border text-mal-text-secondary rounded-lg text-sm font-medium hover:bg-mal-hover transition-colors cursor-pointer"
                    >
                        <Upload size={16} />
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
                    <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                        importStatus.type === 'success'
                            ? 'bg-mal-green/15 text-mal-green'
                            : 'bg-mal-red/15 text-mal-red'
                    }`}>
                        {importStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {importStatus.message}
                    </div>
                )}
            </div>

            <div className="bg-mal-panel rounded-lg border border-mal-border p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-mal-text-secondary uppercase tracking-wider mb-4">Tools</h3>
                <button
                    onClick={handleReScrapeCovers}
                    disabled={isReScraping}
                    className="flex items-center gap-2 px-4 py-2.5 border border-mal-border text-mal-text-secondary rounded-lg text-sm font-medium hover:bg-mal-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    <RefreshCw size={16} className={isReScraping ? 'animate-spin' : ''} />
                    {isReScraping ? 'Re-scraping...' : 'Re-scrape Missing Covers'}
                </button>
            </div>

            <div className="bg-mal-panel rounded-lg border border-mal-border p-6 shadow-sm">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 bg-mal-red/15 text-mal-red rounded-lg text-sm font-medium hover:bg-mal-red/25 transition-colors cursor-pointer"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center p-3 bg-mal-card rounded-lg">
            <div className="text-2xl font-bold text-mal-text">{value}</div>
            <div className="text-xs text-mal-text-secondary/70 mt-0.5">{label}</div>
        </div>
    );
}
