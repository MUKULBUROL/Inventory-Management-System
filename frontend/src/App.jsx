import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Warehouses from './pages/Warehouses';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import { Menu, Boxes } from 'lucide-react';
import CommandPalette from './components/CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCmdkOpen, setIsCmdkOpen] = useState(false);
  const { user, isLoading } = React.useContext(AuthContext);

  const addToast = (message, type = 'info') => {
    switch(type) {
      case 'success': toast.success(message); break;
      case 'error': toast.error(message); break;
      case 'warning': toast.warn(message); break;
      default: toast.info(message); break;
    }
  };

  const handlePageSelect = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  // Keyboard Navigation (G D, G P, G W, etc.)
  useEffect(() => {
    let lastKey = '';
    let timeout;
    
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      const key = e.key.toLowerCase();
      if (lastKey === 'g') {
        if (key === 'd') handlePageSelect('dashboard');
        if (key === 'p') handlePageSelect('products');
        if (key === 'o') handlePageSelect('orders');
        if (key === 'c') handlePageSelect('customers');
        lastKey = '';
      } else {
        lastKey = key;
        clearTimeout(timeout);
        timeout = setTimeout(() => { lastKey = ''; }, 1000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); clearTimeout(timeout); };
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!user) {
    if (currentPage === 'signup') {
      return <Signup setCurrentPage={setCurrentPage} addToast={addToast} />;
    }
    return <Login setCurrentPage={setCurrentPage} addToast={addToast} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard addToast={addToast} key="dashboard" />;
      case 'products':
        return <Products addToast={addToast} key="products" />;
      case 'warehouses':
        return <Warehouses addToast={addToast} key="warehouses" />;
      case 'customers':
        return <Customers addToast={addToast} key="customers" />;
      case 'orders':
        return <Orders addToast={addToast} key="orders" />;
      default:
        return <Dashboard addToast={addToast} key="dashboard" />;
    }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <CommandPalette isOpen={isCmdkOpen} setIsOpen={setIsCmdkOpen} navigate={handlePageSelect} />
      
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-border z-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Boxes className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">Quantum</span>
        </div>
        <button 
          className="p-2 text-muted-foreground hover:bg-gray-100 rounded-md focus:outline-none" 
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Navigation Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={handlePageSelect} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* Main Page Area */}
      <main className="flex-1 overflow-y-auto mt-16 md:mt-0 md:ml-64 bg-background relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar theme="light" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
