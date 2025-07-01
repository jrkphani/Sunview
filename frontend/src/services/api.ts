import axios, { AxiosError, AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for large data operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth headers and request ID
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID()
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling common errors and logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }
    
    return response
  },
  (error: AxiosError) => {
    // Enhanced error handling
    const status = error.response?.status
    const url = error.config?.url
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${url}`, {
        status,
        data: error.response?.data,
        message: error.message,
      })
    }
    
    // Handle specific error cases
    switch (status) {
      case 401:
        // Handle unauthorized access
        localStorage.removeItem('auth_token')
        // Could redirect to login page here
        break
        
      case 403:
        // Handle forbidden access
        console.warn('Access forbidden to:', url)
        break
        
      case 404:
        // Handle not found
        console.warn('Resource not found:', url)
        break
        
      case 429:
        // Handle rate limiting
        console.warn('Rate limit exceeded for:', url)
        break
        
      case 500:
      case 502:
      case 503:
      case 504:
        // Handle server errors
        console.error('Server error for:', url, status)
        break
        
      default:
        if (error.code === 'NETWORK_ERROR' || !error.response) {
          // Handle network errors
          console.error('Network error:', error.message)
        }
    }
    
    // Enhance error object with additional context
    const enhancedError = {
      ...error,
      isNetworkError: error.code === 'NETWORK_ERROR' || !error.response,
      isServerError: status ? status >= 500 : false,
      isClientError: status ? status >= 400 && status < 500 : false,
      timestamp: new Date().toISOString(),
      url,
    }
    
    return Promise.reject(enhancedError)
  }
)

// Utility functions for API calls with better error handling
export const apiRequest = {
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await api.get(url, { params })
    return response.data
  },
  
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await api.post(url, data)
    return response.data
  },
  
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await api.put(url, data)
    return response.data
  },
  
  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await api.patch(url, data)
    return response.data
  },
  
  async delete<T>(url: string): Promise<T> {
    const response = await api.delete(url)
    return response.data
  },
}

// Health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health')
    return true
  } catch (error) {
    console.error('API health check failed:', error)
    return false
  }
}

export default api