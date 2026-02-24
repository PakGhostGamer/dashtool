import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { FilterableTable } from '../ui/FilterableTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateOrganicSales, formatCurrency } from '../../utils/calculations';
import { Link } from 'react-router-dom';

export function OverallView() {
  const { state } = useApp();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-calculation when cost inputs change
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [state.costInputs]);

  // Calculate KPIs (no date filtering)
  const totalSales = state.businessReports.reduce((sum, item) => sum + item.sales, 0);
  const ppcSales = state.searchTermReports.reduce((sum, item) => sum + item.sales, 0);
  const organicSales = Math.max(0, totalSales - ppcSales);
  const totalSessions = state.businessReports.reduce((sum, item) => sum + item.sessions, 0);
  const totalUnits = state.businessReports.reduce((sum, item) => sum + item.unitsOrdered, 0);
  const ppcSpend = state.searchTermReports.reduce((sum, item) => sum + item.spend, 0);

  // Additional metrics
  const totalClicks = state.searchTermReports.reduce((sum, item) => sum + (item.clicks || 0), 0);
  const totalImpressions = state.searchTermReports.reduce((sum, item) => sum + (item.impressions || 0), 0);
  const totalOrders = state.searchTermReports.reduce((sum, item) => sum + (item.orders || 0), 0);

  // Cost data (use average or defaults)
  const costInputs = state.costInputs;
  const validCostInputs = costInputs.filter(c => c.salePrice > 0 && c.amazonFees > 0 && c.cogs > 0);
  
  // Calculate actual profit for each SKU based on its cost data
  const skuProfits = state.businessReports.map(br => {
    const costData = costInputs.find(c => c.sku === br.sku);
    if (costData && costData.salePrice > 0 && costData.amazonFees > 0 && costData.cogs > 0) {
      const profitPerUnit = costData.salePrice - costData.amazonFees - costData.cogs;
      return {
        sku: br.sku,
        profitPerUnit,
        units: br.unitsOrdered,
        totalProfit: profitPerUnit * br.unitsOrdered
      };
    }
    return null;
  }).filter(Boolean);

  // Calculate total profit and other metrics based on actual cost data
  const totalProfitBeforeAds = skuProfits.reduce((sum, item) => sum + (item?.totalProfit || 0), 0);
  const totalUnitsWithCosts = skuProfits.reduce((sum, item) => sum + (item?.units || 0), 0);
  
  // Use actual profit per unit for calculations, fallback to averages if no cost data
  const avgProfitPerUnit = totalUnitsWithCosts > 0 ? totalProfitBeforeAds / totalUnitsWithCosts : 0;
  
  // Fallback averages for display purposes
  const avgSalePrice = validCostInputs.length > 0 ? validCostInputs.reduce((sum, c) => sum + (c.salePrice || 0), 0) / validCostInputs.length : 0;
  const avgFees = validCostInputs.length > 0 ? validCostInputs.reduce((sum, c) => sum + (c.amazonFees || 0), 0) / validCostInputs.length : 0;
  const avgCOGS = validCostInputs.length > 0 ? validCostInputs.reduce((sum, c) => sum + (c.cogs || 0), 0) / validCostInputs.length : 0;

  // Calculations
  const sessionsPerConversion = totalUnits > 0 ? (totalSessions / totalUnits) : 0;
  const costPerConversion = totalUnits > 0 ? (ppcSpend / totalUnits) : 0;
  const profitBeforeAds = avgProfitPerUnit; // Use calculated profit per unit
  const netProfitPerUnit = profitBeforeAds - costPerConversion;
  const acos = ppcSales > 0 ? (ppcSpend / ppcSales) * 100 : 0;
  const roas = ppcSpend > 0 ? (ppcSales / ppcSpend) : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;
  const cvr = totalClicks > 0 ? (totalOrders / totalClicks) : 0;

  // Prepare chart data (aggregate all data, ignore date)
  const chartData = [
    {
      label: 'All Data',
      sales: totalSales,
      ppcSales: ppcSales,
      organicSales: organicSales,
      sessions: totalSessions,
      units: totalUnits,
      ppcSpend: ppcSpend
    }
  ];

  // Calculate additional unique metrics
  const avgOrderValue = totalUnits > 0 ? totalSales / totalUnits : 0;
  const conversionRate = totalSessions > 0 ? (totalUnits / totalSessions) * 100 : 0;
  const sessionsPerOrder = totalUnits > 0 ? totalSessions / totalUnits : 0;
  const revenuePerSession = totalSessions > 0 ? totalSales / totalSessions : 0;
  const revenuePerClick = totalClicks > 0 ? totalSales / totalClicks : 0;
  const costPerClick = totalClicks > 0 ? ppcSpend / totalClicks : 0;
  const costPerOrder = totalUnits > 0 ? ppcSpend / totalUnits : 0;
  
  // Calculate profit margin using actual cost data
  const totalCosts = skuProfits.reduce((sum, item) => {
    const costData = costInputs.find(c => c.sku === item?.sku);
    if (costData) {
      return sum + (costData.cogs * (item?.units || 0)) + (costData.amazonFees * (item?.units || 0));
    }
    return sum;
  }, 0);
  
  const profitMargin = totalSales > 0 ? ((totalSales - totalCosts - ppcSpend) / totalSales) * 100 : 0;
  const netProfit = totalSales - totalCosts - ppcSpend;
  const uniqueSKUs = new Set(state.businessReports.map(br => br.sku)).size;
  const uniqueCampaignsCount = new Set(state.searchTermReports.map(str => str.campaign)).size;
  const uniqueSearchTerms = new Set(state.searchTermReports.map(str => str.searchTerm)).size;

  const kpis = [
    {
      title: 'Total Sales',
      value: totalSales,
      format: 'currency' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          100%
        </div>
      )
    },
    {
      title: 'PPC Sales',
      value: ppcSales,
      format: 'currency' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm group relative cursor-pointer">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-200">+{totalSales > 0 ? ((ppcSales / totalSales) * 100).toFixed(1) : '0'}%</span>
          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-max bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">This is {totalSales > 0 ? ((ppcSales / totalSales) * 100).toFixed(1) : '0'}% of Total Sales</span>
        </div>
      )
    },
    {
      title: 'Organic Sales',
      value: organicSales,
      format: 'currency' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm group relative cursor-pointer">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity duration-200">+{totalSales > 0 ? ((organicSales / totalSales) * 100).toFixed(1) : '0'}%</span>
          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-max bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">This is {totalSales > 0 ? ((organicSales / totalSales) * 100).toFixed(1) : '0'}% of Total Sales</span>
        </div>
      )
    },
    {
      title: 'Net Profit',
      value: netProfit,
      format: 'currency' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {profitMargin.toFixed(1)}%
        </div>
      )
    },
    {
      title: 'Total Sessions',
      value: totalSessions,
      format: 'number' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-blue-700 bg-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {conversionRate.toFixed(2)}% CVR
        </div>
      )
    },
    {
      title: 'Total Units',
      value: totalUnits,
      format: 'number' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-purple-700 bg-purple-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {formatCurrency(avgOrderValue)} AOV
        </div>
      )
    },
    {
      title: 'PPC Spend',
      value: ppcSpend,
      format: 'currency' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-orange-700 bg-orange-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {acos.toFixed(1)}% ACoS
        </div>
      )
    },
    {
      title: 'ROAS',
      value: roas,
      format: 'number' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {roas.toFixed(2)}x
        </div>
      )
    }
  ];

  // Filter state
  const [campaignFilter, setCampaignFilter] = useState('');
  const [searchTermFilter, setSearchTermFilter] = useState('');
  const [acosMin, setAcosMin] = useState('');
  const [acosMax, setAcosMax] = useState('');

  // Unique campaigns for dropdown
  const uniqueCampaigns = Array.from(new Set(state.searchTermReports.map(r => r.campaign)));

  // Filtered STR data
  const filteredSTR = state.searchTermReports.filter(row => {
    // Campaign filter
    if (campaignFilter && row.campaign !== campaignFilter) return false;
    // Search term filter
    if (searchTermFilter && !row.searchTerm.toLowerCase().includes(searchTermFilter.toLowerCase())) return false;
    // ACoS filter
    const acos = row.sales > 0 ? (row.spend / row.sales) * 100 : 0;
    if (acosMin && acos < parseFloat(acosMin)) return false;
    if (acosMax && acos > parseFloat(acosMax)) return false;
    return true;
  });

  // Build daily data using STR dates as the timeline
  const strDates = Array.from(new Set(state.searchTermReports.map(row => row.date))).sort();
  // If only one BR row, use its values for all dates; if multiple, distribute evenly
  let brRows = state.businessReports;
  if (brRows.length === 1 && strDates.length > 1) {
    brRows = strDates.map(date => ({ ...brRows[0], date }));
  } else if (brRows.length !== strDates.length && brRows.length > 1) {
    // Distribute BR rows across STR dates (cycle if needed)
    brRows = strDates.map((date, idx) => ({ ...brRows[idx % brRows.length], date }));
  }
  // Build daily rows
  const dailyRows = strDates.map(date => {
    const strRows = state.searchTermReports.filter(r => r.date === date);
    const brRow = brRows.find(r => r.date === date) || brRows[0] || {};
    const totalSales = brRow.sales || 0;
    const ppcSales = strRows.reduce((sum, r) => sum + (r.sales || 0), 0);
    const organicSales = totalSales - ppcSales;
    const sessions = brRow.sessions || 0;
    const unitsOrdered = brRow.unitsOrdered || 0;
    const cvr = sessions > 0 ? (unitsOrdered / sessions) * 100 : 0;
    const ppcSpend = strRows.reduce((sum, r) => sum + (r.spend || 0), 0);
    const costPerConversion = unitsOrdered > 0 ? ppcSpend / unitsOrdered : 0;
    const profitBeforeAds = avgProfitPerUnit; // Use calculated profit per unit
    const netProfit = profitBeforeAds - costPerConversion;
    return {
      date,
      totalSales,
      ppcSales,
      organicSales,
      sessions,
      unitsOrdered,
      cvr,
      ppcSpend,
      costPerConversion,
      profitBeforeAds,
      netProfit
    };
  });

  // Calculate Match Type performance analysis
  const matchTypeData = state.searchTermReports.reduce((acc, item) => {
    const matchType = item.matchType === '-' ? 'Auto' : item.matchType;
    if (!acc[matchType]) {
      acc[matchType] = {
        matchType,
        spend: 0,
        sales: 0,
        orders: 0,
        impressions: 0,
        clicks: 0
      };
    }
    acc[matchType].spend += item.spend;
    acc[matchType].sales += item.sales;
    acc[matchType].orders += item.orders;
    acc[matchType].impressions += item.impressions;
    acc[matchType].clicks += item.clicks;
    return acc;
  }, {} as Record<string, any>);

  // Calculate percentages and additional metrics for each match type
  const matchTypeArray = Object.values(matchTypeData).map(match => ({
    ...match,
    acos: match.sales > 0 ? (match.spend / match.sales) * 100 : 0,
    roas: match.spend > 0 ? match.sales / match.spend : 0,
    ctr: match.impressions > 0 ? (match.clicks / match.impressions) * 100 : 0,
    cvr: match.clicks > 0 ? (match.orders / match.clicks) * 100 : 0,
    salesPercentage: ppcSales > 0 ? (match.sales / ppcSales) * 100 : 0,
    spendPercentage: ppcSpend > 0 ? (match.spend / ppcSpend) * 100 : 0
  }));

  // Calculate wasted spend campaigns for overall account
  const campaignData = state.searchTermReports.reduce((acc, item) => {
    if (!acc[item.campaign]) {
      acc[item.campaign] = {
        campaign: item.campaign,
        spend: 0,
        sales: 0,
        orders: 0,
        impressions: 0,
        clicks: 0
      };
    }
    acc[item.campaign].spend += item.spend;
    acc[item.campaign].sales += item.sales;
    acc[item.campaign].orders += item.orders;
    acc[item.campaign].impressions += item.impressions;
    acc[item.campaign].clicks += item.clicks;
    return acc;
  }, {} as Record<string, any>);
  const campaignArray = Object.values(campaignData);
  const wastedSpendCampaigns = campaignArray
    .filter(c => c.spend > 0 && c.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  return (
    <div id="overall-content" className="space-y-6">
      {/* Cost Data Warning */}
      {validCostInputs.length === 0 && costInputs.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Cost Data Missing
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  No valid cost data found. Please set Sale Price, Amazon Fees, and COGS for your ASINs in the Cost Inputs section.
                  <button type="button" className="text-yellow-700 underline ml-1" onClick={() => window.dispatchEvent(new CustomEvent('dashboard-goto-asin-cost'))}>Go to Cost Inputs</button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            format={kpi.format}
            icon={kpi.icon}
            extra={kpi.extra}
          />
        ))}
      </div>

      {/* Match Type Performance Analysis */}
      <Card className="mt-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-3"></div>
              Match Type Performance Analysis
            </h3>
            <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full shadow-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
              NEW
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {matchTypeArray.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">No Search Term Report data uploaded yet.</div>
          ) : (
            <FilterableTable
              title=""
              data={matchTypeArray}
              columns={[
                { key: 'matchType', label: 'Match Type', type: 'text' },
                { key: 'spend', label: 'Spend', type: 'currency' },
                { key: 'sales', label: 'Sales', type: 'currency' },
                { key: 'orders', label: 'Orders', type: 'number' },
                { key: 'impressions', label: 'Impressions', type: 'number' },
                { key: 'clicks', label: 'Clicks', type: 'number' },
                { key: 'acos', label: 'ACoS', type: 'percentage' },
                { key: 'roas', label: 'ROAS', type: 'number' },
                { key: 'ctr', label: 'CTR', type: 'percentage' },
                { key: 'cvr', label: 'CVR', type: 'percentage' },
                { key: 'salesPercentage', label: 'Sales %', type: 'percentage' },
                { key: 'spendPercentage', label: 'Spend %', type: 'percentage' }
              ]}
              maxRows={20}
              showFilters={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Match Type Sales Distribution Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3"></div>
              Sales Distribution by Match Type
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <defs>
                  <linearGradient id="broadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="phraseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="exactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="autoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Pie
                  data={matchTypeArray}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="sales"
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {matchTypeArray.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.matchType === 'Broad' ? 'url(#broadGradient)' :
                        entry.matchType === 'Phrase' ? 'url(#phraseGradient)' :
                        entry.matchType === 'Exact' ? 'url(#exactGradient)' :
                        'url(#autoGradient)'
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {matchTypeArray.map((entry, idx) => (
                <div key={entry.matchType} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{
                      background: entry.matchType === 'Broad' ? 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)'
                        : entry.matchType === 'Phrase' ? 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)'
                        : entry.matchType === 'Exact' ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #F97316 0%, #EA580C 100%)',
                    }}
                  ></span>
                  <span>{entry.matchType}</span>
                  <span className="text-xs text-gray-500">{entry.salesPercentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></div>
              Spend vs Sales by Match Type
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={matchTypeArray} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="spendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="matchType" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="url(#salesGradient)" 
                  name="Sales"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="spend" 
                  fill="url(#spendGradient)" 
                  name="Spend"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>



      {/* Detailed BR Data Table */}
      <Card className="mt-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></div>
            Business Report Data (Detailed)
          </h3>
        </CardHeader>
        <CardContent>
          {state.businessReports.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">No Business Report data uploaded yet.</div>
          ) : (
            <FilterableTable
              title=""
              data={state.businessReports}
              columns={[
                { key: 'sku', label: 'SKU', type: 'text' },
                { key: 'sessions', label: 'Sessions', type: 'number' },
                { key: 'unitsOrdered', label: 'Units Ordered', type: 'number' },
                { key: 'sales', label: 'Sales', type: 'currency' },
                { key: 'conversionRate', label: 'Conversion Rate (%)', type: 'percentage' }
              ]}
              maxRows={100}
              showFilters={false}
              allBusinessReports={state.businessReports}
            />
          )}
        </CardContent>
      </Card>

      {/* Amazon Metrics Summary */}
      <Card className="mt-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mr-3"></div>
              Key Amazon Metrics
            </h3>
            <button
              onClick={() => setForceUpdate(prev => prev + 1)}
              className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Debug Info - Remove this later */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="font-semibold text-blue-800 mb-2">Cost Data Status:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="font-medium">Total SKUs:</span> {uniqueSKUs}
              </div>
              <div>
                <span className="font-medium">With Cost Data:</span> {validCostInputs.length}
              </div>
              <div>
                <span className="font-medium">Avg Profit/Unit:</span> {formatCurrency(avgProfitPerUnit)}
              </div>
              <div>
                <span className="font-medium">Total Profit:</span> {formatCurrency(totalProfitBeforeAds)}
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Last updated: {new Date().toLocaleTimeString()} | Force update count: {forceUpdate}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm">Organic Sales</div>
              <div className="text-xl font-bold">{formatCurrency(organicSales)}</div>
              <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded px-2 py-0.5 text-xs font-semibold">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {`+${totalSales > 0 ? ((organicSales / totalSales) * 100).toFixed(1) : '0'}%`}
              </div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm">Sessions per Conversion</div>
              <div className="text-xl font-bold">{sessionsPerConversion.toFixed(2)}</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm flex items-center gap-2">
                Cost per Conversion
              </div>
              <div className="text-xl font-bold">{formatCurrency(costPerConversion)}</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm">Profit per Unit (before ads)</div>
              <div className="text-xl font-bold">{formatCurrency(profitBeforeAds)}</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm">Net Profit per Unit</div>
              <div className="text-xl font-bold">{formatCurrency(netProfitPerUnit)}</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm flex items-center gap-2">
                ACoS
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">PPC</span>
              </div>
              <div className="text-xl font-bold">{acos.toFixed(2)}%</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm flex items-center gap-2">
                ROAS
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">PPC</span>
              </div>
              <div className="text-xl font-bold">{roas.toFixed(2)}</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm flex items-center gap-2">
                CTR
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">PPC</span>
              </div>
              <div className="text-xl font-bold">{(ctr * 100).toFixed(2)}%</div>
            </div>
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <div className="text-gray-600 text-sm flex items-center gap-2">
                CVR
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">PPC</span>
              </div>
              <div className="text-xl font-bold">{(cvr * 100).toFixed(2)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remove Sales Over Time chart and add Wasted Spend Campaigns table */}
      <Card className="mt-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-red-700 flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3"></div>
            💸 Wasted Spend Campaigns (Account-wide)
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-red-50">
                  <th className="text-left py-2 px-2 font-medium">Campaign</th>
                  <th className="text-left py-2 px-2 font-medium">Spend</th>
                  <th className="text-left py-2 px-2 font-medium">Impressions</th>
                  <th className="text-left py-2 px-2 font-medium">Clicks</th>
                  <th className="text-left py-2 px-2 font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {wastedSpendCampaigns.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-500">No wasted spend campaigns found.</td></tr>
                ) : (
                  wastedSpendCampaigns.map((campaign, index) => (
                    <tr key={index} className="border-b hover:bg-red-25">
                      <td className="py-2 px-2 font-medium">{campaign.campaign}</td>
                      <td className="py-2 px-2 text-red-600 font-semibold">{formatCurrency(campaign.spend)}</td>
                      <td className="py-2 px-2">{campaign.impressions}</td>
                      <td className="py-2 px-2">{campaign.clicks}</td>
                      <td className="py-2 px-2">{campaign.orders}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Remove the Daily Performance Summary table since dates are not needed */}
    </div>
  );
}