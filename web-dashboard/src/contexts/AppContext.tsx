import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Filter parameters that can be shared across pages
export interface FilterParams {
  date_from: string;
  date_to: string;
  shift: string;
  bus_id: string;
  route: string;
}

interface AppContextType {
  filters: FilterParams;
  setFilters: (filters: FilterParams) => void;
  updateFilter: (key: keyof FilterParams, value: string) => void;
  resetFilters: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'bus-dashboard-filters';

// Get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get date 7 days ago in YYYY-MM-DD format
function getWeekAgoString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Default filter state
const getDefaultFilters = (): FilterParams => ({
  date_from: getWeekAgoString(),
  date_to: getTodayString(),
  shift: '',
  bus_id: '',
  route: '',
});

// Load filters from localStorage
function loadFiltersFromStorage(): FilterParams {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...getDefaultFilters(), ...JSON.parse(stored) } as FilterParams;
    }
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
  }
  return getDefaultFilters();
}

// Save filters to localStorage
function saveFiltersToStorage(filters: FilterParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterParams>(loadFiltersFromStorage);
  const [isLoading, setIsLoading] = useState(false);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  const setFilters = (newFilters: FilterParams) => {
    setFiltersState(newFilters);
  };

  const updateFilter = (key: keyof FilterParams, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFiltersState(getDefaultFilters());
  };

  return (
    <AppContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
