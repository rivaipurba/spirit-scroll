import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: ToastAction;
    onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 4000, action, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    };

    const iconColor = {
        success: 'text-success',
        error: 'text-error',
        info: 'text-ink-2',
    };

    const Icon = icons[type];

    return (
        <div
            role={type === 'error' ? 'alert' : 'status'}
            className="sheet-in bg-paper-3 border border-rule-strong rounded-well shadow-card px-4 py-3 w-full sm:min-w-[300px] sm:max-w-[400px]"
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={`${iconColor[type]} shrink-0`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{title}</p>
                    {message && (
                        <p className="text-sm text-ink-2 mt-0.5">{message}</p>
                    )}
                </div>
                {action && (
                    <button
                        type="button"
                        onClick={() => { action.onClick(); onClose(id); }}
                        className="btn btn-ghost min-h-11 sm:min-h-9 px-3 shrink-0"
                    >
                        {action.label}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onClose(id)}
                    aria-label="Dismiss"
                    className="btn btn-quiet btn-icon min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 -mr-1 shrink-0"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
