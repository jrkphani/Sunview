# GXO Signify Forecasting Solution - Design System Compliance Checklist

**Document Version:** 1.0  
**Date:** June 26, 2025  
**Prepared By:** 1CloudHub Development Team  
**Project:** GXO Signify Forecasting Enablement - Technical Architecture  
**Status:** Current Compliance Standards

---

## Overview

This checklist ensures all components and pages in the GXO Signify Forecasting Solution adhere to our tokenized design system standards using shadcn/ui components. Use this document for code reviews, new feature development, and design system audits throughout the pilot development process.

---

## ✅ Design Token Compliance

### Color Tokens
- [ ] Uses CSS custom properties for all colors (`var(--primary)`, `var(--secondary)`)
- [ ] No hardcoded hex colors anywhere in codebase
- [ ] No dynamic Tailwind color classes (e.g., `bg-${color}-500`)
- [ ] Uses semantic color tokens for state management

#### Primary Brand Colors
```css
/* ✅ Correct Token Usage */
--primary: 210 40% 98%;           /* Light blue for GXO branding */
--primary-foreground: 222.2 84% 4.9%;
--secondary: 210 40% 96%;
--secondary-foreground: 222.2 84% 4.9%;
```

#### Forecast-Specific Color Tokens
- [ ] Uses `--forecast-high` for high-confidence predictions
- [ ] Uses `--forecast-medium` for medium-confidence predictions  
- [ ] Uses `--forecast-low` for low-confidence predictions
- [ ] Uses `--insight-operational` for operational category insights
- [ ] Uses `--insight-strategic` for strategic category insights
- [ ] Uses `--insight-commercial` for commercial category insights
- [ ] Uses `--insight-risk` for risk category insights

#### Status & State Colors
- [ ] Uses `--success` for positive outcomes and completed forecasts
- [ ] Uses `--warning` for attention-required items and medium risks
- [ ] Uses `--destructive` for errors and high-risk alerts
- [ ] Uses `--muted` for secondary information and disabled states

### Typography Tokens
- [ ] Uses `--font-sans` (Inter) for UI elements and dashboard text
- [ ] Uses `--font-mono` (JetBrains Mono) for data display and metrics
- [ ] No custom font imports outside design token system
- [ ] Uses semantic font size tokens (`--text-xs`, `--text-sm`, `--text-base`)

### Spacing Tokens
- [ ] Uses 8px grid system through spacing tokens
- [ ] Uses `--spacing-1` through `--spacing-24` consistently
- [ ] No arbitrary spacing values (e.g., `p-[12px]`)
- [ ] Uses consistent gap tokens for layouts

### Border Radius Tokens
- [ ] Uses `--radius` token for consistent border radius
- [ ] Uses `--radius-sm`, `--radius-md`, `--radius-lg` variants
- [ ] No arbitrary border radius values

### ❌ Common Token Violations to Avoid
```typescript
// ❌ Don't use hardcoded colors
className="bg-blue-500 text-white"

// ❌ Don't use dynamic classes
className={`bg-${priority}-500`}

// ❌ Don't use arbitrary values
className="p-[12px] rounded-[6px]"

// ✅ Use design tokens
className="bg-primary text-primary-foreground p-3 rounded-md"
```

---

## ✅ shadcn/ui Component Compliance

### Required shadcn/ui Components Usage

#### Core Components
- [ ] Uses `Button` component with proper variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`)
- [ ] Uses `Input` component for all text inputs
- [ ] Uses `Select` component for dropdowns
- [ ] Uses `Textarea` component for multi-line inputs
- [ ] Uses `Label` component for form labels
- [ ] Uses `Card`, `CardHeader`, `CardContent`, `CardFooter` for content containers

#### Data Display Components  
- [ ] Uses `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` for forecast data
- [ ] Uses `Badge` component for status indicators and categories
- [ ] Uses `Progress` component for forecast confidence levels
- [ ] Uses `Separator` component for content dividers
- [ ] Uses `Skeleton` component for loading states

#### Chart Components (Recharts)
- [ ] Uses Recharts components exclusively for all data visualizations
- [ ] Uses `ResponsiveContainer` for all chart implementations
- [ ] Uses `LineChart` and `ComposedChart` for time series forecasting
- [ ] Uses `BarChart` for categorical comparisons and SKU performance
- [ ] Uses `AreaChart` for confidence intervals and trend visualization
- [ ] Uses `PieChart` for category distribution insights
- [ ] Uses `ScatterChart` for accuracy analysis and correlation plots

#### Navigation Components
- [ ] Uses `Breadcrumb` component for navigation hierarchy
- [ ] Uses `NavigationMenu` for main navigation
- [ ] Uses `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` for tabbed interfaces
- [ ] Uses `Command` component for search and quick actions

#### Overlay Components
- [ ] Uses `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` for modals
- [ ] Uses `Sheet`, `SheetContent`, `SheetHeader` for side panels
- [ ] Uses `Tooltip`, `TooltipContent`, `TooltipTrigger` for explanatory text
- [ ] Uses `Popover`, `PopoverContent`, `PopoverTrigger` for contextual menus

#### Form Components
- [ ] Uses `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` for all forms
- [ ] Uses `Checkbox` component for boolean selections
- [ ] Uses `RadioGroup`, `RadioGroupItem` for single selections
- [ ] Uses `Switch` component for toggle states

### Component Import Compliance
```typescript
// ✅ Correct shadcn/ui imports
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// ✅ Correct Recharts imports
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'

