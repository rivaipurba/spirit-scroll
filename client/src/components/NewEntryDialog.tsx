import React, { useState } from 'react';
import { X, Book, Youtube } from 'lucide-react';
import { useCreateMedia } from '../hooks/useMedia';

interface NewEntryDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewEntryDialog({ isOpen, onClose }: NewEntryDialogProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<"MANHUA" | "DONGHUA">('MANHUA');
    const [totalChapters, setTotalChapters] = useState('');

    const createMedia = useCreateMedia();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMedia.mutate({
            title,
            type,
            totalChapters: Number(totalChapters),
            status: "READING"
        }, {
            onSuccess: () => {
                onClose();
                setTitle('');
                setTotalChapters('');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
            <div className="bg-[#111] border border-white/10 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 relative pointer-events-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 text-white">New Entry</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-white placeholder-slate-600 transition-all font-medium"
                            placeholder="Enter series title"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('MANHUA')}
                                className={`py-3 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${type === 'MANHUA'
                                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                                        : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                    }`}
                            >
                                <Book size={18} strokeWidth={2.5} />
                                Manhua
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('DONGHUA')}
                                className={`py-3 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${type === 'DONGHUA'
                                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                        : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                    }`}
                            >
                                <Youtube size={18} strokeWidth={2.5} />
                                Donghua
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Chapters</label>
                        <input
                            type="number"
                            required
                            value={totalChapters}
                            onChange={(e) => setTotalChapters(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-white placeholder-slate-600 transition-all font-medium"
                            placeholder="e.g. 1000"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={createMedia.isPending}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all hover:brightness-110 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createMedia.isPending ? 'Creating...' : 'Create Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
}
