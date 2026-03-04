import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Plus, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Suspense, lazy } from 'react';
import { Login } from './components/Login';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));

// Configure global cache settings (5 minutes stale time)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false, // Don't refetch when switching tabs unless data is stale
    },
  },
});

function AuthenticatedApp() {
  const [currentView, setCurrentView] = useState<'home' | 'settings'>('home');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      headerAction={
        currentView === 'home' ? (
          <button
            onClick={() => setIsDialogOpen(true)}
            aria-label="Add new entry"
            className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ring-1 ring-white/5"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        ) : null
      }
    >
      <Suspense fallback={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }>
        {currentView === 'home' && <Dashboard isDialogOpen={isDialogOpen} onCloseDialog={() => setIsDialogOpen(false)} />}
        {currentView === 'settings' && <Settings />}
      </Suspense>
    </Layout>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