// ❌ Don't create custom alternatives
import { CustomButton } from "./custom-button"
import { CustomChart } from "./custom-chart"
```

### Component Variant Usage
- [ ] Uses appropriate button variants for context:
  - `default` for primary actions
  - `outline` for secondary actions  
  - `destructive` for delete/remove actions
  - `ghost` for subtle actions
- [ ] Uses appropriate badge variants for insight categories
- [ ] Uses proper card variants for different content types

### ❌ Common shadcn/ui Violations to Avoid
```typescript
// ❌ Don't create custom buttons
<button className="px-4 py-2 bg-primary text-white rounded">
  Generate Forecast
</button>

// ❌ Don't modify shadcn component styles directly
<Button className="bg-red-500 hover:bg-red-600">
  Delete Forecast
</Button>

// ❌ Don't recreate existing shadcn components
const CustomCard = ({ children }) => (
  <div className="border rounded-lg p-4">
    {children}
  </div>
)

// ❌ Don't create custom charts
const CustomLineChart = ({ data }) => (
  <svg>
    {/* Custom SVG implementation */}
  </svg>
)

// ❌ Don't use other chart libraries
import Chart from 'chart.js'
import { Bar } from 'react-chartjs-2'

// ❌ Don't hardcode chart colors
<Line stroke="#3B82F6" />

// ✅ Use Recharts with design tokens
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={forecastData}>
    <Line 
      type="monotone" 
      dataKey="forecast" 
      stroke="hsl(var(--primary))" 
      strokeWidth={2}
    />
    <XAxis className="text-muted-foreground" />
    <YAxis className="text-muted-foreground" />
    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
    <Tooltip 
      contentStyle={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)'
      }}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## ✅ Recharts Integration Compliance

### Required Recharts Implementation Patterns

#### Time Series Forecasting Charts
- [ ] Uses `LineChart` for basic time series visualization
- [ ] Uses `ComposedChart` for overlaying actual vs forecast data
- [ ] Uses `Area` component within `ComposedChart` for confidence intervals
- [ ] Uses `ResponsiveContainer` to ensure proper responsive behavior
- [ ] Uses `XAxis` with proper date formatting for time series
- [ ] Uses `YAxis` with appropriate number formatting

#### Categorical Analysis Charts  
- [ ] Uses `BarChart` for SKU performance comparisons
- [ ] Uses `PieChart` for category distribution visualization
- [ ] Uses `Cell` component for custom slice colors in pie charts
- [ ] Uses `BarChart` with stacked bars for multi-dimensional analysis

#### Advanced Analytics Charts
- [ ] Uses `ScatterChart` for accuracy analysis and correlation plots
- [ ] Uses `ComposedChart` for combining multiple chart types
- [ ] Uses `AreaChart` for trend visualization and seasonal patterns
- [ ] Uses `LineChart` with multiple `Line` components for trend comparisons

### Recharts Design Token Integration

#### Chart Styling with Design Tokens
```typescript
// ✅ Comprehensive chart theme using design tokens
const chartConfig = {
  colors: {
    // Core forecast colors
    actual: 'hsl(var(--success))',
    forecast: 'hsl(var(--primary))',
    confidence: 'hsl(var(--primary))',
    
    // Insight category colors
    operational: 'hsl(var(--insight-operational))',
    strategic: 'hsl(var(--insight-strategic))',
    commercial: 'hsl(var(--insight-commercial))',
    risk: 'hsl(var(--insight-risk))',
    
    // UI colors
    grid: 'hsl(var(--border))',
    text: 'hsl(var(--muted-foreground))',
    background: 'hsl(var(--card))',
    tooltipBg: 'hsl(var(--popover))',
    tooltipBorder: 'hsl(var(--border))'
  },
  
  // Typography integration
  fontSize: {
    axis: '12px',
    legend: '14px', 
    tooltip: '13px'
  },
  
  // Spacing using design tokens
  margins: {
    top: 'var(--spacing-4)',
    right: 'var(--spacing-6)', 
    bottom: 'var(--spacing-4)',
    left: 'var(--spacing-6)'
  }
}
```

