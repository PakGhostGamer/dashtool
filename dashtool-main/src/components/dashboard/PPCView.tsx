import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { FilterableTable } from '../ui/FilterableTable';
import { Tooltip } from '../ui/Tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Target, MousePointer, Eye, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateACoS, calculateROAS, calculateCTR, calculateCVR, formatCurrency, formatPercentage } from '../../utils/calculations';
import { getTooltipContent, formatTooltipContent } from '../../utils/tooltipData';

export function PPCView() {
  const { state } = useApp();
  const [asinFilter, setAsinFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [searchTermFilter, setSearchTermFilter] = useState('');

  // Get unique ASINs from business reports for filtering
  const uniqueAsins = Array.from(new Set(state.businessReports.map(br => br.sku))).sort();
  const uniqueCampaigns = Array.from(new Set(state.searchTermReports.map(str => str.campaign))).sort();

  // Filter PPC data based on multiple criteria
  const filteredPPCData = state.searchTermReports.filter(item => {
    // Campaign filter
    if (campaignFilter && item.campaign !== campaignFilter) {
      return false;
    }

    // Search term filter
    if (searchTermFilter && !item.searchTerm.toLowerCase().includes(searchTermFilter.toLowerCase())) {
      return false;
    }

    // ASIN filter - show all PPC data but focus on dates with ASIN activity
    // This is more permissive and allows users to see the full PPC context
    if (asinFilter && state.businessReports.length > 0) {
      // Always include PPC data when ASIN filter is applied
      // The ASIN filter is used for highlighting/focusing, not strict filtering
      return true;
    }

    return true;
  });

  // Get ASIN activity dates for highlighting
  const asinActivityDates = asinFilter && state.businessReports.length > 0 
    ? state.businessReports
        .filter(br => br.sku === asinFilter)
        .map(br => br.date)
    : [];

  // Calculate PPC KPIs using filtered data
  const ppcSales = filteredPPCData.reduce((sum, item) => sum + item.sales, 0);
  const ppcSpend = filteredPPCData.reduce((sum, item) => sum + item.spend, 0);
  const totalOrders = filteredPPCData.reduce((sum, item) => sum + item.orders, 0);
  const totalImpressions = filteredPPCData.reduce((sum, item) => sum + item.impressions, 0);
  const totalClicks = filteredPPCData.reduce((sum, item) => sum + item.clicks, 0);

  const acos = calculateACoS(ppcSpend, ppcSales);
  const roas = calculateROAS(ppcSales, ppcSpend);
  const ctr = calculateCTR(totalClicks, totalImpressions);
  const cvr = calculateCVR(totalOrders, totalClicks);

  // Prepare chart data using filtered data
  const dailyPPCData = filteredPPCData.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing.spend += item.spend;
      existing.sales += item.sales;
    } else {
      acc.push({
        date: item.date,
        spend: item.spend,
        sales: item.sales,
        acos: 0
      });
    }
    return acc;
  }, [] as any[]);

  // Calculate daily ACoS
  dailyPPCData.forEach(day => {
    day.acos = calculateACoS(day.spend, day.sales);
  });

  // Group data by campaign for analysis
  const campaignData = filteredPPCData.reduce((acc, item) => {
    if (!acc[item.campaign]) {
      acc[item.campaign] = {
        campaign: item.campaign,
        spend: 0,
        sales: 0,
        orders: 0,
        impressions: 0,
        clicks: 0,
        acos: 0,
        roas: 0,
        ctr: 0,
        cvr: 0
      };
    }
    acc[item.campaign].spend += item.spend;
    acc[item.campaign].sales += item.sales;
    acc[item.campaign].orders += item.orders;
    acc[item.campaign].impressions += item.impressions;
    acc[item.campaign].clicks += item.clicks;
    return acc;
  }, {} as Record<string, any>);

  // Calculate metrics for each campaign
  Object.values(campaignData).forEach(campaign => {
    campaign.acos = calculateACoS(campaign.spend, campaign.sales);
    campaign.roas = calculateROAS(campaign.sales, campaign.spend);
    campaign.ctr = calculateCTR(campaign.clicks, campaign.impressions);
    campaign.cvr = calculateCVR(campaign.orders, campaign.clicks);
    campaign.avgCPC = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0;
    // Bid is not available in SearchTermData, so set avgBid to null
    campaign.avgBid = null;
  });

  // Group data by search term for analysis
  const searchTermData = filteredPPCData.reduce((acc, item) => {
    if (!acc[item.searchTerm]) {
      acc[item.searchTerm] = {
        searchTerm: item.searchTerm,
        spend: 0,
        sales: 0,
        orders: 0,
        impressions: 0,
        clicks: 0,
        acos: 0,
        roas: 0,
        ctr: 0,
        cvr: 0
      };
    }
    acc[item.searchTerm].spend += item.spend;
    acc[item.searchTerm].sales += item.sales;
    acc[item.searchTerm].orders += item.orders;
    acc[item.searchTerm].impressions += item.impressions;
    acc[item.searchTerm].clicks += item.clicks;
    return acc;
  }, {} as Record<string, any>);

  // Calculate metrics for each search term
  Object.values(searchTermData).forEach(term => {
    term.acos = calculateACoS(term.spend, term.sales);
    term.roas = calculateROAS(term.sales, term.spend);
    term.ctr = calculateCTR(term.clicks, term.impressions);
    term.cvr = calculateCVR(term.orders, term.clicks);
    term.avgCPC = term.clicks > 0 ? term.spend / term.clicks : 0;
    // Bid is not available in SearchTermData, so set avgBid to null
    term.avgBid = null;
  });

  // Sort campaigns by performance with new criteria
  const campaignArray = Object.values(campaignData);
  // Good: ACoS < 25% and sales > 0
  const highPerformingCampaigns = campaignArray
    .filter(c => c.sales > 0 && c.acos < 25)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
  // Bad: (ACoS >= 25% and sales > 0) or (spend > 0 and sales == 0)
  const lowPerformingCampaigns = campaignArray
    .filter(c => (c.sales > 0 && c.acos >= 25) || (c.spend > 0 && c.sales === 0))
    .sort((a, b) => b.acos - a.acos || b.spend - a.spend)
    .slice(0, 10);
  // High ACoS: top by ACoS, only if sales > 0 and ACoS > 35%
  const highAcosCampaigns = campaignArray
    .filter(c => c.spend > 0 && c.sales > 0 && c.acos > 35)
    .sort((a, b) => b.acos - a.acos)
    .slice(0, 10);
  // Low ACoS: lowest by ACoS, only if sales > 0 and ACoS <= 35%
  const lowAcosCampaigns = campaignArray
    .filter(c => c.spend > 0 && c.sales > 0 && c.acos <= 35)
    .sort((a, b) => a.acos - b.acos)
    .slice(0, 10);

  // Sort search terms by performance with new criteria
  const searchTermArray = Object.values(searchTermData);
  // Good: ACoS < 25% and sales > 0
  const highPerformingSearchTerms = searchTermArray
    .filter(s => s.sales > 0 && s.acos < 25)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
  // Bad: (ACoS >= 25% and sales > 0) or (spend > 0 and sales == 0)
  const lowPerformingSearchTerms = searchTermArray
    .filter(s => (s.sales > 0 && s.acos >= 25) || (s.spend > 0 && s.sales === 0))
    .sort((a, b) => b.acos - a.acos || b.spend - a.spend)
    .slice(0, 10);

  // Calculate wasted spend campaigns
  const wastedSpendCampaigns = campaignArray
    .filter(c => c.spend > 0 && c.sales === 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  // Calculate total sales for percentage
  const totalSales = state.businessReports.reduce((sum, item) => sum + item.sales, 0);
  const organicSales = Math.max(0, totalSales - ppcSales);
  
  // Additional metrics for PPC KPI cards
  const totalSessions = state.businessReports.reduce((sum, item) => sum + item.sessions, 0);
  const totalUnits = state.businessReports.reduce((sum, item) => sum + item.unitsOrdered, 0);
  const conversionRate = totalSessions > 0 ? (totalUnits / totalSessions) * 100 : 0;
  const avgOrderValue = totalUnits > 0 ? totalSales / totalUnits : 0;

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
      title: 'ACoS',
      value: acos,
      format: 'percentage' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-blue-700 bg-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {roas.toFixed(2)} ROAS
        </div>
      )
    },
    {
      title: 'CTR',
      value: ctr,
      format: 'percentage' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      extra: (
        <div className="inline-flex items-center mt-1 text-purple-700 bg-purple-100 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-sm">
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {cvr.toFixed(2)}% CVR
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
    }
  ];

  return (
    <div id="ppc-content" className="space-y-6">
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Replace Spend vs Sales Over Time with Wasted Spend Campaigns Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-red-700 flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3"></div>
              💸 Wasted Spend Campaigns
            </h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-red-50">
                    <th className="text-left py-2 px-2 font-medium">
                      <Tooltip content="A group of ad groups that share the same budget and targeting settings. Data Source: Amazon Search Term Reports - Campaign column">
                        <span className="cursor-help hover:text-gray-800 transition-colors">Campaign</span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-2 px-2 font-medium">
                      <Tooltip content="The total amount spent on advertising campaigns. Data Source: Amazon Search Term Reports - Spend column">
                        <span className="cursor-help hover:text-gray-800 transition-colors">Spend</span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-2 px-2 font-medium">
                      <Tooltip content="The number of times your ads were shown to potential customers. Data Source: Amazon Search Term Reports - Impressions column">
                        <span className="cursor-help hover:text-gray-800 transition-colors">Impressions</span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-2 px-2 font-medium">
                      <Tooltip content="The number of times customers clicked on your ads. Data Source: Amazon Search Term Reports - Clicks column">
                        <span className="cursor-help hover:text-gray-800 transition-colors">Clicks</span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-2 px-2 font-medium">
                      <Tooltip content="Orders directly attributed to paid advertising campaigns. Data Source: Amazon Search Term Reports - Orders column">
                        <span className="cursor-help hover:text-gray-800 transition-colors">Orders</span>
                      </Tooltip>
                    </th>
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

        {/* Keep ACoS Trend graph as is */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-3"></div>
              ACoS Trend
            </h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyPPCData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                <Line type="monotone" dataKey="acos" stroke="#1B73E8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full mr-3"></div>
            PPC Performance Analysis
          </h3>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Highlight ASIN Activity</label>
              <select 
                value={asinFilter} 
                onChange={e => setAsinFilter(e.target.value)} 
                className="border px-3 py-2 rounded text-sm w-full max-w-xs"
              >
                <option value="">No ASIN Highlight</option>
                {uniqueAsins.map(asin => (
                  <option key={asin} value={asin}>{asin}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Campaign</label>
              <select 
                value={campaignFilter} 
                onChange={e => setCampaignFilter(e.target.value)} 
                className="border px-3 py-2 rounded text-sm w-full max-w-xs"
              >
                <option value="">All Campaigns</option>
                {uniqueCampaigns.map(campaign => (
                  <option key={campaign} value={campaign}>{campaign}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search Term</label>
              <input 
                type="text" 
                value={searchTermFilter} 
                onChange={e => setSearchTermFilter(e.target.value)} 
                placeholder="Search terms..." 
                className="border px-3 py-2 rounded text-sm w-full max-w-xs"
              />
            </div>
            <div>
              <button
                onClick={() => {
                  setAsinFilter('');
                  setCampaignFilter('');
                  setSearchTermFilter('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Summary */}
          {filteredPPCData.length > 0 && (
            <div className="text-sm text-gray-600 mb-6 p-4 bg-gray-50 rounded">
              Showing {filteredPPCData.length} records
              {asinFilter && ` (highlighting dates where ASIN ${asinFilter} was active)`}
              {campaignFilter && ` in campaign: ${campaignFilter}`}
              {searchTermFilter && ` containing: "${searchTermFilter}"`}
            </div>
          )}

          {/* Campaign Performance Tables */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* High Performing Campaigns */}
            <Card>
              <CardHeader>
                <h4 className="text-md font-semibold text-green-700">🏆 High Performing Campaigns</h4>
              </CardHeader>
              <CardContent>
                <FilterableTable
                  title=""
                  data={highPerformingCampaigns}
                  columns={[
                    { key: 'campaign', label: 'Campaign', type: 'text' },
                    { key: 'sales', label: 'Sales', type: 'currency' },
                    { key: 'spend', label: 'Spend', type: 'currency' },
                    { key: 'acos', label: 'ACoS', type: 'percentage' },
                    { key: 'roas', label: 'ROAS', type: 'number' },
                    { key: 'avgCPC', label: 'Avg CPC', type: 'currency' },
                    { key: 'avgBid', label: 'Avg Bid', type: 'currency' }
                  ]}
                  maxRows={20}
                  showFilters={false}
                />
              </CardContent>
            </Card>

            {/* Low Performing Campaigns */}
            <Card>
              <CardHeader>
                <h4 className="text-md font-semibold text-red-700">⚠️ Low Performing Campaigns</h4>
              </CardHeader>
              <CardContent>
                <FilterableTable
                  title=""
                  data={lowPerformingCampaigns}
                  columns={[
                    { key: 'campaign', label: 'Campaign', type: 'text' },
                    { key: 'sales', label: 'Sales', type: 'currency' },
                    { key: 'spend', label: 'Spend', type: 'currency' },
                    { key: 'acos', label: 'ACoS', type: 'percentage' },
                    { key: 'roas', label: 'ROAS', type: 'number' },
                    { key: 'avgCPC', label: 'Avg CPC', type: 'currency' },
                    { key: 'avgBid', label: 'Avg Bid', type: 'currency' }
                  ]}
                  maxRows={20}
                  showFilters={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* ACoS Performance Tables */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* High ACoS Campaigns */}
            <Card>
              <CardHeader>
                <h4 className="text-md font-semibold text-orange-700">🔥 High ACoS Campaigns</h4>
              </CardHeader>
              <CardContent>
                <FilterableTable
                  title=""
                  data={highAcosCampaigns}
                  columns={[
                    { key: 'campaign', label: 'Campaign', type: 'text' },
                    { key: 'acos', label: 'ACoS', type: 'percentage' },
                    { key: 'sales', label: 'Sales', type: 'currency' },
                    { key: 'spend', label: 'Spend', type: 'currency' },
                    { key: 'roas', label: 'ROAS', type: 'number' },
                    { key: 'avgCPC', label: 'Avg CPC', type: 'currency' },
                    { key: 'avgBid', label: 'Avg Bid', type: 'currency' }
                  ]}
                  maxRows={20}
                  showFilters={false}
                />
              </CardContent>
            </Card>

            {/* Low ACoS Campaigns */}
            <Card>
              <CardHeader>
                <h4 className="text-md font-semibold text-blue-700">💎 Low ACoS Campaigns</h4>
              </CardHeader>
              <CardContent>
                <FilterableTable
                  title=""
                  data={lowAcosCampaigns}
                  columns={[
                    { key: 'campaign', label: 'Campaign', type: 'text' },
                    { key: 'acos', label: 'ACoS', type: 'percentage' },
                    { key: 'sales', label: 'Sales', type: 'currency' },
                    { key: 'spend', label: 'Spend', type: 'currency' },
                    { key: 'roas', label: 'ROAS', type: 'number' },
                    { key: 'avgCPC', label: 'Avg CPC', type: 'currency' },
                    { key: 'avgBid', label: 'Avg Bid', type: 'currency' }
                  ]}
                  maxRows={20}
                  showFilters={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Search Term Performance Tables */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* High Performing Search Terms */}
            <Card>
              <CardHeader>
                <h4 className="text-md font-semibold text-green-700">🎯 High Performing Search Terms</h4>
              </CardHeader>
              <CardContent>
                <FilterableTable
                  title=""
                  data={highPerformingSearchTerms}
                  columns={[
                    { key: 'searchTerm', label: 'Search Term', type: 'text' },
                    { key: 'sales', label: 'Sales', type: 'currency' },
                    { key: 'spend', label: 'Spend', type: 'currency' },
                    { key: 'acos', label: 'ACoS', type: 'percentage' },
                    { key: 'cvr', label: 'CVR', type: 'percentage' },
                    { key: 'avgCPC', label: 'Avg CPC', type: 'currency' },
                    { key: 'avgBid', label: 'Avg Bid', type: 'currency' }
                  ]}
                  maxRows={20}
                  showFilters={false}
                />
              </CardContent>
            </Card>

            {/* Low Performing Search Terms */}
            <Card>
              <CardHeader>
                <h4 className="text-md font-semibold text-red-700">📉 Low Performing Search Terms</h4>
              </CardHeader>
              <CardContent>
                <FilterableTable
                  title=""
                  data={lowPerformingSearchTerms}
                  columns={[
                    { key: 'searchTerm', label: 'Search Term', type: 'text' },
                    { key: 'sales', label: 'Sales', type: 'currency' },
                    { key: 'spend', label: 'Spend', type: 'currency' },
                    { key: 'acos', label: 'ACoS', type: 'percentage' },
                    { key: 'cvr', label: 'CVR', type: 'percentage' },
                    { key: 'avgCPC', label: 'Avg CPC', type: 'currency' },
                    { key: 'avgBid', label: 'Avg Bid', type: 'currency' }
                  ]}
                  maxRows={20}
                  showFilters={false}
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}