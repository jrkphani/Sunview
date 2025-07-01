import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => (
  <Card className="max-w-md mx-auto">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        Something went wrong
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Error Details</AlertTitle>
        <AlertDescription className="text-sm font-mono">
          {error.message || 'An unexpected error occurred'}
        </AlertDescription>
      </Alert>
      <Button onClick={resetError} className="w-full" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </CardContent>
  </Card>
)

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.handleReset}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

// Query Error Fallback Component
interface QueryErrorFallbackProps {
  error: any
  refetch?: () => void
  title?: string
  description?: string
}

export const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({
  error,
  refetch,
  title = "Failed to load data",
  description
}) => {
  const errorMessage = error?.response?.data?.detail || 
                      error?.message || 
                      'An unexpected error occurred while fetching data'

  return (
    <Alert variant="destructive" className="max-w-md mx-auto">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">{description || errorMessage}</p>
        {refetch && (
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Network Error Component
export const NetworkError: React.FC<{
  onRetry?: () => void
  title?: string
}> = ({ 
  onRetry, 
  title = "Network Connection Error" 
}) => (
  <Alert variant="destructive" className="max-w-md mx-auto">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="space-y-3">
      <p className="text-sm">
        Unable to connect to the server. Please check your internet connection.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      )}
    </AlertDescription>
  </Alert>
)

// Generic error fallback for React Query
export const createErrorFallback = (
  title?: string,
  description?: string
) => ({ error, refetch }: { error: any; refetch?: () => void }) => (
  <QueryErrorFallback
    error={error}
    refetch={refetch}
    title={title}
    description={description}
  />
)

export default ErrorBoundary