import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ComposedChart, Legend, ReferenceLine 
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Target, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export function TrendAnalysis() {
  const { state } = useApp();
  const [selectedMetric, setSelectedMetric] = useState('sales');
  const [timeframe, setTimeframe] = useState('7d');

  // Prepare time series data
  const timeSeriesData = useMemo(() => {
    const dataMap = new Map();

    // Combine business reports and search term reports by date
    state.businessReports.forEach(br => {
      const date = br.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, {
          date,
          sales: 0,
          ppcSales: 0,
          organicSales: 0,
          sessions: 0,
          units: 0,
          ppcSpend: 0,
          impressions: 0,
          clicks: 0,
          orders: 0
        });
      }
      const dayData = dataMap.get(date);
      dayData.sales += br.sales;
      dayData.sessions += br.sessions;
      dayData.units += br.unitsOrdered;
    });

    state.searchTermReports.forEach(str => {
      const date = str.date;
      if (!dataMap.has(date)) {
        dataMap.set(date, {
          date,
          sales: 0,
          ppcSales: 0,
          organicSales: 0,
          sessions: 0,
          units: 0,
          ppcSpend: 0,
          impressions: 0,
          clicks: 0,
          orders: 0
        });
      }
      const dayData = dataMap.get(date);
      dayData.ppcSales += str.sales;
      dayData.ppcSpend += str.spend;
      dayData.impressions += str.impressions || 0;
      dayData.clicks += str.clicks || 0;
      dayData.orders += str.orders || 0;
    });

    // Calculate organic sales and add metrics
    const sortedData = Array.from(dataMap.values())
      .map(day => ({
        ...day,
        organicSales: Math.max(0, day.sales - day.ppcSales),
        acos: day.ppcSales > 0 ? (day.ppcSpend / day.ppcSales) * 100 : 0,
        roas: day.ppcSpend > 0 ? day.ppcSales / day.ppcSpend : 0,
        ctr: day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0,
        cvr: day.clicks > 0 ? (day.orders / day.clicks) * 100 : 0,
        conversionRate: day.sessions > 0 ? (day.units / day.sessions) * 100 : 0,
        revenuePerSession: day.sessions > 0 ? day.sales / day.sessions : 0,
        revenuePerClick: day.clicks > 0 ? day.sales / day.clicks : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sortedData;
  }, [state.businessReports, state.searchTermReports]);

  // Calculate moving averages
  const dataWithMA = useMemo(() => {
    const window = 3; // 3-day moving average
    return timeSeriesData.map((day, index) => {
      const start = Math.max(0, index - window + 1);
      const windowData = timeSeriesData.slice(start, index + 1);
      
      const maSales = windowData.reduce((sum, d) => sum + d.sales, 0) / windowData.length;
      const maPpcSales = windowData.reduce((sum, d) => sum + d.ppcSales, 0) / windowData.length;
      const maOrganicSales = windowData.reduce((sum, d) => sum + d.organicSales, 0) / windowData.length;
      const maAcos = windowData.reduce((sum, d) => sum + d.acos, 0) / windowData.length;

      return {
        ...day,
        maSales,
        maPpcSales,
        maOrganicSales,
        maAcos
      };
    });
  }, [timeSeriesData]);

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    const now = new Date();
    const daysToSubtract = timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;
    const cutoffDate = new Date(now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    
    return dataWithMA.filter(day => new Date(day.date) >= cutoffDate);
  }, [dataWithMA, timeframe]);

  // Calculate trend indicators
  const trendIndicators = useMemo(() => {
    if (filteredData.length < 2) return null;

    const recent = filteredData.slice(-7);
    const previous = filteredData.slice(-14, -7);
    
    if (previous.length === 0) return null;

    const recentAvg = recent.reduce((sum, day) => sum + day[selectedMetric], 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day[selectedMetric], 0) / previous.length;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    const trend = change > 0 ? 'up' : 'down';

    return { change: Math.abs(change), trend };
  }, [filteredData, selectedMetric]);

  const metrics = [
    { key: 'sales', label: 'Total Sales', color: '#10B981', format: 'currency' },
    { key: 'ppcSales', label: 'PPC Sales', color: '#3B82F6', format: 'currency' },
    { key: 'organicSales', label: 'Organic Sales', color: '#34A853', format: 'currency' },
    { key: 'sessions', label: 'Sessions', color: '#8B5CF6', format: 'number' },
    { key: 'units', label: 'Units Sold', color: '#F59E0B', format: 'number' },
    { key: 'acos', label: 'ACoS %', color: '#EF4444', format: 'percentage' },
    { key: 'roas', label: 'ROAS', color: '#06B6D4', format: 'number' },
    { key: 'conversionRate', label: 'Conversion Rate %', color: '#84CC16', format: 'percentage' }
  ];

  const selectedMetricData = metrics.find(m => m.key === selectedMetric);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Trend Analysis</h2>
              {trendIndicators && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  trendIndicators.trend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {trendIndicators.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {trendIndicators.change.toFixed(1)}% vs previous week
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {metrics.map(metric => (
                  <option key={metric.key} value={metric.key}>
                    {metric.label}
                  </option>
                ))}
              </select>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="14d">Last 14 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {selectedMetricData?.label} Trend
          </h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={filteredData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedMetricData?.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={selectedMetricData?.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                tickFormatter={(value) => 
                  selectedMetricData?.format === 'currency' ? formatCurrency(value) :
                  selectedMetricData?.format === 'percentage' ? `${value.toFixed(1)}%` :
                  value.toLocaleString()
                }
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                formatter={(value, name) => [
                  selectedMetricData?.format === 'currency' ? formatCurrency(Number(value)) :
                  selectedMetricData?.format === 'percentage' ? `${Number(value).toFixed(1)}%` :
                  Number(value).toLocaleString(),
                  name
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              />
              <Legend />
              
              {/* Main metric line */}
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={selectedMetricData?.color} 
                strokeWidth={3}
                dot={{ fill: selectedMetricData?.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: selectedMetricData?.color, strokeWidth: 2 }}
              />
              
              {/* Moving average line */}
              <Line 
                type="monotone" 
                dataKey={`ma${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`}
                stroke="#6B7280" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Moving Average"
              />
              
              {/* Area fill for visual appeal */}
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                fill="url(#areaGradient)" 
                stroke="none"
                opacity={0.3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Comparison Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales Breakdown</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="ppcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="organicGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34A853" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34A853" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Area type="monotone" dataKey="ppcSales" stackId="1" fill="url(#ppcGradient)" stroke="#3B82F6" />
                <Area type="monotone" dataKey="organicSales" stackId="1" fill="url(#organicGradient)" stroke="#34A853" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">ACoS vs ROAS</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}x`}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <ReferenceLine y={25} yAxisId="left" stroke="#EF4444" strokeDasharray="3 3" />
                <ReferenceLine y={4} yAxisId="right" stroke="#10B981" strokeDasharray="3 3" />
                <Line yAxisId="left" type="monotone" dataKey="acos" stroke="#EF4444" strokeWidth={2} name="ACoS %" />
                <Bar yAxisId="right" dataKey="roas" fill="#10B981" opacity={0.7} name="ROAS" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Performance Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.slice(0, 8).map(metric => {
              const avgValue = filteredData.reduce((sum, day) => sum + day[metric.key], 0) / filteredData.length;
              const latestValue = filteredData[filteredData.length - 1]?.[metric.key] || 0;
              const change = filteredData.length > 1 ? ((latestValue - avgValue) / avgValue) * 100 : 0;
              
              return (
                <div key={metric.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                  <div className="text-lg font-semibold">
                    {metric.format === 'currency' ? formatCurrency(latestValue) :
                     metric.format === 'percentage' ? `${latestValue.toFixed(1)}%` :
                     latestValue.toLocaleString()}
                  </div>
                  <div className={`text-xs mt-1 ${
                    change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}% vs avg
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 