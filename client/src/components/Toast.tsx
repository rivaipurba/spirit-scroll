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

    const styles = {
        success: {
            bg: 'bg-mal-green/10 border-mal-green/30',
            icon: 'text-mal-green',
            title: 'text-gray-800',
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            icon: 'text-mal-red',
            title: 'text-gray-800',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: 'text-mal-blue',
            title: 'text-gray-800',
        },
    };

    const Icon = icons[type];
    const style = styles[type];

    return (
        <div className={`${style.bg} border rounded-xl p-4 shadow-lg animate-in slide-in-from-right duration-200 w-full sm:min-w-[300px] sm:max-w-[400px]`}>
            <div className="flex items-start gap-3">
                <Icon size={20} className={`${style.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${style.title} text-sm`}>{title}</h4>
                    {message && (
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{message}</p>
                    )}
                    {action && (
                        <button
                            onClick={() => { action.onClick(); onClose(id); }}
                            className="mt-2 text-xs font-semibold text-mal-blue hover:text-mal-blue-dark transition-colors underline underline-offset-2 cursor-pointer"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onClose(id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1 cursor-pointer"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
