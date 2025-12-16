import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { Settings } from './components/Settings';
import { ToastProvider } from './context/ToastContext';
import { Plus } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'library' | 'settings'>('home');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
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
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
