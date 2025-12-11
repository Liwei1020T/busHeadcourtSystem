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

### 3. API Integration (`src/api.ts`)
- Centralized module for making HTTP requests to the Backend API.

## Features
- **Real-time Monitoring**: View current headcount and attendance status.
- **Data Management**: Forms and tables for managing Buses, Employees, and Vans.
- **Filtering**: Advanced filtering by date, shift, bus, and other criteria.
- **Responsive Design**: 
    - **Navigation**: Collapsible hamburger menu for mobile devices.
    - **Management Pages**: Adaptive "List/Form" toggle view for mobile, side-by-side split view for desktop.
    - **Tables**: Horizontally scrollable tables on smaller screens.
    - **Filters**: Stacked layout for filter inputs on mobile.

## Development
To start the development server:

```bash
npm run dev
```