#### Tooltip Integration with shadcn/ui
- [ ] Uses custom `Tooltip` content styled with shadcn `Card` components
- [ ] Uses design tokens for tooltip background and borders
- [ ] Uses `Button` components within tooltips for drill-down actions
- [ ] Uses `Badge` components within tooltips for status indicators

```typescript
// ✅ Custom Recharts Tooltip with shadcn integration
const CustomTooltip = ({ active, payload, label, onExplain }) => {
  if (active && payload && payload.length) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name}: {entry.value}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onExplain(entry.payload)}
                >
                  Explain
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};
```

### Chart Component Architecture Compliance

#### ForecastLineChart Component
```typescript
interface ForecastLineChartProps {
  data: ForecastDataPoint[];
  timeHorizon: TimeHorizon;
  showConfidence?: boolean;
  showActual?: boolean;
  onDataPointClick?: (data: ForecastDataPoint) => void;
}

// ✅ Proper Recharts component with design token integration
export function ForecastLineChart({ 
  data, 
  showConfidence, 
  showActual, 
  onDataPointClick 
}: ForecastLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Demand Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
            />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            
            {/* Confidence Interval */}
            {showConfidence && (
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                stroke="none"
              />
            )}
            
            {/* Actual Data Line */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
              />
            )}
            
            {/* Forecast Data Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ 
                fill: 'hsl(var(--primary))', 
                strokeWidth: 2,
                cursor: 'pointer' 
              }}
              onClick={onDataPointClick}
            />
            
            <Tooltip content={<CustomTooltip onExplain={onDataPointClick} />} />
            <Legend 
              wrapperStyle={{ 
                color: 'hsl(var(--foreground))',
                fontSize: '14px'
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Performance Optimization for Recharts
- [ ] Uses `ResponsiveContainer` instead of fixed dimensions
- [ ] Implements data memoization for expensive calculations
- [ ] Uses `React.memo` for chart components with stable props
- [ ] Limits data points displayed (pagination/virtualization for large datasets)
- [ ] Uses `Skeleton` loading states while data is being fetched

### Accessibility Compliance for Charts
- [ ] Uses proper ARIA labels for chart containers
- [ ] Uses semantic colors that meet contrast requirements
- [ ] Provides alternative text descriptions for complex charts
- [ ] Uses keyboard navigation for interactive chart elements
- [ ] Uses `title` and `desc` SVG elements for screen readers

---

## ✅ Forecast-Specific Component Compliance

### InsightCard Component
- [ ] Uses `Card` as base component with consistent styling
- [ ] Uses `Badge` for insight category and priority indicators
- [ ] Uses design tokens for category-specific colors
- [ ] Implements proper hover states and interactions
- [ ] Uses `Button` with `ghost` variant for drill-down actions
- [ ] Uses `ResponsiveContainer` from Recharts for responsive behavior
- [ ] Uses design tokens for all chart colors and styling
- [ ] Uses `LineChart` or `ComposedChart` for time series data
- [ ] Uses `Area` component for confidence intervals
- [ ] Uses `Tooltip` with shadcn card styling for data explanations
- [ ] Uses `Legend` component with design token colors
- [ ] Implements proper loading states with `Skeleton` components
- [ ] Uses `Select` for time horizon controls
- [ ] Uses `Button` with appropriate variants for chart actions

#### Chart Color Token Usage
```typescript
// ✅ Proper Recharts color token integration
const chartTheme = {
  actual: 'hsl(var(--success))',           // Actual data line
  forecast: 'hsl(var(--primary))',        // Forecast data line  
  confidence: 'hsl(var(--primary))',      // Confidence interval fill
  grid: 'hsl(var(--border))',             // Chart grid lines
  text: 'hsl(var(--muted-foreground))',   // Axis labels and text
  background: 'hsl(var(--card))',         // Chart background
}

