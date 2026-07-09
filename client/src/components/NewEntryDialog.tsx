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
    const [currentChapter, setCurrentChapter] = useState('');
    const [totalChapters, setTotalChapters] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');

    const createMedia = useCreateMedia();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMedia.mutate({
            title,
            type,
            currentChapter: Number(currentChapter) || 0,
            totalChapters: Number(totalChapters),
            status: "READING",
            sourceUrl
        }, {
            onSuccess: () => {
                onClose();
                setTitle('');
                setCurrentChapter('');
                setTotalChapters('');
                setSourceUrl('');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            <div
                className="bg-white border border-gray-200 w-full max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-xl relative pointer-events-auto shadow-xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-mal-blue/10 rounded-lg">
                            {type === 'DONGHUA' ? (
                                <Youtube size={20} className="text-mal-blue" />
                            ) : (
                                <Book size={20} className="text-mal-blue" />
                            )}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">New Entry</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)] p-4 sm:p-6 pb-8">
                    <form id="new-entry-form" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter title"
                                required
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setType('MANHUA')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                        type === 'MANHUA'
                                            ? 'bg-mal-blue text-white shadow-sm'
                                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <Book size={16} />
                                    Manhua
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('DONGHUA')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                        type === 'DONGHUA'
                                            ? 'bg-mal-blue text-white shadow-sm'
                                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <Youtube size={16} />
                                    Donghua
                                </button>
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
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
                                <input
                                    type="number"
                                    value={totalChapters}
                                    onChange={(e) => setTotalChapters(e.target.value)}
                                    min="0"
                                    placeholder="Optional"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Source URL <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="url"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mal-blue/30 focus:border-mal-blue transition-all"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center justify-end gap-2 p-4 sm:p-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="new-entry-form"
                        disabled={createMedia.isPending || !title.trim()}
                        className="px-4 py-2.5 text-sm font-medium bg-mal-blue text-white rounded-lg hover:bg-mal-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                    >
                        {createMedia.isPending ? 'Adding...' : 'Add Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
}
