# Design Token Management Command

Manage and validate design tokens for the GXO Signify frontend application.

## Design Token Operations:

### 1. Validate Token Consistency
```bash
# Check for inconsistent token usage
cd frontend

# Find all color references not using tokens
grep -r "color:" src/ | grep -v "colors\." | grep -v "var(--"

# Find hardcoded spacing values
grep -r "padding\|margin" src/ | grep -E "[0-9]+px|[0-9]+rem" | grep -v "spacing\."

# Find hardcoded font sizes
grep -r "font-size" src/ | grep -E "[0-9]+px|[0-9]+rem" | grep -v "fontSize\."
```

### 2. Generate Token Documentation
```typescript
// Generate markdown documentation from tokens
import * as tokens from './src/styles/tokens';

function generateTokenDocs() {
  const docs = [];
  
  // Color tokens
  docs.push('## Color Tokens\n');
  Object.entries(tokens.colors).forEach(([category, values]) => {
    docs.push(`### ${category}\n`);
    Object.entries(values).forEach(([name, value]) => {
      docs.push(`- **${name}**: ${value}`);
    });
  });
  
  // Typography tokens
  docs.push('\n## Typography Tokens\n');
  Object.entries(tokens.typography).forEach(([category, values]) => {
    docs.push(`### ${category}\n`);
    Object.entries(values).forEach(([name, value]) => {
      docs.push(`- **${name}**: ${value}`);
    });
  });
  
  // Save to file
  fs.writeFileSync('DESIGN_TOKENS.md', docs.join('\n'));
}
```

### 3. Convert Design Tokens to CSS Variables
```javascript
// Script to generate CSS variables from tokens
const fs = require('fs');
const { colors, spacing, typography } = require('./src/styles/tokens');

function tokenToCSS() {
  let css = ':root {\n';
  
  // Convert colors
  Object.entries(colors).forEach(([category, values]) => {
    Object.entries(values).forEach(([name, value]) => {
      // Convert hex to RGB for opacity support
      const rgb = hexToRgb(value);
      css += `  --color-${category}-${name}: ${rgb};\n`;
    });
  });
  
  // Convert spacing
  Object.entries(spacing).forEach(([name, value]) => {
    css += `  --spacing-${name}: ${value};\n`;
  });
  
  // Convert typography
  Object.entries(typography.fontSize).forEach(([name, value]) => {
    css += `  --font-size-${name}: ${value};\n`;
  });
  
  css += '}\n';
  
  fs.writeFileSync('src/styles/tokens.css', css);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
    hex;
}
```

### 4. Sync Tokens with Tailwind Config
```javascript
// Update tailwind.config.js with latest tokens
const { colors, spacing, typography } = require('./src/styles/tokens');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map token structure to Tailwind structure
        brand: {
          primary: colors.brand.primary,
          secondary: colors.brand.secondary
        },
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        error: colors.semantic.error,
        info: colors.semantic.info,
        neutral: colors.neutral
      },
      spacing: spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight
    }
  }
};
```

### 5. Create Component Token Mapping
```typescript
// Map semantic tokens to component states
export const componentTokens = {
  button: {
    primary: {
      background: colors.brand.primary[600],
      backgroundHover: colors.brand.primary[700],
      text: colors.neutral[50],
      border: 'transparent'
    },
    secondary: {
      background: 'transparent',
      backgroundHover: colors.neutral[100],
      text: colors.brand.primary[600],
      border: colors.brand.primary[600]
    },
    danger: {
      background: colors.semantic.error.DEFAULT,
      backgroundHover: colors.semantic.error.dark,
      text: colors.neutral[50],
      border: 'transparent'
    }
  },
  
  card: {
    background: colors.neutral[50],
    border: colors.neutral[200],
    shadow: shadows.sm,
    hoverShadow: shadows.md
  },
  
  input: {
    background: colors.neutral[50],
    border: colors.neutral[300],
    borderFocus: colors.brand.primary[500],
    text: colors.neutral[900],
    placeholder: colors.neutral[500]
  }
};
```

### 6. Token Usage Audit
```bash
# Generate usage report
echo "=== Design Token Usage Report ==="
echo ""

# Count token references
echo "Color token usage:"
grep -r "colors\." src/ --include="*.tsx" --include="*.ts" | wc -l

echo "Spacing token usage:"
grep -r "spacing\." src/ --include="*.tsx" --include="*.ts" | wc -l

echo "Typography token usage:"
grep -r "typography\." src/ --include="*.tsx" --include="*.ts" | wc -l

echo ""
echo "Hardcoded values found:"
echo "- Colors: $(grep -r "#[0-9a-fA-F]\{3,6\}" src/ --include="*.tsx" --include="*.css" | wc -l)"
echo "- Spacing: $(grep -rE "padding:|margin:" src/ --include="*.tsx" --include="*.css" | grep -E "[0-9]+px" | wc -l)"
echo "- Font sizes: $(grep -r "font-size:" src/ --include="*.tsx" --include="*.css" | grep -E "[0-9]+px" | wc -l)"
```

### 7. Dark Mode Token Generation
```typescript
// Generate dark mode variants
export function generateDarkModeTokens(lightTokens: typeof colors) {
  return {
    brand: {
      primary: {
        // Invert lightness scale
        50: lightTokens.brand.primary[900],
        100: lightTokens.brand.primary[800],
        // ... etc
      }
    },
    neutral: {
      // Invert neutral scale
      50: lightTokens.neutral[900],
      100: lightTokens.neutral[800],
      // ... etc
    }
  };
}
```

### 8. Token Migration Helper
```typescript
// Help migrate from hardcoded values to tokens
const migrationMap = {
  // Colors
  '#1E40AF': 'colors.brand.primary[800]',
  '#3B82F6': 'colors.brand.primary[500]',
  '#10B981': 'colors.semantic.success.DEFAULT',
  '#EF4444': 'colors.semantic.error.DEFAULT',
  '#F59E0B': 'colors.semantic.warning.DEFAULT',
  
  // Spacing
  '4px': 'spacing[1]',
  '8px': 'spacing[2]',
  '16px': 'spacing[4]',
  '24px': 'spacing[6]',
  '32px': 'spacing[8]',
  
  // Font sizes
  '12px': 'typography.fontSize.xs',
  '14px': 'typography.fontSize.sm',
  '16px': 'typography.fontSize.base',
  '18px': 'typography.fontSize.lg',
  '20px': 'typography.fontSize.xl'
};

// Run migration
function migrateToTokens(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(migrationMap).forEach(([oldValue, newValue]) => {
    content = content.replace(new RegExp(oldValue, 'g'), `{${newValue}}`);
  });
  
  fs.writeFileSync(filePath, content);
}
```

## Token Best Practices:

1. **Semantic Naming**: Use purpose-based names (e.g., `colors.semantic.success`) rather than visual names (e.g., `colors.green`)

2. **Consistency**: Always use tokens instead of hardcoded values

3. **Documentation**: Keep token documentation up-to-date with usage examples

4. **Type Safety**: Use TypeScript for token definitions to ensure type safety

5. **Performance**: Use CSS variables for dynamic theming without JavaScript overhead

6. **Accessibility**: Ensure color tokens meet WCAG contrast requirements

## Validation Checklist:
- [ ] All colors use design tokens
- [ ] All spacing uses design tokens
- [ ] All typography uses design tokens
- [ ] Tokens are documented
- [ ] Dark mode tokens are defined
- [ ] Tokens are type-safe
- [ ] CSS variables are generated
- [ ] Tailwind config is synced
- [ ] No hardcoded values remain

Usage: `/design-tokens [validate|generate|migrate|audit]`