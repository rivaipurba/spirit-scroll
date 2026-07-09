import { CheckCircle } from 'lucide-react';

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
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
            <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-sm relative shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${
                        variant === 'danger' ? 'bg-red-50' : 'bg-mal-blue/10'
                    }`}>
                        <CheckCircle size={20} className={
                            variant === 'danger' ? 'text-mal-red' : 'text-mal-blue'
                        } />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
                
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg font-medium transition-colors border border-gray-200 cursor-pointer"
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
