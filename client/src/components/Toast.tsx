import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 4000, onClose }: ToastProps) {
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
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            icon: 'text-emerald-400',
            title: 'text-emerald-100',
        },
        error: {
            bg: 'bg-red-500/10 border-red-500/20',
            icon: 'text-red-400',
            title: 'text-red-100',
        },
        info: {
            bg: 'bg-blue-500/10 border-blue-500/20',
            icon: 'text-blue-400',
            title: 'text-blue-100',
        },
    };

    const Icon = icons[type];
    const style = styles[type];

    return (
        <div className={`${style.bg} border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right duration-300 min-w-[300px] max-w-[400px]`}>
            <div className="flex items-start gap-3">
                <Icon size={20} className={`${style.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${style.title} text-sm`}>{title}</h4>
                    {message && (
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{message}</p>
                    )}
                </div>
                <button
                    onClick={() => onClose(id)}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1 -m-1"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}