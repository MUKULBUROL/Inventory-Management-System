import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import { Menu, Boxes } from 'lucide-react';

import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading } = React.useContext(AuthContext);

  const addToast = (message, type = 'info') => {
    switch(type) {
      case 'success': toast.success(message); break;
      case 'error': toast.error(message); break;
      case 'warning': toast.warn(message); break;
      default: toast.info(message); break;
    }
  };

  const removeToast = (id) => {
    // handled by react-toastify automatically
  };

  const handlePageSelect = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
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
        return <Dashboard addToast={addToast} />;
      case 'products':
        return <Products addToast={addToast} />;
      case 'customers':
        return <Customers addToast={addToast} />;
      case 'orders':
        return <Orders addToast={addToast} />;
      default:
        return <Dashboard addToast={addToast} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Boxes className="w-6 h-6 text-indigo-600" />
          <span className="text-lg font-bold text-gray-900">Quantum Systems</span>
        </div>
        <button 
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Toggle Navigation Menu"
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
      <main className="flex-1 overflow-y-auto mt-16 md:mt-0 md:ml-64 bg-gray-50 transition-all duration-300">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer position="bottom-right" autoClose={4000} />
    </AuthProvider>
  );
}

export default App;
