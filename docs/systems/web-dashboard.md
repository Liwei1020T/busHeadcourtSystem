# Web Dashboard System Documentation

## Overview
The Web Dashboard is a modern Single Page Application (SPA) built with React. It provides the user interface for administrators to monitor bus operations, manage master data, and view analytics.

## Technology Stack
- **Framework:** React
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router (implied)

## Key Components (`web-dashboard/src/`)

### 1. Pages (`src/pages/`)
- **`BusDashboard.tsx`**: The main landing page for monitoring daily operations.
- **`BusManagement.tsx`**: Administration page for managing bus fleet data.
- **`EmployeeManagement.tsx`**: Administration page for managing employee records.
- **`VanManagement.tsx`**: Administration page for managing van fleet data.

### 2. Components (`src/components/`)
- **`FiltersBar.tsx`**: Reusable component for filtering headcount queries (date range, shift, bus).
- **`KpiCard.tsx`**: Displays key performance indicators (e.g., Total Present).
- **`TripTable.tsx`**: Displays trip summaries.
- **`ScanTable.tsx`**: Displays detailed scan logs with inline filters (date required; optional bus and shift). It inherits the dashboard’s current bus/shift filters on load and reloads data when any of its filters change.
- **`HeadcountChart.tsx`**: Visualizes headcount totals by date and shift using the active dashboard filters.

### 3. API Integration (`src/api.ts`)
- Centralized module for making HTTP requests to the Backend API.

## Features
- **Real-time Monitoring**: View current headcount and attendance status with live filters
- **Headcount Visualization**: Line graph by date/shift that mirrors the headcount table filters and totals
- **Data Management**: CRUD forms and tables for Buses, Employees, and Vans with toast notifications
- **Persistent Filters**: Filter state saved to localStorage across browser sessions
- **Toast Notifications**: User feedback for async operations (success, error, warning, info)
- **CSV Exports**: Download headcount and attendance data with currently active filters applied
- **Design System**: Consistent UI using shadcn/ui components and centralized design tokens
- **Loading States**: Skeleton components for improved perceived performance
- **Filtering**: Advanced filtering by date, shift, bus with reset functionality
- **Responsive Design**: 
    - **Navigation**: Collapsible hamburger menu for mobile devices
    - **Management Pages**: Adaptive "List/Form" toggle view for mobile, side-by-side split view for desktop
    - **Tables**: Horizontally scrollable tables on smaller screens using shadcn/ui Table component
    - **Filters**: Stacked layout for filter inputs on mobile
    - **Breakpoints**: Mobile (default), sm (640px), md (768px), lg (1024px)

## Design System

The application uses a comprehensive design system for consistency. See `src/lib/design-system/README.md` for complete documentation.

### Key Features
- **Design Tokens**: Centralized color palettes, spacing, typography in `src/lib/design-system/tokens.ts`
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Context Providers**: AppContext for filter persistence, ToastContext for notifications
- **Consistent Patterns**: Standardized page layouts, form styles, loading states, error handling

### Color System
- **Primary**: Blue (#2563eb) for buttons, links, primary actions
- **Shift Colors**: Green (morning), Indigo (night), Gray (unknown)
- **Status Colors**: Green (success/active), Yellow (warning), Red (error), Gray (inactive)

### Usage
```typescript
import { Button } from '@/components/ui/button';
import { SPACING, TYPOGRAPHY } from '@/lib/design-system/tokens';
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

// Use design tokens
<div className={SPACING.section}>
  <h1 className={TYPOGRAPHY.pageTitle}>Page Title</h1>
  <Button onClick={() => showToast('success', 'Action completed')}>
    Save
  </Button>
</div>
```

## State Management

### Context Providers

#### AppContext
Manages global filter state with localStorage persistence:
```typescript
import { useApp } from '@/contexts/AppContext';

const { filters, setFilters, updateFilter, resetFilters } = useApp();

// Update single filter
updateFilter('bus_id', 'A01');

// Reset all filters
resetFilters();
```

#### ToastContext
Provides user feedback notifications:
```typescript
import { useToast } from '@/contexts/ToastContext';

const { showToast } = useToast();

showToast('success', 'Data saved successfully');
showToast('error', 'Failed to load data');
```

## Development
To start the development server:

```bash
cd web-dashboard
npm run dev
```

## Build for Production
```bash
npm run build
```

## Code Guidelines
- **English Only**: All code, comments, and identifiers must be in English
- **Design System**: Use design tokens and shadcn/ui components, avoid hard-coded styles
- **Context Hooks**: Use useApp and useToast for shared state
- **Toast Notifications**: Show feedback for all async operations
- **Responsive**: Test all changes across mobile, tablet, desktop breakpoints
- **TypeScript**: Maintain strict type safety
