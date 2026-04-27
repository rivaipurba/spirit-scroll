import { Download, Upload, Database, FileJson, RefreshCw, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useMediaList as useMedia, useImportMedia, useUpdateMedia } from '../hooks/useMedia';
import { useToastContext } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
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
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json)) {
                    // Strip IDs to avoid conflicts
                    const cleanData = json.map(({ id, ...rest }) => rest);

                    importMedia.mutate(cleanData, {
                        onSuccess: (data) => {
                            setImportStatus({ type: 'success', message: `Successfully imported ${data.count} entries.` });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            setTimeout(() => setImportStatus(null), 5000);
                        },
                        onError: () => {
                            setImportStatus({ type: 'error', message: "Failed to import data." });
                        }
                    });
                } else {
                    setImportStatus({ type: 'error', message: "Invalid backup file format" });
                }
            } catch (err) {
                setImportStatus({ type: 'error', message: "Failed to parse JSON file" });
            }
        };
        reader.readAsText(file);
    };

    const handleReScrape = async () => {
        if (!media) return;
        setIsReScraping(true);

        const targets = media.filter((m: any) => m.sourceUrl && !m.coverUrl);
        let processed = 0;

        for (const item of targets) {
            try {
                await updateMedia.mutateAsync({
                    id: item.id,
                    sourceUrl: item.sourceUrl
                });
                processed++;
            } catch (error) {
                console.error(`Failed to scrape ${item.title}`, error);
            }
        }

        setIsReScraping(false);
        toast.success(
            'Re-scrape Complete',
            `Processed ${processed} items successfully.`
        );
    };

    const totalSeries = media?.length || 0;
    const totalChapters = media?.reduce((acc: any, curr: any) => acc + curr.currentChapter, 0) || 0;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Settings</h2>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database size={40} />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Total Series Tracked</h3>
                    <p className="text-4xl font-bold text-white">{totalSeries}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileJson size={40} />
                    </div>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Total Chapters Consumed</h3>
                    <p className="text-4xl font-bold text-indigo-400">{totalChapters}</p>
                </div>
            </div>

            {/* Data Management */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-6">Data Management</h3>

                <div className="flex flex-col gap-4">
                    {/* Export */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <Download size={20} />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-slate-200">Export Data</p>
                                <p className="text-xs text-slate-500">Download backup as JSON</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 transition-colors text-sm font-medium"
                        >
                            Export
                        </button>
                    </div>

                    {/* Import */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Upload size={20} />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-slate-200">Import Data</p>
                                <p className="text-xs text-slate-500">Restore from JSON backup</p>
                            </div>
                        </div>
                        <button
                            onClick={handleImportClick}
                            disabled={importMedia.isPending}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 transition-colors text-sm font-medium"
                        >
                            {importMedia.isPending ? 'Importing...' : 'Import'}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                    </div>
                </div>
                {importStatus && (
                    <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${importStatus.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {importStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {importStatus.message}
                    </div>
                )}
            </div>

            {/* Maintenance */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-6">Maintenance</h3>
                <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                <RefreshCw size={20} className={isReScraping ? "animate-spin" : ""} />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-slate-200">Refresh Covers</p>
                                <p className="text-xs text-slate-500">Re-scrape missing cover images</p>
                            </div>
                        </div>
                        <button
                            onClick={handleReScrape}
                            disabled={isReScraping}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isReScraping ? 'Scraping...' : 'Run Tool'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Account */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-6">Account</h3>
                <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                    <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                <LogOut size={20} />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-slate-200">Sign Out</p>
                                <p className="text-xs text-slate-500">Log out of your account</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
