import { BusinessReportData, SearchTermData, CostInput } from '../types';

export const calculateOrganicSales = (brData: BusinessReportData[], strData: SearchTermData[]): number => {
  const totalBRSales = brData.reduce((sum, item) => sum + item.sales, 0);
  const totalPPCSales = strData.reduce((sum, item) => sum + item.sales, 0);
  return Math.max(0, totalBRSales - totalPPCSales);
};

export const calculateACoS = (spend: number, sales: number): number => {
  return sales > 0 ? (spend / sales) * 100 : 0;
};

export const calculateROAS = (sales: number, spend: number): number => {
  return spend > 0 ? sales / spend : 0;
};

export const calculateCTR = (clicks: number, impressions: number): number => {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
};

export const calculateCVR = (orders: number, clicks: number): number => {
  return clicks > 0 ? (orders / clicks) * 100 : 0;
};

export const calculateProfitPerUnit = (salePrice: number, fees: number, cogs: number): number => {
  return salePrice - fees - cogs;
};

export const calculateNetProfitPerUnit = (profitPerUnit: number, costPerConversion: number): number => {
  return profitPerUnit - costPerConversion;
};

export const calculateCostPerConversion = (spend: number, orders: number): number => {
  return orders > 0 ? spend / orders : 0;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};