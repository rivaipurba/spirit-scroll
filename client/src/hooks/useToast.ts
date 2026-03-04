import { useState, useCallback } from 'react';
import type { ToastData } from '../components/ToastContainer';
import type { ToastType, ToastAction } from '../components/Toast';

export function useToast() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number, action?: ToastAction) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastData = {
            id,
            type,
            title,
            message,
            duration,
            action,
        };

        setToasts(prev => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) => {
        return addToast('success', title, message, duration, action);
    }, [addToast]);

    const error = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) => {
        return addToast('error', title, message, duration, action);
    }, [addToast]);

    const info = useCallback((title: string, message?: string, duration?: number, action?: ToastAction) => {
        return addToast('info', title, message, duration, action);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
    };
}