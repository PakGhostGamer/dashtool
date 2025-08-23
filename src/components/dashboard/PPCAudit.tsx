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
  const searchTermAnalysis = state.searchTermReports.map(item => {
    const acos = calculateACoS(item.spend, item.sales);
    const roas = calculateROAS(item.sales, item.spend);
    const ctr = calculateCTR(item.clicks, item.impressions);
    const cvr = calculateCVR(item.orders, item.clicks);
    
    let status = '';
    if (item.sales === 0) {
      status = 'Wasted';
    } else if (acos > acosThreshold) {
      status = 'High ACoS';
    } else if (acos > 15) {
      status = 'Moderate';
    } else {
      status = 'Excellent';
    }
    
    return {
      ...item,
      acos,
      roas,
      ctr,
      cvr,
      status
    };
  });

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

  const downloadSearchTermsCSV = () => {
    // Helper function to escape CSV values
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Helper function to format numbers
    const formatNumber = (value: number) => {
      if (typeof value === 'number') {
        return value.toFixed(2);
      }
      return value;
    };

    const csvContent = [
      ['Search Term', 'Campaign', 'Spend', 'Sales', 'Orders', 'Clicks', 'Impressions', 'ACoS %', 'ROAS', 'CTR %', 'CVR %', 'Status'],
      ...searchTermAnalysis.map(term => [
        escapeCSV(term.searchTerm),
        escapeCSV(term.campaign),
        formatNumber(term.spend),
        formatNumber(term.sales),
        term.orders,
        term.clicks,
        term.impressions,
        formatNumber(term.acos),
        formatNumber(term.roas),
        formatNumber(term.ctr),
        formatNumber(term.cvr),
        escapeCSV(term.status)
      ])
    ];
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_terms_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    <div key="tooltip">
                      <div className="font-semibold">{props.payload.name}</div>
                      <div>Spend: {formatCurrency(Number(value))}</div>
                      <div>Percentage: {((props.payload.percent || 0) * 100).toFixed(1)}%</div>
                    </div>
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Campaign Legend */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Campaign Legend:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {pieData.slice(0, 10).map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate" title={entry.name}>
                      {entry.name.length > 20 ? entry.name.substring(0, 20) + '...' : entry.name}
                    </span>
                    <span className="text-gray-500">
                      ({((entry.value / pieData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
                {pieData.length > 10 && (
                  <div className="text-gray-500 italic">
                    +{pieData.length - 10} more campaigns
                  </div>
                )}
              </div>
            </div>
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

      {/* Comprehensive Search Term Analysis with CSV Download */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">📊 Complete Search Term Analysis</h3>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-600 text-right">
                <div>📥 Download includes all search terms</div>
                <div>with performance metrics & status</div>
              </div>
              <Button
                onClick={() => {
                  downloadSearchTermsCSV();
                  // Show success message
                  alert('CSV file downloaded successfully! 📥');
                }}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                📥 Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {searchTermAnalysis.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">No Search Term Report data uploaded yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{searchTermAnalysis.length}</div>
                  <div className="text-sm text-gray-600">Total Terms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {searchTermAnalysis.filter(t => t.sales > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Converting Terms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {searchTermAnalysis.filter(t => t.sales === 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Zero Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {searchTermAnalysis.filter(t => t.acos > acosThreshold).length}
                  </div>
                  <div className="text-sm text-gray-600">High ACoS</div>
                </div>
              </div>
              
              {/* Performance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {formatCurrency(searchTermAnalysis.reduce((sum, t) => sum + t.spend, 0))}
                  </div>
                  <div className="text-sm text-blue-600">Total Spend</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(searchTermAnalysis.reduce((sum, t) => sum + t.sales, 0))}
                  </div>
                  <div className="text-sm text-green-600">Total Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">
                    {formatPercentage(searchTermAnalysis.reduce((sum, t) => sum + t.acos, 0) / searchTermAnalysis.length)}
                  </div>
                  <div className="text-sm text-purple-600">Avg ACoS</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-700">
                    {searchTermAnalysis.reduce((sum, t) => sum + t.orders, 0)}
                  </div>
                  <div className="text-sm text-indigo-600">Total Orders</div>
                </div>
              </div>
              
              {/* Status Categories Explanation */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">📊 Status Categories:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700">Excellent: ACoS ≤ 15%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-700">Moderate: ACoS 15-25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-700">High ACoS: ACoS &gt; 25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700">Wasted: Zero Sales</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Table */}
              <FilterableTable
                title=""
                data={searchTermAnalysis}
                columns={[
                  { key: 'searchTerm', label: 'Search Term', type: 'text' },
                  { key: 'campaign', label: 'Campaign', type: 'text' },
                  { key: 'spend', label: 'Spend', type: 'currency' },
                  { key: 'sales', label: 'Sales', type: 'currency' },
                  { key: 'orders', label: 'Orders', type: 'number' },
                  { key: 'clicks', label: 'Clicks', type: 'number' },
                  { key: 'impressions', label: 'Impressions', type: 'number' },
                  { key: 'acos', label: 'ACoS', type: 'percentage' },
                  { key: 'roas', label: 'ROAS', type: 'number' },
                  { key: 'ctr', label: 'CTR', type: 'percentage' },
                  { key: 'cvr', label: 'CVR', type: 'percentage' },
                  { key: 'status', label: 'Status', type: 'status' }
                ]}
                maxRows={100}
                showFilters={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}