// Environment-based configuration management
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  environment: 'development' | 'staging' | 'production';
  features: {
    demoMode: boolean;
    autoPlay: boolean;
    exportEnabled: boolean;
    drillDown: boolean;
  };
  data: {
    source: 'local' | 'api' | 'mock';
    refreshInterval: number;
  };
  performance: {
    monitoringEnabled: boolean;
    bundleAnalyzer: boolean;
  };
  analytics: {
    enabled: boolean;
    debug: boolean;
  };
}

// Environment variable getters with type safety
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] ?? defaultValue;
};

const getEnvBool = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

// Configuration object
export const config: AppConfig = {
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
  },
  environment: getEnvVar('VITE_ENVIRONMENT', 'development') as AppConfig['environment'],
  features: {
    demoMode: getEnvBool('VITE_FEATURE_DEMO_MODE', true),
    autoPlay: getEnvBool('VITE_FEATURE_AUTO_PLAY', false),
    exportEnabled: getEnvBool('VITE_FEATURE_EXPORT_ENABLED', true),
    drillDown: getEnvBool('VITE_FEATURE_DRILL_DOWN', true),
  },
  data: {
    source: getEnvVar('VITE_DATA_SOURCE', 'local') as AppConfig['data']['source'],
    refreshInterval: getEnvNumber('VITE_DATA_REFRESH_INTERVAL', 300000), // 5 minutes
  },
  performance: {
    monitoringEnabled: getEnvBool('VITE_ENABLE_PERFORMANCE_MONITORING', true),
    bundleAnalyzer: getEnvBool('VITE_BUNDLE_ANALYZER', false),
  },
  analytics: {
    enabled: getEnvBool('VITE_ANALYTICS_ENABLED', false),
    debug: getEnvBool('VITE_ANALYTICS_DEBUG', false),
  },
};

// Feature flag utilities
export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
  return config.features[feature];
};

// Environment utilities
export const isDevelopment = (): boolean => config.environment === 'development';
export const isProduction = (): boolean => config.environment === 'production';
export const isStaging = (): boolean => config.environment === 'staging';

// API utilities
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};