import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { FilterableTable } from '../ui/FilterableTable';
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
        <CardContent>
          <FilterableTable
            title="Search Term Analysis"
            data={searchTermAnalysis.map(term => {
              let status = '';
              if (term.sales === 0) status = 'Wasted';
              else if (term.acos > acosThreshold) status = 'High ACoS';
              else status = 'Good';
              return { ...term, status };
            })}
            columns={[
              { key: 'searchTerm', label: 'Search Term', type: 'text' },
              { key: 'campaign', label: 'Campaign', type: 'text' },
              { key: 'spend', label: 'Spend', type: 'currency' },
              { key: 'sales', label: 'Sales', type: 'currency' },
              { key: 'acos', label: 'ACoS', type: 'percentage' },
              { key: 'ctr', label: 'CTR', type: 'percentage' },
              { key: 'cvr', label: 'CVR', type: 'percentage' },
              { key: 'status', label: 'Status', type: 'text' }
            ]}
            maxRows={50}
            showFilters={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}