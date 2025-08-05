import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import { queryClient } from './lib/react-query'
import { ErrorBoundary } from './components/ui/error-boundary'
import './index.css'

// Start MSW worker in development
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    
    // Start the worker
    return worker.start({
      onUnhandledRequest: 'bypass', // Let non-mocked requests pass through
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    }).then(() => {
      console.log('[MSW] Mock Service Worker is running')
    }).catch((error) => {
      console.warn('[MSW] Failed to start Mock Service Worker:', error)
      // Continue without MSW if it fails
    })
  }
}

// Initialize app with MSW
enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error reporting service in production
        console.error('Global error boundary:', error, errorInfo)
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {/* React Query Devtools - only in development */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
  )
})