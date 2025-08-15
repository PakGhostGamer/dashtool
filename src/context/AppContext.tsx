import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { BusinessReportData, SearchTermData, CostInput, DashboardFilters } from '../types';

interface AppState {
  businessReports: BusinessReportData[];
  searchTermReports: SearchTermData[];
  costInputs: CostInput[];
  filters: DashboardFilters;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_BUSINESS_REPORTS'; payload: BusinessReportData[] }
  | { type: 'SET_SEARCH_TERM_REPORTS'; payload: SearchTermData[] }
  | { type: 'UPDATE_COST_INPUTS'; payload: CostInput[] }
  | { type: 'SET_FILTERS'; payload: Partial<DashboardFilters> }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  businessReports: [],
  searchTermReports: [],
  costInputs: [],
  filters: {
    dateRange: { start: '', end: '' },
    skus: [],
    campaigns: [],
    matchTypes: []
  },
  isLoading: false
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_BUSINESS_REPORTS':
      return { ...state, businessReports: action.payload };
    case 'SET_SEARCH_TERM_REPORTS':
      return { ...state, searchTermReports: action.payload };
    case 'UPDATE_COST_INPUTS':
      return { ...state, costInputs: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}