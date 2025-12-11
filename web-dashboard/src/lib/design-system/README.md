# Design System Documentation

## Overview

This design system provides consistent styling, components, and patterns across the Bus Optimizer dashboard. It uses shadcn/ui components with customized Tailwind CSS tokens.

## Core Principles

1. **Consistency** - Use design tokens for all spacing, colors, and typography
2. **Accessibility** - All components follow WCAG guidelines
3. **Responsiveness** - Mobile-first approach with consistent breakpoints
4. **English Only** - All code, comments, and documentation must be in English

## Design Tokens

Located in `src/lib/design-system/tokens.ts`

### Color System

#### Shift Colors
Used for shift badges and status indicators:
```typescript
SHIFT_COLORS = {
  morning: { bg: 'bg-green-100', text: 'text-green-800', badge: 'bg-green-100 text-green-800' },
  night: { bg: 'bg-indigo-100', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-800' },
  unknown: { bg: 'bg-gray-100', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-800' },
}
```

#### Status Colors
```typescript
STATUS_COLORS = {
  present: green,
  unknown_batch: yellow,
  unknown_shift: red,
  active: green,
  inactive: gray,
}
```

#### KPI Card Colors
```typescript
KPI_COLORS = {
  blue, green, yellow, red
}
```

### Spacing Tokens

```typescript
SPACING = {
  section: 'space-y-6',      // Between major page sections
  card: 'space-y-4',         // Inside cards
  form: 'space-y-4',         // Form fields
  inline: 'gap-2',           // Inline elements (buttons, badges)
  inlineMd: 'gap-3',
  inlineLg: 'gap-4',
}
```

### Typography Scale

```typescript
TYPOGRAPHY = {
  pageTitle: 'text-2xl font-bold text-gray-900',
  pageSubtitle: 'text-sm text-gray-500',
  sectionTitle: 'text-lg font-semibold text-gray-900',
  cardTitle: 'text-base font-medium text-gray-900',
  label: 'text-sm font-medium text-gray-700',
  labelUppercase: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
  body: 'text-sm text-gray-900',
  bodySm: 'text-xs text-gray-600',
  kpiValue: 'text-2xl font-semibold',
  kpiLabel: 'text-xs text-gray-500',
}
```

### Layout Tokens

```typescript
LAYOUT = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  cardPadding: 'p-6',
  cardPaddingSm: 'p-4',
  navHeight: 'h-16',
}
```

## Component Library

### shadcn/ui Components

Located in `src/components/ui/`

#### Button
```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

#### Input
```tsx
import { Input } from '@/components/ui/input';

<Input type="text" placeholder="Enter text" />
<Input type="date" />
<Input type="email" />
```

#### Select
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Morning</Badge>
<Badge variant="secondary">Night</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Unknown</Badge>
```

#### Card
```tsx
import { Card } from '@/components/ui/card';

<Card className="p-6">
  {/* Card content */}
</Card>
```

#### Table
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Dialog
```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Skeleton
```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Loading state
<Skeleton className="h-4 w-full" />
<Skeleton className="h-10 w-1/3" />
```

## Context Providers

### AppContext
Provides filter persistence and global app state.

```tsx
import { useApp } from '@/contexts/AppContext';

const { filters, setFilters, updateFilter, resetFilters, isLoading, setIsLoading } = useApp();

// Update a single filter
updateFilter('bus_id', 'A01');

// Replace all filters
setFilters({ date_from: '2025-12-01', date_to: '2025-12-11', shift: 'morning', bus_id: '' });

// Reset to defaults
resetFilters();
```

Filters are automatically persisted to localStorage.

### ToastContext
Provides toast notifications for user feedback.

```tsx
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

// Show notifications
showToast('success', 'Data saved successfully');
showToast('error', 'Failed to load data');
showToast('warning', 'Please check your input');
showToast('info', 'Data refreshed');

// Custom duration (default: 3000ms)
showToast('success', 'Quick message', 1000);
```

## Usage Patterns

### Page Layout

```tsx
import { SPACING, TYPOGRAPHY } from '@/lib/design-system/tokens';

export default function MyPage() {
  return (
    <div className={SPACING.section}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Page Title</h1>
          <p className={TYPOGRAPHY.pageSubtitle}>Page description</p>
        </div>
      </div>

      {/* Content sections */}
      <Card className="p-6">
        <h2 className={TYPOGRAPHY.sectionTitle}>Section Title</h2>
        {/* Section content */}
      </Card>
    </div>
  );
}
```

### Form Layout

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SPACING, TYPOGRAPHY } from '@/lib/design-system/tokens';

<form className={SPACING.form} onSubmit={handleSubmit}>
  <div>
    <label className={TYPOGRAPHY.label}>Field Label</label>
    <Input type="text" value={value} onChange={handleChange} />
  </div>
  
  <div className={`flex ${SPACING.inline} justify-end`}>
    <Button variant="outline" type="button" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

### Loading States

```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

if (loading) {
  return (
    <Card className="p-6">
      <Skeleton className="h-4 w-1/4 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  );
}
```

### Error Handling

Use toast notifications instead of inline errors:

```tsx
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

try {
  await saveData();
  showToast('success', 'Data saved successfully');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to save';
  showToast('error', message);
}
```

## Responsive Breakpoints

```
sm: 640px   // Small devices (tablets)
md: 768px   // Medium devices (tablets/small laptops)
lg: 1024px  // Large devices (laptops/desktops)
```

### Responsive Patterns

```tsx
// Mobile: full width, Desktop: grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Grid items */}
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="md:hidden">Mobile only</div>

// Responsive spacing
<div className="flex flex-wrap gap-2 md:gap-4">
  {/* Items */}
</div>
```

## Best Practices

1. **Always use design tokens** instead of hard-coded Tailwind classes
2. **Use shadcn/ui components** for consistency
3. **Use context hooks** (useApp, useToast) for shared state
4. **Show toast notifications** for user feedback on async actions
5. **Use Skeleton components** for loading states
6. **Keep English-only** in all code and comments
7. **Maintain responsive design** with mobile-first approach
8. **Test across breakpoints** (mobile, tablet, desktop)

## Migration Guide

### Replacing Old Components

#### Old Badge
```tsx
// Before
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>

// After
import { Badge } from '@/components/ui/badge';
<Badge variant="default">Active</Badge>
```

#### Old Button
```tsx
// Before
<button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
  Submit
</button>

// After
import { Button } from '@/components/ui/button';
<Button>Submit</Button>
```

#### Old Input
```tsx
// Before
<input 
  type="text"
  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
/>

// After
import { Input } from '@/components/ui/input';
<Input type="text" />
```

## Color Reference

### Primary Blue Palette
- 50: #eff6ff
- 100: #dbeafe
- 200: #bfdbfe
- 300: #93c5fd
- 400: #60a5fa
- 500: #3b82f6
- 600: #2563eb (Primary)
- 700: #1d4ed8
- 800: #1e40af
- 900: #1e3a8a

### Shift Colors
- Morning: Green (#10b981)
- Night: Indigo (#6366f1)
- Unknown: Gray (#6b7280)

### Status Colors
- Success/Active: Green (#10b981)
- Warning/Unknown Batch: Yellow (#f59e0b)
- Error/Unknown Shift: Red (#ef4444)
- Inactive: Gray (#6b7280)
