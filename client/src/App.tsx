import { useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Plus, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Suspense, lazy } from 'react';
import { Login } from './components/Login';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';

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

function AuthenticatedApp() {
  const [currentView, setCurrentView] = useState<'home' | 'settings'>('home');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [sidebarCounts, setSidebarCounts] = useState<Record<string, number>>({
    ALL: 0, READING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_READ: 0,
    MANHUA: 0, DONGHUA: 0,
  });
  const [sidebarTotal, setSidebarTotal] = useState(0);
  const scanTriggerRef = useRef<() => void>(() => {});

  const registerScanFn = (fn: () => void) => {
    scanTriggerRef.current = fn;
  };

  const handleScanClick = () => {
    setIsScanning(true);
    scanTriggerRef.current();
  };

  const handleCountsChange = (counts: Record<string, number>, total: number, allMedia: any[]) => {
    setSidebarCounts(counts as any);
    setSidebarTotal(total);
    setMediaList(allMedia);
  };

  return (
    <FilterProvider>
      <Layout
        currentView={currentView}
        onNavigate={setCurrentView}
        isScanning={isScanning}
        onScan={handleScanClick}
        sidebarCounts={sidebarCounts as any}
        sidebarTotal={sidebarTotal}
        mediaList={mediaList}
        headerAction={
          currentView === 'home' ? (
            <button
              onClick={() => setIsDialogOpen(true)}
              aria-label="Add new entry"
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Add new entry"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          ) : null
        }
      >
        <Suspense fallback={
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-mal-blue" />
          </div>
        }>
          {currentView === 'home' && (
            <Dashboard
              isDialogOpen={isDialogOpen}
              onCloseDialog={() => setIsDialogOpen(false)}
              onCountsChange={handleCountsChange}
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
      <div className="min-h-screen bg-mal-page flex items-center justify-center">
        <Loader2 size={32} className="text-mal-blue animate-spin" />
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
