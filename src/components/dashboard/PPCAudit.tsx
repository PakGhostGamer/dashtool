import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { Button } from '../ui/Button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, Target, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateACoS, calculateROAS, calculateCTR, calculateCVR, formatCurrency, formatPercentage } from '../../utils/calculations';

export function PPCAudit() {
  const { state } = useApp();
  const [acosThreshold, setAcosThreshold] = useState(25);
  const [spendThreshold, setSpendThreshold] = useState(100);

  // Filter state
  const [campaignFilter, setCampaignFilter] = useState('');
  const [searchTermFilter, setSearchTermFilter] = useState('');
  const [acosMin, setAcosMin] = useState('');
  const [acosMax, setAcosMax] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Calculate audit metrics
  const totalSpend = state.searchTermReports.reduce((sum, item) => sum + item.spend, 0);
  const totalSales = state.businessReports.reduce((sum, item) => sum + item.sales, 0);
  const ppcSales = state.searchTermReports.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = state.searchTermReports.reduce((sum, item) => sum + item.orders, 0);
  const totalClicks = state.searchTermReports.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = state.searchTermReports.reduce((sum, item) => sum + item.impressions, 0);

  const overallACoS = calculateACoS(totalSpend, ppcSales);
  const overallROAS = calculateROAS(ppcSales, totalSpend);
  const overallCTR = calculateCTR(totalClicks, totalImpressions);
  const overallCVR = calculateCVR(totalOrders, totalClicks);

  // Analyze search terms
  const searchTermAnalysis = state.searchTermReports.map(item => ({
    ...item,
    acos: calculateACoS(item.spend, item.sales),
    roas: calculateROAS(item.sales, item.spend),
    ctr: calculateCTR(item.clicks, item.impressions),
    cvr: calculateCVR(item.orders, item.clicks)
  }));

  // Identify problem areas
  const highACoSTerms = searchTermAnalysis.filter(item => item.acos > acosThreshold);
  const zeroSaleTerms = searchTermAnalysis.filter(item => item.sales === 0 && item.spend > 0);
  const wastedSpend = zeroSaleTerms.reduce((sum, item) => sum + item.spend, 0);

  // Campaign analysis
  const campaignData = state.searchTermReports.reduce((acc, item) => {
    const existing = acc.find(c => c.campaign === item.campaign);
    if (existing) {
      existing.spend += item.spend;
      existing.sales += item.sales;
      existing.orders += item.orders;
      existing.clicks += item.clicks;
      existing.impressions += item.impressions;
    } else {
      acc.push({
        campaign: item.campaign,
        spend: item.spend,
        sales: item.sales,
        orders: item.orders,
        clicks: item.clicks,
        impressions: item.impressions
      });
    }
    return acc;
  }, [] as any[]);

  campaignData.forEach(campaign => {
    campaign.acos = calculateACoS(campaign.spend, campaign.sales);
    campaign.roas = calculateROAS(campaign.sales, campaign.spend);
    campaign.ctr = calculateCTR(campaign.clicks, campaign.impressions);
    campaign.cvr = calculateCVR(campaign.orders, campaign.clicks);
  });

  // Pie chart data for spend by campaign
  const pieData = campaignData.map(campaign => ({
    name: campaign.campaign,
    value: campaign.spend
  }));

  const COLORS = ['#1B73E8', '#34A853', '#EA4335', '#FBBC04', '#9C27B0'];

  const auditKPIs = [
    {
      title: 'Total PPC Spend',
      value: totalSpend,
      format: 'currency' as const,
      icon: <Target className="w-6 h-6" />
    },
    {
      title: 'Overall ACoS',
      value: overallACoS,
      format: 'percentage' as const,
      icon: <TrendingDown className="w-6 h-6" />
    },
    {
      title: 'Wasted Spend',
      value: wastedSpend,
      format: 'currency' as const,
      icon: <AlertTriangle className="w-6 h-6" />
    },
    {
      title: 'High ACoS Terms',
      value: highACoSTerms.length,
      format: 'number' as const,
      icon: <Search className="w-6 h-6" />
    }
  ];

  // Unique campaigns for dropdown
  const uniqueCampaigns = Array.from(new Set(state.searchTermReports.map(r => r.campaign)));

  // Filtered search term analysis
  const filteredSearchTermAnalysis = searchTermAnalysis.filter(row => {
    // Campaign filter
    if (campaignFilter && row.campaign !== campaignFilter) return false;
    // Search term filter
    if (searchTermFilter && !row.searchTerm.toLowerCase().includes(searchTermFilter.toLowerCase())) return false;
    // ACoS filter
    if (acosMin && row.acos < parseFloat(acosMin)) return false;
    if (acosMax && row.acos > parseFloat(acosMax)) return false;
    // Status filter
    let status = '';
    if (row.sales === 0) status = 'Wasted';
    else if (row.acos > acosThreshold) status = 'High ACoS';
    else status = 'Good';
    if (statusFilter && status !== statusFilter) return false;
    return true;
  });

  return (
    <div id="ppcaudit-content" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {auditKPIs.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            format={kpi.format}
            icon={kpi.icon}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Spend by Campaign</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Campaign Performance</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campaign" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="acos" fill="#EA4335" name="ACoS %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Audit Thresholds</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                High ACoS Threshold (%)
              </label>
              <input
                type="number"
                value={acosThreshold}
                onChange={(e) => setAcosThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Spend Threshold ($)
              </label>
              <input
                type="number"
                value={spendThreshold}
                onChange={(e) => setSpendThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Key Insights</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">Wasted Spend Alert</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(wastedSpend)} spent on {zeroSaleTerms.length} terms with zero sales
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700">High ACoS Warning</p>
                  <p className="text-sm text-gray-600">
                    {highACoSTerms.length} search terms exceed {acosThreshold}% ACoS threshold
                  </p>
                </div>
              </div>
              {campaignData.length > 0 && (
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Best Performer</p>
                    <p className="text-sm text-gray-600">
                      {campaignData.sort((a, b) => a.acos - b.acos)[0]?.campaign} has the lowest ACoS
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Search Term Analysis</h3>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Campaign</label>
              <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} className="border px-2 py-1 rounded text-sm">
                <option value="">All</option>
                {uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search Term</label>
              <input type="text" value={searchTermFilter} onChange={e => setSearchTermFilter(e.target.value)} placeholder="Search..." className="border px-2 py-1 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ACoS Min</label>
              <input type="number" value={acosMin} onChange={e => setAcosMin(e.target.value)} placeholder="%" className="border px-2 py-1 rounded text-sm w-20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ACoS Max</label>
              <input type="number" value={acosMax} onChange={e => setAcosMax(e.target.value)} placeholder="%" className="border px-2 py-1 rounded text-sm w-20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border px-2 py-1 rounded text-sm">
                <option value="">All</option>
                <option value="Good">Good</option>
                <option value="High ACoS">High ACoS</option>
                <option value="Wasted">Wasted</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Search Term</th>
                  <th className="text-left py-2 px-4 font-medium">Campaign</th>
                  <th className="text-left py-2 px-4 font-medium">Spend</th>
                  <th className="text-left py-2 px-4 font-medium">Sales</th>
                  <th className="text-left py-2 px-4 font-medium">ACoS</th>
                  <th className="text-left py-2 px-4 font-medium">CTR</th>
                  <th className="text-left py-2 px-4 font-medium">CVR</th>
                  <th className="text-left py-2 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSearchTermAnalysis
                  .sort((a, b) => b.spend - a.spend)
                  .slice(0, 20)
                  .map((term, index) => {
                    let status = '';
                    if (term.sales === 0) status = 'Wasted';
                    else if (term.acos > acosThreshold) status = 'High ACoS';
                    else status = 'Good';
                    return (
                      <tr key={index} className={`border-b hover:bg-gray-50 ${
                        status === 'Wasted' ? 'bg-red-50' : status === 'High ACoS' ? 'bg-yellow-100' : 'bg-green-50'
                      }`}>
                        <td className="py-2 px-4">{term.searchTerm}</td>
                        <td className="py-2 px-4">{term.campaign}</td>
                        <td className="py-2 px-4">{formatCurrency(term.spend)}</td>
                        <td className="py-2 px-4">{formatCurrency(term.sales)}</td>
                        <td className="py-2 px-4">
                          <span className={term.acos > acosThreshold ? 'text-red-600 font-medium' : ''}>
                            {formatPercentage(term.acos)}
                          </span>
                        </td>
                        <td className="py-2 px-4">{formatPercentage(term.ctr)}</td>
                        <td className="py-2 px-4">{formatPercentage(term.cvr)}</td>
                        <td className="py-2 px-4">
                          {status === 'Wasted' ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Wasted</span>
                          ) : status === 'High ACoS' ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">High ACoS</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Good</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}