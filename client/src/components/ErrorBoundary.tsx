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
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-mal-red/15 rounded-full p-4 mb-4">
                <AlertTriangle className="w-8 h-8 text-mal-red" />
            </div>
            <h2 className="text-xl font-bold text-mal-text mb-2">Something went wrong</h2>
            <p className="text-mal-text-secondary mb-4 max-w-md">
                {error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button
                onClick={resetError}
                className="flex items-center gap-2 px-4 py-2.5 bg-mal-blue hover:bg-mal-blue-dark text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
            >
                <RefreshCw size={16} />
                Try Again
            </button>
        </div>
    );
}
