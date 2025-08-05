# Text Overflow Fixes Required

## Overview
This document lists all the text overflow issues found in the codebase and the fixes needed.

## Issues and Fixes

### 1. Navigation Components

**nav-documents.tsx (line 46)**
```tsx
// Current
<span>{item.name}</span>

// Fix
<span className="truncate">{item.name}</span>
```

**nav-main.tsx (line 38)**
```tsx
// Current
<span>{item.title}</span>

// Fix
<span className="truncate">{item.title}</span>
```

### 2. Alert Components

**AlertsSummaryPanel.tsx**
- Lines 255, 267, 440, 457, 470 need truncation classes

### 3. Card Components

**InsightCard.tsx**
- Line 59: Add `truncate` to title
- Line 80: Add `line-clamp-3` to description

**KPICard.tsx**
- Line 52: Add `truncate` to title
- Line 66: Add `line-clamp-2` to description

### 4. ForecastAccuracyKPI.tsx (line 131)

**The "How is this grade" text needs proper wrapping:**
```tsx
// Current
<ExplainerTrigger 
  onClick={() => setGradingExplainerOpen(true)} 
  variant="button"
  size="sm"
  className="text-xs"
>
  How is this graded?
</ExplainerTrigger>

// Fix
<ExplainerTrigger 
  onClick={() => setGradingExplainerOpen(true)} 
  variant="button"
  size="sm"
  className="text-xs whitespace-nowrap"
>
  How is this graded?
</ExplainerTrigger>
```

### 5. Commercial Components

**CommercialRecommendationsPanel.tsx**
- Line 441: Add `line-clamp-2` to title
- Line 452: Already has `break-words`, add `line-clamp-3`

### 6. Risk Components

**SupplierRiskAnalysis.tsx**
- Line 392: Add `truncate max-w-[200px]`
- Line 453: Add `truncate`

**AnomalyTimelineChart.tsx**
- Line 255: Add `line-clamp-2`
- Line 346: Add `line-clamp-3`

### 7. Badge Component

**badge.tsx**
Add max-width constraint to badge variants:
```tsx
className={cn(
  badgeVariants({ variant }),
  "max-w-[200px] truncate",
  className
)}
```

## Utility Classes Needed

- `truncate`: Single line with ellipsis
- `line-clamp-2`: Two lines with ellipsis
- `line-clamp-3`: Three lines with ellipsis
- `max-w-[200px]`: Maximum width constraint
- `whitespace-nowrap`: Prevent text wrapping
- `break-words`: Break long words
- `overflow-hidden`: Hide overflow content