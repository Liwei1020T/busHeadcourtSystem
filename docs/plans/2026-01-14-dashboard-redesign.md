# Bus Dashboard Redesign

**Date:** 2026-01-14
**Status:** Approved

## Overview

Comprehensive redesign of the Bus Dashboard to address:
- Information overload
- Missing insights (charts/trends)
- Dated visual appearance
- Workflow friction for common tasks

## Target Users

1. **Operations Manager** - Quickly spot problem buses and take action
2. **Fleet Planner** - Analyze trends over time to optimize routes and capacity

---

## Design Decisions

### Mode Switching

Toggle between two distinct modes:
- **Live Operations** - Real-time monitoring, problem spotting
- **Analytics** - Historical trends, planning insights

### Visual Style

Industrial/mission-control aesthetic:
- Dark sidebar + light content area
- Bold status colors (red/amber/green)
- Monospace numbers for data
- Uppercase labels with letter-spacing
- Minimal shadows, subtle borders

### Color Palette

```
Background:    #1a1d21 (dark charcoal) - headers/sidebar
               #f5f5f5 (light gray) - main content
               #ffffff (white) - cards/tables

Status:        #ef4444 (red) - Critical
               #f59e0b (amber) - Warning
               #22c55e (green) - Normal
               #3b82f6 (blue) - Info

Accent:        #06b6d4 (cyan) - Interactive elements
```

---

## Live Operations Mode

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Logo | [Live Ops] [Analytics] | Filters   │
├─────────────────────────────────────────────────────┤
│  ALERT BANNER (conditional)                         │
│  "🔴 3 Critical  🟡 5 Warning  🟢 108 Normal"       │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                        │
│  - Summary   │  - Zone-grouped table                │
│    KPIs      │  - Collapsible sections              │
│  - Quick     │  - Color-coded severity              │
│    filters   │                                      │
│  - Problem   │                                      │
│    counts    │                                      │
└──────────────┴──────────────────────────────────────┘
```

### Alert Banner

- Appears only when critical/warning issues exist
- Dark background with colored status pills
- Clickable to filter table by status
- Dismissible for the session

### Sidebar

Always visible, no scrolling needed:

- **Today's Status**
  - Present count with progress bar vs roster
  - Utilization percentage with progress bar

- **Problem Buses**
  - 🔴 Critical: count
  - 🟡 Warning: count

- **Quick Filters**
  - Overloaded checkbox
  - Underutilized checkbox
  - High Absent checkbox
  - Zone dropdown

### Severity Thresholds

| Level | Criteria |
|-------|----------|
| 🔴 Critical | Utilization > 120% OR < 10% |
| 🟡 Warning | Utilization > 100% OR < 30% |
| 🟢 Normal | Everything else |

### Zone-Grouped Table

Each zone is a collapsible section:

```
▼ ZONE A (12 buses)         🔴2 🟡1  │ Util: 78%  │ 1,240 pax │
├─────────────────────────────────────────────────────────────┤
│ STATUS │ BUS  │ ROUTE   │ CAP │ ACTUAL │ UTIL  │ ABSENT │ → │
│ 🔴     │ A07  │ Route-7 │  40 │    213 │ 532%  │   -    │ → │
│ 🔴     │ A03  │ Route-3 │  40 │     60 │ 150%  │   -    │ → │
│ 🟢     │ A01  │ Route-1 │  52 │     29 │  56%  │   -    │ → │

▶ ZONE B (8 buses)          🟢8       │ Util: 65%  │  890 pax  │
▶ ZONE BK (15 buses)        🔴1 🟡3   │ Util: 82%  │ 2,100 pax │
```

Features:
- Auto-sorted by severity within each zone
- Row highlighting: light red (critical), light yellow (warning)
- Compact columns (removed VANS, UNKNOWN - show in drawer)
- Click row to open detail drawer

### Bus Detail Drawer

Slide-in panel with:

1. **Header**: Bus ID, route, zone, status badge
2. **KPI Cards**: Actual, Capacity, Utilization
3. **Capacity Breakdown**: Bus seats + van seats = total
4. **Employee List**: Tabbed (All/Present/Absent), with search
5. **Actions**: Export List, Notify Supervisor buttons

---

## Analytics Mode

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  PERIOD SUMMARY (vs previous period)                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Avg Util    │ │ Avg Present │ │ Problem Days│ │ Est. Waste │ │
│  │   82.4%     │ │   6,840     │ │      3      │ │   RM2.4k   │ │
│  │   ▲ +3.2%   │ │   ▼ -120    │ │   ▼ -2      │ │   ▼ -800   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ UTILIZATION TREND           │ │ ROUTE COMPARISON            │ │
│  │ Line chart (day/week/month) │ │ Horizontal bar chart        │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ ATTENDANCE HEATMAP          │ │ COST ANALYSIS               │ │
│  │ Day × Shift matrix          │ │ Underutilized bus metrics   │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Chart Components

1. **Utilization Trend**
   - Line chart showing capacity usage over time
   - Toggle: Day / Week / Month granularity
   - Compare to previous period (dashed line)

2. **Route Comparison**
   - Horizontal bar chart
   - Ranked by utilization percentage
   - Color-coded by status

3. **Attendance Heatmap**
   - Rows: Shifts (AM, PM, Night)
   - Columns: Days of week
   - Cell color intensity = attendance rate

4. **Cost Analysis**
   - Underutilized buses count
   - Empty seats per day
   - Estimated monthly waste (RM)
   - List of top wasteful routes

---

## Responsive Behavior

**Desktop** (primary): Full layout as designed

**Tablet**: Sidebar collapses to icons, expand on hover

**Mobile**:
- Sidebar becomes bottom nav
- Table switches to card view
- Charts stack vertically

---

## Technical Notes

- No geographic map (zone names only, no coordinates)
- Use grouped table with collapsible zones instead
- Existing tech stack: React, TypeScript, Tailwind CSS
- Charts: Recommend Recharts or Chart.js

---

## Next Steps

1. Create implementation plan
2. Set up git worktree for isolated development
3. Build Live Ops mode first (higher priority)
4. Add Analytics mode second
