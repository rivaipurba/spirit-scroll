import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Plus, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const [currentView, setCurrentView] = useState<'home' | 'library' | 'settings'>('home');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      headerAction={
        currentView === 'home' ? (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="p-2.5 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ring-1 ring-white/5"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        ) : null
      }
    >
      {currentView === 'home' && <Dashboard isDialogOpen={isDialogOpen} onCloseDialog={() => setIsDialogOpen(false)} />}
      {currentView === 'library' && <Library />}
      {currentView === 'settings' && <Settings />}
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
