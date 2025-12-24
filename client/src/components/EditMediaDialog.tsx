import React, { useState, useEffect } from 'react';
import { X, Book, Youtube, Trash2 } from 'lucide-react';
import { useUpdateMedia, useDeleteMedia } from '../hooks/useMedia';
import { ConfirmDialog } from './ConfirmDialog';

interface EditMediaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    media: {
        id: number;
        title: string;
        type: "MANHUA" | "DONGHUA";
        currentChapter: number;
        totalChapters: number | null;
        status: "READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED";
        sourceUrl: string | null;
    }
}

export function EditMediaDialog({ isOpen, onClose, media }: EditMediaDialogProps) {
    const [title, setTitle] = useState(media.title);
    const [type, setType] = useState<"MANHUA" | "DONGHUA">(media.type);
    const [currentChapter, setCurrentChapter] = useState(media.currentChapter.toString());
    const [totalChapters, setTotalChapters] = useState(media.totalChapters?.toString() || '');
    const [status, setStatus] = useState<"READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED">(media.status);
    const [sourceUrl, setSourceUrl] = useState(media.sourceUrl || (media as any).source_url || '');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const updateMedia = useUpdateMedia();
    const deleteMedia = useDeleteMedia();

    useEffect(() => {
        if (isOpen) {
            setTitle(media.title);
            setType(media.type);
            setCurrentChapter(media.currentChapter.toString());
            setTotalChapters(media.totalChapters?.toString() || '');
            setStatus(media.status);
            setSourceUrl(media.sourceUrl || (media as any).source_url || '');
        }
    }, [isOpen, media]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMedia.mutate({
            id: media.id,
            title,
            type,
            currentChapter: Number(currentChapter) || 0,
            totalChapters: totalChapters === '' ? null : Number(totalChapters),
            status,
            sourceUrl: sourceUrl || null
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const handleDelete = () => {
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteMedia.mutate(media.id, {
            onSuccess: () => {
                onClose();
            }
        });
        setIsDeleteConfirmOpen(false);
    };

    const handleCancelDelete = () => {
        setIsDeleteConfirmOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="relative flex w-full max-w-md max-h-[80vh] flex-col rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">

                {/* 1. Fixed Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-4 shrink-0">
                    <h2 className="text-lg font-semibold text-white">Edit Entry</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-neutral-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                            placeholder="Enter series title"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('MANHUA')}
                                className={`p-3 rounded-md text-sm font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${type === 'MANHUA'
                                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-400'
                                    : 'bg-neutral-950 border-white/5 text-neutral-400 hover:bg-white/5 hover:text-neutral-300'
                                    }`}
                            >
                                <Book size={16} strokeWidth={2.5} />
                                Manhua
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('DONGHUA')}
                                className={`p-3 rounded-md text-sm font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${type === 'DONGHUA'
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                                    : 'bg-neutral-950 border-white/5 text-neutral-400 hover:bg-white/5 hover:text-neutral-300'
                                    }`}
                            >
                                <Youtube size={16} strokeWidth={2.5} />
                                Donghua
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Current Ch.</label>
                            <input
                                type="number"
                                min="0"
                                value={currentChapter}
                                onChange={(e) => setCurrentChapter(e.target.value)}
                                className="w-full rounded-md border border-white/10 bg-neutral-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Total Ch.</label>
                            <input
                                type="number"
                                value={totalChapters}
                                onChange={(e) => setTotalChapters(e.target.value)}
                                className="w-full rounded-md border border-white/10 bg-neutral-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                placeholder="Ongoing"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Source Link</label>
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            className="w-full rounded-md border border-white/10 bg-neutral-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full rounded-md border border-white/10 bg-neutral-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors appearance-none"
                        >
                            <option value="READING" className="bg-neutral-900">{type === 'DONGHUA' ? 'Watching' : 'Reading'}</option>
                            <option value="COMPLETED" className="bg-neutral-900">Completed</option>
                        </select>
                    </div>
                </div>

                {/* 3. Fixed Footer */}
                <div className="shrink-0 flex items-center gap-3 border-t border-white/10 bg-neutral-900 p-4 rounded-b-xl">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteMedia.isPending}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={updateMedia.isPending}
                        className="flex-1 h-12 rounded-xl bg-indigo-600 font-medium text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updateMedia.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title="Delete Entry"
                message={`Are you sure you want to delete "${media.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}
