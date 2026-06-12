import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
      <Helmet>
        <title>Page Not Found - Quantum Inventory System</title>
      </Helmet>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Return Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
