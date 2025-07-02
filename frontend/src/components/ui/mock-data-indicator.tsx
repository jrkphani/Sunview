import * as React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Database, TestTube, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MockDataIndicatorProps {
  isLoading?: boolean
  isMockData?: boolean
  dataSource?: 'api' | 'mock' | 'cache'
  className?: string
  variant?: 'badge' | 'alert' | 'inline'
  showDetails?: boolean
}

export function MockDataIndicator({
  isLoading = false,
  isMockData = false,
  dataSource = 'mock',
  className,
  variant = 'badge',
  showDetails = false
}: MockDataIndicatorProps) {
  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Wifi className="h-3 w-3 animate-pulse" />
        Loading...
      </Badge>
    )
  }

  if (!isMockData && dataSource === 'api') {
    return showDetails ? (
      <Badge variant="outline" className={cn("gap-1 border-success text-success", className)}>
        <Database className="h-3 w-3" />
        Live Data
      </Badge>
    ) : null
  }

  const mockContent = {
    badge: (
      <Badge variant="secondary" className={cn("gap-1 border-warning text-warning", className)}>
        <TestTube className="h-3 w-3" />
        Demo Data
      </Badge>
    ),
    alert: (
      <Alert variant="default" className={cn("border-warning/20 bg-warning/5", className)}>
        <TestTube className="h-4 w-4 text-warning" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>This dashboard is showing demonstration data for preview purposes.</span>
            <Badge variant="outline" className="ml-2 border-warning/30 text-warning">
              <WifiOff className="h-3 w-3 mr-1" />
              Demo Mode
            </Badge>
          </div>
          {showDetails && (
            <div className="mt-2 text-xs text-warning">
              Connect to the backend API to see real S3 forecast data from your Amazon Forecast models.
            </div>
          )}
        </AlertDescription>
      </Alert>
    ),
    inline: (
      <span className={cn("inline-flex items-center gap-1 text-xs text-warning", className)}>
        <TestTube className="h-3 w-3" />
        Demo
      </span>
    )
  }

  return mockContent[variant]
}

// Hook to determine data source status
export function useDataSourceStatus() {
  const [isApiConnected, setIsApiConnected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  
  React.useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/health`)
        if (response.ok) {
          setIsApiConnected(true)
        } else {
          setIsApiConnected(false)
        }
      } catch (error) {
        setIsApiConnected(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkApiHealth()
    
    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000)
    return () => clearInterval(interval)
  }, [])
  
  return {
    isApiConnected,
    isLoading,
    isMockData: !isApiConnected,
    dataSource: isApiConnected ? 'api' as const : 'mock' as const
  }
}