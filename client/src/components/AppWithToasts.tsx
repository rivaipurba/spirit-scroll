import { ToastProvider } from '../context/ToastContext';

interface AppWithToastsProps {
    children: React.ReactNode;
}

export function AppWithToasts({ children }: AppWithToastsProps) {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}

// Usage: Wrap your main App component with this
// <AppWithToasts>
//   <App />
// </AppWithToasts>