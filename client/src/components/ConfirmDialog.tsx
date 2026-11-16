import { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = "OK",
    cancelText = "Cancel",
    variant = 'default',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    useDialogFocus(panelRef, isOpen, onCancel);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-(--z-modal) flex items-end sm:items-center justify-center sm:p-4">
            <div className="fade-in absolute inset-0 bg-scrim" onClick={onCancel} />
            <div
                ref={panelRef}
                tabIndex={-1}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
                className="sheet-in relative w-full sm:max-w-sm bg-paper-2 border border-rule rounded-t-card sm:rounded-card shadow-card p-6"
            >
                <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle
                        size={20}
                        className={`shrink-0 ${variant === 'danger' ? 'text-error' : 'text-ink-2'}`}
                        aria-hidden="true"
                    />
                    <h2 id="confirm-title" className="text-2xl text-ink">{title}</h2>
                </div>

                <p id="confirm-message" className="text-md text-ink-2 mb-6">{message}</p>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        data-autofocus
                        className="btn btn-ghost flex-1 min-h-11"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`btn flex-1 min-h-11 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
