import React, { useState, useEffect } from 'react';
import { X, Book, Youtube, Trash2 } from 'lucide-react';
import { useUpdateMedia, useDeleteMedia } from '../hooks/useMedia';
import { ConfirmDialog } from './ConfirmDialog';
import type { Media } from '../types/index';

interface EditMediaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    media: Media;
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
            title: title.trim() || undefined,
            type,
            currentChapter: Number(currentChapter) || 0,
            totalChapters: totalChapters ? Number(totalChapters) : null,
            status,
            sourceUrl: sourceUrl?.trim() || null,
        }, {
            onSuccess: onClose,
        });
    };

    const handleDelete = () => {
        deleteMedia.mutate(media.id, {
            onSuccess: () => {
                setIsDeleteConfirmOpen(false);
                onClose();
            },
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md relative shadow-xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-mal-blue/10 rounded-lg">
                                {media.type === 'DONGHUA' ? (
                                    <Youtube size={20} className="text-mal-blue" />
                                ) : (
                                    <Book size={20} className="text-mal-blue" />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Edit Entry</h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                placeholder="Title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as "MANHUA" | "DONGHUA")}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                >
                                    <option value="MANHUA">Manhua</option>
                                    <option value="DONGHUA">Donghua</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                >
                                    <option value="READING">Reading</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="DROPPED">Dropped</option>
                                    <option value="PLAN_TO_READ">Plan to Read</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Current Ch./Ep.</label>
                                <input
                                    type="number"
                                    value={currentChapter}
                                    onChange={(e) => setCurrentChapter(e.target.value)}
                                    min="0"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Total Ch./Ep.</label>
                                <input
                                    type="number"
                                    value={totalChapters}
                                    onChange={(e) => setTotalChapters(e.target.value)}
                                    min="0"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Source URL</label>
                            <input
                                type="url"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteConfirmOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm text-mal-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMedia.isPending}
                                    className="px-4 py-2.5 text-sm font-medium bg-mal-blue text-white rounded-lg hover:bg-mal-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                                >
                                    {updateMedia.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title="Delete Entry"
                message={`Are you sure you want to delete "${media.title}"? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </>
    );
}
