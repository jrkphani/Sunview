import * as React from 'react'

interface DataSourceContextType {
  isApiConnected: boolean
  isLoading: boolean
  isMockData: boolean
  dataSource: 'api' | 'mock'
  lastChecked: Date | null
}

const DataSourceContext = React.createContext<DataSourceContextType | undefined>(undefined)

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [isApiConnected, setIsApiConnected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null)

  React.useEffect(() => {
    const checkApiHealth = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/health`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsApiConnected(data.status === 'healthy')
        } else {
          setIsApiConnected(false)
        }
      } catch (error) {
        console.warn('API health check failed:', error)
        setIsApiConnected(false)
      } finally {
        setIsLoading(false)
        setLastChecked(new Date())
      }
    }

    // Initial check
    checkApiHealth()

    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const value: DataSourceContextType = {
    isApiConnected,
    isLoading,
    isMockData: !isApiConnected,
    dataSource: isApiConnected ? 'api' : 'mock',
    lastChecked
  }

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  )
}

export function useDataSource() {
  const context = React.useContext(DataSourceContext)
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider')
  }
  return context
}