// ✅ Insight category colors for charts
const insightColors = {
  operational: 'hsl(var(--insight-operational))',
  strategic: 'hsl(var(--insight-strategic))', 
  commercial: 'hsl(var(--insight-commercial))',
  risk: 'hsl(var(--insight-risk))'
}
```

### MetricCard Component
- [ ] Uses `Card` with consistent header/content structure
- [ ] Uses `Progress` for confidence indicators
- [ ] Uses `Badge` for trend indicators
- [ ] Uses semantic color tokens for positive/negative values
- [ ] Uses `Button` with `outline` variant for drill-down

### ExplainabilityPanel Component
- [ ] Uses `Sheet` or `Dialog` for overlay presentation
- [ ] Uses `Separator` to divide content sections
- [ ] Uses `Badge` for data source indicators
- [ ] Uses `Button` variants for different actions
- [ ] Uses `Collapsible` for expandable content sections

---

## ✅ Layout & Responsive Compliance

### Grid System
- [ ] Uses CSS Grid with design token spacing
- [ ] Implements responsive breakpoints consistently
- [ ] Uses `gap-4`, `gap-6`, `gap-8` for consistent spacing
- [ ] No arbitrary gap values

### Container Patterns
- [ ] Uses consistent max-width containers with design tokens
- [ ] Uses proper padding tokens for different screen sizes
- [ ] Implements responsive grid layouts using design system patterns

### Dashboard Layout Compliance
- [ ] Uses consistent header height and spacing
- [ ] Uses sidebar navigation with proper shadcn components
- [ ] Uses card-based layout for main content areas
- [ ] Implements proper responsive behavior for mobile/tablet

---

## ✅ Accessibility Compliance

### ARIA Implementation
- [ ] Uses proper ARIA labels for all interactive elements
- [ ] Implements proper heading hierarchy (h1, h2, h3) with design tokens
- [ ] Uses semantic HTML elements with shadcn components
- [ ] Uses `Label` component properly associated with form controls

### Keyboard Navigation
- [ ] All shadcn interactive components are keyboard accessible
- [ ] Proper tab order implementation
- [ ] Focus indicators visible using design token focus styles
- [ ] Uses shadcn focus management patterns

### Color Contrast
- [ ] All color token combinations meet WCAG 2.1 AA requirements
- [ ] Forecast data visualization colors are accessible
- [ ] Interactive elements have sufficient contrast
- [ ] No color-only information conveyance in insights

---

## ✅ TypeScript & Component Type Safety

### shadcn Component Props
- [ ] All shadcn component props properly typed
- [ ] Uses component variant types from shadcn definitions
- [ ] No `any` types used with shadcn components
- [ ] Proper interface definitions for custom component props

### Design Token Types
```typescript
// ✅ Proper token type definitions
interface InsightCardProps {
  insight: Insight;
  priority: 'high' | 'medium' | 'low';
  category: 'operational' | 'strategic' | 'commercial' | 'risk';
  variant?: 'default' | 'compact';
}

