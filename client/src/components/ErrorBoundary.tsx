import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
        }
        return this.props.children;
    }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
    return (
        <div className="min-h-[50dvh] flex flex-col items-center justify-center p-8 text-center bg-paper text-ink">
            <AlertTriangle className="w-6 h-6 text-error mb-4" aria-hidden="true" />
            <h2 className="text-2xl text-ink mb-2 mx-auto">Something went wrong</h2>
            <p className="text-ink-2 mb-6 max-w-md mx-auto">
                {error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button
                type="button"
                onClick={resetError}
                className="btn btn-ghost min-h-11 px-5"
            >
                <RefreshCw size={16} aria-hidden="true" />
                Try Again
            </button>
        </div>
    );
}
