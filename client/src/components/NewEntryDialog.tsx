import React, { useRef, useState } from 'react';
import { X, Book, Youtube } from 'lucide-react';
import { useCreateMedia } from '../hooks/useMedia';
import { useDialogFocus } from '../hooks/useDialogFocus';

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
    const [status, setStatus] = useState<"READING" | "COMPLETED" | "PLAN_TO_READ" | "ON_HOLD" | "DROPPED">('READING');

    const createMedia = useCreateMedia();

    const panelRef = useRef<HTMLDivElement>(null);
    useDialogFocus(panelRef, isOpen, onClose);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMedia.mutate({
            title,
            type,
            currentChapter: Number(currentChapter) || 0,
            totalChapters: Number(totalChapters),
            status,
            sourceUrl
        }, {
            onSuccess: () => {
                onClose();
                setTitle('');
                setCurrentChapter('');
                setTotalChapters('');
                setSourceUrl('');
                setStatus('READING');
            }
        });
    };

    const segment = (value: "MANHUA" | "DONGHUA", label: string, Icon: typeof Book) => (
        <button
            type="button"
            onClick={() => setType(value)}
            aria-pressed={type === value}
            className={`btn flex-1 ${type === value ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-3 hover:text-ink'}`}
        >
            <Icon size={16} aria-hidden="true" />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-(--z-modal) flex items-end sm:items-center justify-center sm:p-4">
            <div className="fade-in absolute inset-0 bg-scrim" onClick={onClose} />
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-entry-title"
                className="sheet-in relative flex flex-col w-full sm:max-w-md max-h-[92dvh] bg-paper-2 border border-rule rounded-t-card sm:rounded-card shadow-card overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4">
                    <h2 id="new-entry-title" className="text-2xl text-ink">New Entry</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="btn btn-quiet btn-icon -mr-2">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 pb-6">
                    <form id="new-entry-form" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="new-title" className="label">Title</label>
                            <input
                                id="new-title"
                                data-autofocus
                                name="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter title"
                                autoComplete="off"
                                required
                                className="field"
                            />
                        </div>

                        <div>
                            <span id="new-type-label" className="label">Type</span>
                            <div role="group" aria-labelledby="new-type-label" className="flex gap-1 rounded-full bg-paper p-1 shadow-[inset_0_0_0_1px_var(--color-rule)]">
                                {segment('MANHUA', 'Manhua', Book)}
                                {segment('DONGHUA', 'Donghua', Youtube)}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="new-status" className="label">Status</label>
                            <select
                                id="new-status"
                                name="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as typeof status)}
                                className="field"
                            >
                                <option value="READING">Reading / Watching</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="new-current" className="label">Current Ch./Ep.</label>
                                <input
                                    id="new-current"
                                    name="currentChapter"
                                    type="number"
                                    inputMode="numeric"
                                    value={currentChapter}
                                    onChange={(e) => setCurrentChapter(e.target.value)}
                                    min="0"
                                    placeholder="0"
                                    className="field tabular-nums"
                                />
                            </div>
                            <div>
                                <label htmlFor="new-total" className="label">Total</label>
                                <input
                                    id="new-total"
                                    name="totalChapters"
                                    type="number"
                                    inputMode="numeric"
                                    value={totalChapters}
                                    onChange={(e) => setTotalChapters(e.target.value)}
                                    min="0"
                                    placeholder="Optional"
                                    className="field tabular-nums"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="new-source" className="label">
                                Source URL <span className="font-normal">(optional)</span>
                            </label>
                            <input
                                id="new-source"
                                name="sourceUrl"
                                type="url"
                                inputMode="url"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                placeholder="https://…"
                                className="field"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-rule">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-quiet"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="new-entry-form"
                        disabled={createMedia.isPending || !title.trim()}
                        aria-busy={createMedia.isPending}
                        className="btn btn-primary min-h-11 px-5"
                    >
                        {createMedia.isPending ? 'Adding…' : 'Add Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
}
