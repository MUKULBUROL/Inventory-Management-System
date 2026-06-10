import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md bg-white p-8 rounded-xl shadow-lg border border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <pre className="text-sm text-gray-500 overflow-auto bg-gray-100 p-4 rounded mb-4">
          {error.message}
        </pre>
        <button onClick={resetErrorBoundary} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Try again
        </button>
      </div>
    </div>
  );
}

import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
)
