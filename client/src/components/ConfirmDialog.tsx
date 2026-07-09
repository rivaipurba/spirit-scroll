import { AlertTriangle } from 'lucide-react';

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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="bg-mal-panel border border-mal-border rounded-xl p-6 w-full max-w-sm relative shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${
                        variant === 'danger' ? 'bg-mal-red/15' : 'bg-mal-blue/15'
                    }`}>
                        <AlertTriangle size={20} className={
                            variant === 'danger' ? 'text-mal-red' : 'text-mal-blue'
                        } />
                    </div>
                    <h3 className="text-lg font-semibold text-mal-text">{title}</h3>
                </div>
                
                <p className="text-mal-text-secondary mb-6 leading-relaxed">{message}</p>
                
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-mal-card hover:bg-mal-hover text-mal-text-secondary rounded-lg font-medium transition-colors border border-mal-border cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer ${
                            variant === 'danger' 
                                ? 'bg-mal-red hover:bg-red-500' 
                                : 'bg-mal-blue hover:bg-mal-blue-dark'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