interface ForecastChartProps {
  data: ForecastData[];
  timeHorizon: '1d' | '7d' | '14d' | '28d';
  confidence?: 'high' | 'medium' | 'low';
}
```

---

## ✅ Performance Compliance

### Bundle Optimization
- [ ] Uses proper shadcn component imports (no barrel imports)
- [ ] Uses tree-shaking friendly design token imports
- [ ] Uses selective Recharts component imports (no full library import)
- [ ] Implements code splitting for large chart components
- [ ] No unnecessary design token calculations in render loops

### Chart Performance
- [ ] Uses memoization for expensive forecast calculations
- [ ] Uses `ResponsiveContainer` for efficient responsive rendering
- [ ] Implements proper loading states with shadcn `Skeleton`
- [ ] Uses virtualization for large datasets in charts
- [ ] Implements proper error boundaries with shadcn error components
- [ ] Limits concurrent chart animations to prevent performance issues

---

## 🔍 Component Review Checklist

### Pre-Development Checklist
- [ ] Identify required shadcn/ui components for feature
- [ ] Map design requirements to available design tokens
- [ ] Plan component composition using shadcn patterns
- [ ] Define TypeScript interfaces using design system types

### Development Checklist
- [ ] Import only required shadcn components
- [ ] Use design tokens for all styling
- [ ] Implement proper component variants
- [ ] Add proper TypeScript typing
- [ ] Include accessibility attributes
- [ ] Test responsive behavior

### Code Review Checklist
- [ ] No custom components that duplicate shadcn functionality
- [ ] All colors use design tokens
- [ ] Proper shadcn component variant usage
- [ ] Consistent spacing using design token system
- [ ] TypeScript types properly defined
- [ ] Accessibility requirements met

---

## 🚨 Critical Violations

### Immediate Fix Required
1. **Custom Component Duplication**: Creating custom versions of existing shadcn components
2. **Custom Chart Libraries**: Using Chart.js, D3, or other libraries instead of Recharts
3. **Hardcoded Colors**: Any hex colors instead of design tokens in charts or components
4. **Direct Style Modifications**: Modifying shadcn component styles with className overrides
5. **Missing Design Tokens**: Using arbitrary values instead of design system tokens
6. **Accessibility Issues**: Missing ARIA labels or improper shadcn component usage

### High Priority Fixes
1. **Inconsistent Component Usage**: Mixing custom and shadcn components
2. **Token Violations**: Non-standard spacing, colors, or typography
3. **Type Safety Issues**: Missing TypeScript definitions for component props
4. **Responsive Issues**: Non-responsive component implementations
5. **Performance Problems**: Inefficient component rendering or token usage

---

## 📋 Automated Checks

### ESLint Rules for Design System
```json
{
  "rules": {
    "no-hardcoded-colors": "error",
    "prefer-design-tokens": "error",
    "require-shadcn-components": "error",
    "require-recharts-charts": "error",
    "no-arbitrary-values": "error",
    "no-custom-component-duplication": "error",
    "no-alternative-chart-libraries": "error"
  }
}
```

### Pre-commit Hooks
- Design token usage validation
- shadcn/ui component compliance check
- TypeScript compilation with design system types
- Accessibility audit for component usage

---

## 📚 Resources & Tools

### Design System Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Design Tokens Specification](https://design-tokens.github.io/community-group/)
- [Recharts Documentation](https://recharts.org/)
- [GXO Brand Guidelines](./brand-guidelines.md)

### Development Tools
- **VS Code Extensions**:
  - Tailwind CSS IntelliSense
  - TypeScript Hero
  - shadcn/ui Snippets
- **Design Tools**:
  - Figma Design Tokens Plugin
- **Testing Tools**:
  - Storybook for component testing
  - axe-core for accessibility testing

### Component Library Setup
```bash
# Install shadcn/ui components
npx shadcn-ui@latest add button card badge progress table
npx shadcn-ui@latest add dialog sheet tooltip popover
npx shadcn-ui@latest add form input select textarea label
npx shadcn-ui@latest add navigation-menu breadcrumb tabs

# Install Recharts for data visualization
npm install recharts
npm install --save-dev @types/recharts

# Verify installation
npm list recharts shadcn-ui
```

---

## 🎯 GXO Signify-Specific Implementation Guidelines

### Insight Category Color Mapping
```css
:root {
  --insight-operational: 142 76% 36%;    /* Green for operational efficiency */
  --insight-strategic: 221 83% 53%;      /* Blue for strategic insights */
  --insight-commercial: 262 83% 58%;     /* Purple for commercial opportunities */
  --insight-risk: 0 84% 60%;             /* Red for risk management */
}
```

### Forecast Confidence Indicators
- [ ] Uses `Progress` component with consistent color tokens
- [ ] High confidence: `--success` color token
- [ ] Medium confidence: `--warning` color token  
- [ ] Low confidence: `--destructive` color token

### Dashboard Card Consistency
- [ ] All metric cards use identical `Card` structure
- [ ] Consistent `CardHeader` with title and action buttons
- [ ] Standardized `CardContent` padding and spacing
- [ ] Uniform `CardFooter` for additional actions

### AWS-Native Integration Compliance
- [ ] Uses proper error handling for Amazon Forecast API calls
- [ ] Implements loading states for AWS Glue job status
- [ ] Uses `Badge` components for AWS service status indicators
- [ ] Uses `Alert` components for AWS service error messages
- [ ] Implements proper retry logic with shadcn UI feedback

---

## Conclusion

Maintaining design system compliance with tokenization and shadcn/ui components ensures a consistent, scalable, and maintainable user interface for the GXO Signify Forecasting Solution. This systematic approach enables rapid development while maintaining high quality standards.

**Key Principles:**
1. **Token First**: Always use design tokens before considering custom values
2. **shadcn Default**: Use existing shadcn components before creating custom alternatives  
3. **Composition Over Customization**: Compose shadcn components rather than modifying them
4. **Type Safety**: Maintain strict TypeScript typing for all component interfaces
5. **Accessibility By Default**: Leverage shadcn's built-in accessibility features
6. **AWS-Native Integration**: Ensure proper integration patterns with managed AWS services

Regular audits using this checklist will help identify and resolve violations before they impact the user experience or development velocity during the GXO Signify pilot phase. 