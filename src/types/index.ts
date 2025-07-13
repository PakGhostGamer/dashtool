export interface BusinessReportData {
  date: string;
  sku: string;
  title?: string;
  sessions: number;
  unitsOrdered: number;
  sales: number;
  conversionRate: number;
}

export interface SearchTermData {
  date: string;
  campaign: string;
  adGroup: string;
  searchTerm: string;
  matchType: string;
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
}

export interface CostInput {
  sku: string;
  salePrice: number;
  amazonFees: number;
  cogs: number;
  lastUpdated: string;
}

export interface DashboardFilters {
  dateRange: { start: string; end: string };
  skus: string[];
  campaigns: string[];
  matchTypes: string[];
}

export interface KPICard {
  title: string;
  value: string | number;
  change?: string;
  format?: 'currency' | 'percentage' | 'number';
}