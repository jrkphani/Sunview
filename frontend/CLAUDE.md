# Frontend Engineering Context - GXO Signify Dashboard

## 🎨 REACT/TYPESCRIPT DEVELOPMENT

### Framework & Build Configuration
- **Framework**: React 18.2 with TypeScript 5.0+
- **Build Tool**: Vite 4.x for lightning-fast HMR
- **Styling**: Tailwind CSS 3.x + shadcn/ui components
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack Query (React Query) for server state
- **Charts**: Recharts for data visualization

### Component Architecture
```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   └── badge.tsx
│   ├── charts/               # Reusable chart components
│   │   ├── ForecastChart.tsx
│   │   ├── TruckUtilizationChart.tsx
│   │   └── AnomalyTimeline.tsx
│   ├── insights/             # Insight display components
│   │   ├── InsightCard.tsx
│   │   ├── InsightFilters.tsx
│   │   └── InsightDrilldown.tsx
│   └── layout/              # Layout components
│       ├── Dashboard.tsx
│       ├── Header.tsx
│       └── Sidebar.tsx
├── pages/                   # Route pages
│   ├── DashboardPage.tsx   # Executive summary
│   ├── ForecastsPage.tsx   # Forecast management
│   ├── InsightsPage.tsx    # Insights exploration
│   └── AnalyticsPage.tsx   # Deep-dive analysis
├── stores/                  # Zustand stores
│   ├── forecastStore.ts
│   ├── insightStore.ts
│   └── userStore.ts
├── hooks/                   # Custom React hooks
│   ├── useForecasts.ts
│   ├── useInsights.ts
│   └── useWebSocket.ts
├── services/               # API integration
│   ├── api.ts
│   ├── forecastService.ts
│   └── insightService.ts
├── styles/                 # Global styles and tokens
│   ├── tokens/            # Design tokens
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   └── globals.css
└── lib/
    └── utils.ts           # Utility functions
```

## 🎯 KEY UI COMPONENTS

### 1. KPI Dashboard Card
```typescript
interface KPICardProps {
  title: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
  comparison?: {
    value: number;
    period: string;
  };
  severity?: 'success' | 'warning' | 'error';
  onClick?: () => void;
}
```

### 2. Forecast Visualization
```typescript
interface ForecastChartProps {
  data: ForecastData[];
  timeHorizon: '1d' | '7d' | '14d' | '28d';
  showConfidenceInterval: boolean;
  showAnomalies: boolean;
  interactive: boolean;
}
```

### 3. Insight Explainability Panel
```typescript
interface ExplainabilityProps {
  insightId: string;
  dataLineage: DataLineage;
  methodology: string;
  confidenceScore: number;
  onDrillDown: (level: string) => void;
}
```

## 🚀 DEVELOPMENT COMMANDS

```bash
# Start development server with hot reload
npm run dev

# Run component tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Build for production
npm run build

# Analyze bundle size
npm run analyze

# Storybook for component development
npm run storybook
```

## 🎨 DESIGN SYSTEM & TOKENS

### Design Token Structure
```typescript
// src/styles/tokens/colors.ts
export const colors = {
  // Brand Colors
  brand: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',  // GXO Blue
      900: '#1E3A8A'
    },
    secondary: {
      500: '#F59E0B',  // Warning/Alert
      600: '#D97706'
    }
  },
  
  // Semantic Colors
  semantic: {
    success: {
      light: '#D1FAE5',
      DEFAULT: '#10B981',
      dark: '#065F46'
    },
    warning: {
      light: '#FEF3C7',
      DEFAULT: '#F59E0B',
      dark: '#92400E'
    },
    error: {
      light: '#FEE2E2',
      DEFAULT: '#EF4444',
      dark: '#991B1B'
    },
    info: {
      light: '#DBEAFE',
      DEFAULT: '#3B82F6',
      dark: '#1E3A8A'
    }
  },
  
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

// src/styles/tokens/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
};

// src/styles/tokens/spacing.ts
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
};

// src/styles/tokens/index.ts
export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { shadows } from './shadows';
export { radius } from './radius';
export { breakpoints } from './breakpoints';
```

### Token Usage in Components
```typescript
// Example: Using design tokens in a component
import { colors, spacing, typography } from '@/styles/tokens';

const StyledCard = styled.div`
  background: ${colors.neutral[50]};
  border: 1px solid ${colors.neutral[200]};
  padding: ${spacing[4]};
  border-radius: ${radius.lg};
  font-family: ${typography.fontFamily.sans};
  
  &:hover {
    box-shadow: ${shadows.md};
    border-color: ${colors.brand.primary[500]};
  }
`;

// Or with Tailwind CSS custom properties
const Card = () => (
  <div className="bg-neutral-50 border-neutral-200 p-4 rounded-lg hover:shadow-md hover:border-primary-500">
    {/* Content */}
  </div>
);
```

### Tailwind Configuration with Design Tokens
```javascript
// tailwind.config.js
import { colors, spacing, typography } from './src/styles/tokens';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        semantic: colors.semantic,
        neutral: colors.neutral
      },
      spacing: spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize
    }
  },
  plugins: []
};
```

