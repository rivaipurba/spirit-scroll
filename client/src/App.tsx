import { useState, useRef, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Plus, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Suspense, lazy } from 'react';
import { Login } from './components/Login';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { MediaStats } from './types/index';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const EMPTY_STATS: MediaStats = {
  total: 0,
  counts: { READING: 0, WATCHING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_READ: 0, MANHUA: 0, DONGHUA: 0 },
  chaptersRead: 0,
  withUpdates: 0,
  latestUpdates: [],
};

function AuthenticatedApp() {
  const [currentView, setCurrentView] = useState<'home' | 'settings'>('home');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<MediaStats>(EMPTY_STATS);
  const scanTriggerRef = useRef<() => void>(() => {});

  const registerScanFn = useCallback((fn: () => void) => {
    scanTriggerRef.current = fn;
  }, []);

  const handleScanClick = useCallback(() => {
    setIsScanning(true);
    scanTriggerRef.current();
  }, []);

  const openNewEntry = useCallback(() => setIsDialogOpen(true), []);

  useKeyboardShortcuts({
    enabled: currentView === 'home',
    onNew: openNewEntry,
    onScan: handleScanClick,
    isScanning,
  });

  return (
    <FilterProvider>
      <Layout
        currentView={currentView}
        onNavigate={setCurrentView}
        isScanning={isScanning}
        onScan={handleScanClick}
        stats={stats}
        headerAction={
          currentView === 'home' ? (
            <button
              type="button"
              onClick={openNewEntry}
              aria-label="Add new entry"
              aria-keyshortcuts="n"
              className="btn btn-ghost btn-icon sm:px-4"
              title="Add new entry (N)"
            >
              <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
              <span className="hidden sm:inline">New</span>
            </button>
          ) : null
        }
      >
        <Suspense fallback={
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin keep-motion text-muted" aria-label="Loading" />
          </div>
        }>
          {currentView === 'home' && (
            <Dashboard
              isDialogOpen={isDialogOpen}
              onCloseDialog={() => setIsDialogOpen(false)}
              onStatsChange={setStats}
              registerScanFn={registerScanFn}
              onScanningChange={setIsScanning}
            />
          )}
          {currentView === 'settings' && <Settings />}
        </Suspense>
      </Layout>
    </FilterProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-paper flex items-center justify-center">
        <Loader2 size={24} className="text-muted animate-spin keep-motion" aria-label="Loading" />
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
