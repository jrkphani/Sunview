// Performance monitoring and web vitals tracking
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import { config } from './config';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = config.performance.monitoringEnabled;

  constructor() {
    if (this.enabled && typeof window !== 'undefined') {
      this.initWebVitals();
      this.initCustomMetrics();
    }
  }

  private initWebVitals() {
    // Cumulative Layout Shift
    onCLS((metric: any) => {
      this.recordMetric('CLS', metric.value, this.getClsRating(metric.value));
    });

    // Note: FID is deprecated in favor of INP, skipping for now

    // First Contentful Paint
    onFCP((metric: any) => {
      this.recordMetric('FCP', metric.value, this.getFcpRating(metric.value));
    });

    // Largest Contentful Paint
    onLCP((metric: any) => {
      this.recordMetric('LCP', metric.value, this.getLcpRating(metric.value));
    });

    // Time to First Byte
    onTTFB((metric: any) => {
      this.recordMetric('TTFB', metric.value, this.getTtfbRating(metric.value));
    });
  }

  private initCustomMetrics() {
    // Monitor React render times
    this.measureReactRenderTime();
    
    // Monitor API response times
    this.monitorApiPerformance();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  private measureReactRenderTime() {
    if (typeof window !== 'undefined' && window.performance) {
      // Monitor component mount times
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('React')) {
            this.recordMetric('React Render', entry.duration, this.getRenderRating(entry.duration));
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  private monitorApiPerformance() {
    // Intercept fetch calls to monitor API performance
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric('API Response', duration, this.getApiRating(duration));
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.recordMetric('API Error', duration, 'poor');
        throw error;
      }
    };
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        this.recordMetric('Memory Usage', memoryUsage, this.getMemoryRating(memoryUsage));
      }, 10000); // Check every 10 seconds
    }
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log to console in development
    if (config.environment === 'development') {
      console.log(`📊 Performance: ${name} = ${value.toFixed(2)}ms (${rating})`);
    }

    // Send to analytics in production (if enabled)
    if (config.analytics.enabled && config.environment === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send performance data to analytics service
    // This would integrate with your analytics provider
    if (config.analytics.debug) {
      console.log('📊 Analytics:', metric);
    }
  }

  // Rating functions based on web vitals thresholds
  private getClsRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getFidRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getFcpRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getLcpRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getTtfbRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  private getRenderRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 16) return 'good'; // 60fps
    if (value <= 33) return 'needs-improvement'; // 30fps
    return 'poor';
  }

  private getApiRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1000) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getMemoryRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 50) return 'good';
    if (value <= 80) return 'needs-improvement';
    return 'poor';
  }

  // Public methods
  public getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  public getMetricsSummary() {
    const summary = {
      total: this.metrics.length,
      good: this.metrics.filter(m => m.rating === 'good').length,
      needsImprovement: this.metrics.filter(m => m.rating === 'needs-improvement').length,
      poor: this.metrics.filter(m => m.rating === 'poor').length,
    };

    return {
      ...summary,
      score: summary.total > 0 ? (summary.good / summary.total) * 100 : 0,
    };
  }

  public clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function to mark performance measures
export const markPerformance = (name: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(`${name}-start`);
    
    return () => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    };
  }
  
  return () => {}; // No-op for SSR
};