### CSS Variables for Dynamic Theming
```css
/* src/styles/globals.css */
:root {
  /* Brand Colors */
  --color-brand-primary: 30 64 175; /* RGB values for opacity support */
  --color-brand-secondary: 245 158 11;
  
  /* Semantic Colors */
  --color-success: 16 185 129;
  --color-warning: 245 158 11;
  --color-error: 239 68 68;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Dark mode support */
[data-theme="dark"] {
  --color-brand-primary: 96 165 250;
  /* ... other dark mode tokens */
}
```

### Component Token Usage Example
```typescript
// KPI Card with design tokens
import { cn } from '@/lib/utils';
import { colors, spacing, typography } from '@/styles/tokens';

export function KPICard({ 
  title, 
  value, 
  trend, 
  severity = 'default' 
}: KPICardProps) {
  const severityColors = {
    success: colors.semantic.success.DEFAULT,
    warning: colors.semantic.warning.DEFAULT,
    error: colors.semantic.error.DEFAULT,
    default: colors.neutral[700]
  };

  return (
    <div className={cn(
      "p-6 rounded-lg border transition-all",
      "hover:shadow-md hover:border-brand-primary-500",
      "bg-white dark:bg-neutral-800"
    )}>
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {title}
      </h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span 
          className="text-3xl font-semibold"
          style={{ color: severityColors[severity] }}
        >
          {value}
        </span>
        {trend && <TrendIndicator trend={trend} />}
      </div>
    </div>
  );
}
```

### Responsive Breakpoints
```typescript
// src/styles/tokens/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Wide screen
};

// Usage in components
const ResponsiveGrid = styled.div`
  display: grid;
  gap: ${spacing[4]};
  grid-template-columns: 1fr;
  
  @media (min-width: ${breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
```

## 📊 STATE MANAGEMENT

### Zustand Store Structure
```typescript
// Forecast Store
interface ForecastStore {
  forecasts: Forecast[];
  selectedTimeHorizon: TimeHorizon;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchForecasts: (params: ForecastParams) => Promise<void>;
  updateTimeHorizon: (horizon: TimeHorizon) => void;
  clearError: () => void;
}

// Insight Store
interface InsightStore {
  insights: Insight[];
  filters: InsightFilters;
  selectedInsight: Insight | null;
  
  // Actions
  fetchInsights: () => Promise<void>;
  applyFilters: (filters: InsightFilters) => void;
  selectInsight: (id: string) => void;
  drillDown: (insightId: string) => Promise<InsightDetail>;
}
```

## 🔌 API INTEGRATION

### Service Configuration
```typescript
// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
const endpoints = {
  forecasts: '/api/v1/forecasts',
  insights: '/api/v1/insights',
  kpis: '/api/v1/kpis',
  anomalies: '/api/v1/anomalies',
  export: '/api/v1/export'
};

// Request Interceptors
- Authentication headers
- Error handling
- Loading states
- Retry logic
```

## ⚡ PERFORMANCE OPTIMIZATION

### Code Splitting
```typescript
// Lazy load heavy components
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ForecastChart = lazy(() => import('./components/charts/ForecastChart'));
```

### Memoization Strategy
- `React.memo` for expensive render components
- `useMemo` for complex calculations
- `useCallback` for stable function references

### Bundle Optimization
- Tree shaking enabled
- Dynamic imports for large libraries
- SVG icons optimization
- Image lazy loading

## 🧪 TESTING STRATEGY

### Unit Tests (Vitest)
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Component Tests
- Test business logic in isolation
- Mock API responses
- Test error states
- Accessibility testing with jest-axe

### E2E Tests (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# Run in headed mode
npm run test:e2e:headed
```

## 🔒 SECURITY CONSIDERATIONS

### Frontend Security
- **XSS Prevention**: Content Security Policy headers
- **HTTPS Only**: Enforced in production
- **Input Validation**: Client-side validation + server verification
- **Secure Storage**: No sensitive data in localStorage
- **API Keys**: Environment variables only, never in code

### Authentication Flow
- No authentication required for pilot phase
- Future: OAuth 2.0 / SAML integration ready
- Role-based access control preparation

## 🎯 CURRENT FOCUS AREAS

1. **KPI Dashboard Components**: Building reusable metric cards with design tokens
2. **Forecast Visualization**: Interactive time-series charts with consistent theming
3. **Insight Drill-down**: Explainability UI implementation with proper token usage
4. **Mobile Responsiveness**: Tablet and mobile optimization using breakpoint tokens
5. **Performance**: Bundle size optimization under 250KB

## 🐛 COMMON ISSUES & SOLUTIONS

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Vite cache issues
rm -rf node_modules/.vite
```

### TypeScript Errors
```bash
# Regenerate types
npm run generate-types

# Check for type errors
npm run type-check
```

### Performance Issues
- Check React DevTools Profiler
- Analyze bundle with `npm run analyze`
- Review re-renders with why-did-you-render

## 📚 FRONTEND RESOURCES

- **Component Library**: https://ui.shadcn.com/
- **Tailwind Docs**: https://tailwindcss.com/
- **React Patterns**: https://react-patterns.com/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Design Tokens**: https://www.designtokens.org/

---
*Frontend Context - Last Updated: June 26, 2025*
*Optimized for: React 18, TypeScript 5, Vite 4, Design Tokens*