import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Library } from './components/Library';
import { Settings } from './components/Settings';

const queryClient = new QueryClient();

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'library' | 'settings'>('home');

  return (
    <QueryClientProvider client={queryClient}>
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {currentView === 'home' && <Dashboard />}
        {currentView === 'library' && <Library />}
        {currentView === 'settings' && <Settings />}
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
