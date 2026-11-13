import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
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
    const [sourceUrl, setSourceUrl] = useState(media.sourceUrl || (media as Media & { source_url?: string }).source_url || '');
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
            setSourceUrl(media.sourceUrl || (media as Media & { source_url?: string }).source_url || '');
        }
    }, [isOpen, media]);

    // Auto-suggest Completed status when current chapter reaches total
    useEffect(() => {
        if (isOpen) {
            const ch = Number(currentChapter);
            const total = Number(totalChapters);
            if (total > 0 && ch >= total) {
                setStatus('COMPLETED');
            }
        }
    }, [currentChapter, totalChapters, isOpen]);

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

    // Portal to <body>: this dialog is rendered next to a <tr>, and a <div> is invalid inside <tbody>
    return createPortal(
        <>
            <div className="fixed inset-0 z-(--z-modal) flex items-end sm:items-center justify-center sm:p-4">
                <div className="fade-in absolute inset-0 bg-scrim" onClick={onClose} />
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`edit-title-${media.id}`}
                    className="sheet-in relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-paper-2 border border-rule rounded-t-card sm:rounded-card shadow-card px-6 pt-6 pb-6"
                >
                    <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="min-w-0">
                            <h2 id={`edit-title-${media.id}`} className="text-2xl text-ink">Edit Entry</h2>
                            <p className="text-sm text-muted mt-1 truncate">{media.type === 'DONGHUA' ? 'Donghua' : 'Manhua'}</p>
                        </div>
                        <button type="button" onClick={onClose} aria-label="Close" className="btn btn-quiet btn-icon -mr-2 shrink-0">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor={`edit-name-${media.id}`} className="label">Title</label>
                            <input
                                id={`edit-name-${media.id}`}
                                name="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoComplete="off"
                                className="field"
                                placeholder="Title"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor={`edit-type-${media.id}`} className="label">Type</label>
                                <select
                                    id={`edit-type-${media.id}`}
                                    name="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as "MANHUA" | "DONGHUA")}
                                    className="field"
                                >
                                    <option value="MANHUA">Manhua</option>
                                    <option value="DONGHUA">Donghua</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor={`edit-status-${media.id}`} className="label">Status</label>
                                <select
                                    id={`edit-status-${media.id}`}
                                    name="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as typeof status)}
                                    className="field"
                                >
                                    <option value="READING">Reading / Watching</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="DROPPED">Dropped</option>
                                    <option value="PLAN_TO_READ">Plan to Read / Watch</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor={`edit-current-${media.id}`} className="label">Current Ch./Ep.</label>
                                <input
                                    id={`edit-current-${media.id}`}
                                    name="currentChapter"
                                    type="number"
                                    inputMode="numeric"
                                    value={currentChapter}
                                    onChange={(e) => setCurrentChapter(e.target.value)}
                                    min="0"
                                    className="field tabular-nums"
                                />
                            </div>
                            <div>
                                <label htmlFor={`edit-total-${media.id}`} className="label">Total Ch./Ep.</label>
                                <input
                                    id={`edit-total-${media.id}`}
                                    name="totalChapters"
                                    type="number"
                                    inputMode="numeric"
                                    value={totalChapters}
                                    onChange={(e) => setTotalChapters(e.target.value)}
                                    min="0"
                                    className="field tabular-nums"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor={`edit-source-${media.id}`} className="label">Source URL</label>
                            <input
                                id={`edit-source-${media.id}`}
                                name="sourceUrl"
                                type="url"
                                inputMode="url"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                className="field"
                                placeholder="https://…"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 border-t border-rule">
                            <button
                                type="button"
                                onClick={() => setIsDeleteConfirmOpen(true)}
                                className="btn btn-danger pl-3"
                            >
                                <Trash2 size={16} aria-hidden="true" />
                                Delete
                            </button>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-quiet"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMedia.isPending}
                                    aria-busy={updateMedia.isPending}
                                    className="btn btn-primary min-h-11 px-5"
                                >
                                    {updateMedia.isPending ? 'Saving…' : 'Save Changes'}
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
        </>,
        document.body
    );
}
