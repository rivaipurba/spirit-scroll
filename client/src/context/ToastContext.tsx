import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastContainer';

interface ToastContextType {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const { toasts, removeToast, success, error, info } = useToast();

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
}