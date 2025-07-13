import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { TrendingUp, TrendingDown, Target, Calendar, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export function PerformanceHeatmap() {
  const { state } = useApp();
  const [selectedMetric, setSelectedMetric] = useState('acos');
  const [viewType, setViewType] = useState('campaign');

  // Prepare campaign performance data
  const campaignData = useMemo(() => {
    const campaignMap = new Map();

    state.searchTermReports.forEach(item => {
      if (!campaignMap.has(item.campaign)) {
        campaignMap.set(item.campaign, {
          campaign: item.campaign,
          spend: 0,
          sales: 0,
          orders: 0,
          impressions: 0,
          clicks: 0,
          searchTerms: new Set()
        });
      }
      
      const campaign = campaignMap.get(item.campaign);
      campaign.spend += item.spend;
      campaign.sales += item.sales;
      campaign.orders += item.orders || 0;
      campaign.impressions += item.impressions || 0;
      campaign.clicks += item.clicks || 0;
      campaign.searchTerms.add(item.searchTerm);
    });

    return Array.from(campaignMap.values()).map(campaign => ({
      ...campaign,
      searchTerms: Array.from(campaign.searchTerms),
      acos: campaign.sales > 0 ? (campaign.spend / campaign.sales) * 100 : 0,
      roas: campaign.spend > 0 ? campaign.sales / campaign.spend : 0,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
      cvr: campaign.clicks > 0 ? (campaign.orders / campaign.clicks) * 100 : 0,
      searchTermCount: campaign.searchTerms.length
    }));
  }, [state.searchTermReports]);

  // Prepare search term performance data
  const searchTermData = useMemo(() => {
    const termMap = new Map();

    state.searchTermReports.forEach(item => {
      if (!termMap.has(item.searchTerm)) {
        termMap.set(item.searchTerm, {
          searchTerm: item.searchTerm,
          spend: 0,
          sales: 0,
          orders: 0,
          impressions: 0,
          clicks: 0,
          campaigns: new Set()
        });
      }
      
      const term = termMap.get(item.searchTerm);
      term.spend += item.spend;
      term.sales += item.sales;
      term.orders += item.orders || 0;
      term.impressions += item.impressions || 0;
      term.clicks += item.clicks || 0;
      term.campaigns.add(item.campaign);
    });

    return Array.from(termMap.values())
      .map(term => ({
        ...term,
        campaigns: Array.from(term.campaigns),
        acos: term.sales > 0 ? (term.spend / term.sales) * 100 : 0,
        roas: term.spend > 0 ? term.sales / term.spend : 0,
        ctr: term.impressions > 0 ? (term.clicks / term.impressions) * 100 : 0,
        cvr: term.clicks > 0 ? (term.orders / term.clicks) * 100 : 0,
        campaignCount: term.campaigns.length
      }))
      .filter(term => term.spend > 0) // Only show terms with spend
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 50); // Top 50 by spend
  }, [state.searchTermReports]);

  // Prepare time-based performance data
  const timeData = useMemo(() => {
    const timeMap = new Map();

    state.searchTermReports.forEach(item => {
      const date = item.date;
      if (!timeMap.has(date)) {
        timeMap.set(date, {
          date,
          spend: 0,
          sales: 0,
          orders: 0,
          impressions: 0,
          clicks: 0
        });
      }
      
      const dayData = timeMap.get(date);
      dayData.spend += item.spend;
      dayData.sales += item.sales;
      dayData.orders += item.orders || 0;
      dayData.impressions += item.impressions || 0;
      dayData.clicks += item.clicks || 0;
    });

    return Array.from(timeMap.values())
      .map(day => ({
        ...day,
        acos: day.sales > 0 ? (day.spend / day.sales) * 100 : 0,
        roas: day.spend > 0 ? day.sales / day.spend : 0,
        ctr: day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0,
        cvr: day.clicks > 0 ? (day.orders / day.clicks) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.searchTermReports]);

  const metrics = [
    { key: 'acos', label: 'ACoS %', format: 'percentage', goodThreshold: 15, badThreshold: 25 },
    { key: 'roas', label: 'ROAS', format: 'number', goodThreshold: 4, badThreshold: 2 },
    { key: 'ctr', label: 'CTR %', format: 'percentage', goodThreshold: 0.5, badThreshold: 0.1 },
    { key: 'cvr', label: 'CVR %', format: 'percentage', goodThreshold: 10, badThreshold: 5 },
    { key: 'spend', label: 'Spend', format: 'currency', goodThreshold: 100, badThreshold: 50 },
    { key: 'sales', label: 'Sales', format: 'currency', goodThreshold: 500, badThreshold: 200 }
  ];

  const selectedMetricData = metrics.find(m => m.key === selectedMetric);

  // Get color intensity based on metric value
  const getColorIntensity = (value: number) => {
    if (!selectedMetricData) return '#f3f4f6';
    
    const { goodThreshold, badThreshold } = selectedMetricData;
    
    // For metrics where lower is better (ACoS, CTR)
    if (selectedMetric === 'acos' || selectedMetric === 'ctr') {
      if (value <= goodThreshold) return '#10b981';
      if (value <= badThreshold) return '#f59e0b';
      return '#ef4444';
    }
    
    // For metrics where higher is better (ROAS, CVR, Sales)
    if (value >= goodThreshold) return '#10b981';
    if (value >= badThreshold) return '#f59e0b';
    return '#ef4444';
  };

  // Get opacity based on spend volume
  const getOpacity = (spend: number) => {
    const maxSpend = Math.max(...campaignData.map(c => c.spend));
    return Math.max(0.3, Math.min(1, spend / maxSpend));
  };

  const renderHeatmap = () => {
    if (viewType === 'campaign') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignData.map(campaign => {
            const value = campaign[selectedMetric as keyof typeof campaign] as number;
            const intensity = getColorIntensity(value);
            const opacity = getOpacity(campaign.spend);
            
            return (
              <Tooltip
                key={campaign.campaign}
                content={
                  <div className="p-2">
                    <div className="font-semibold">{campaign.campaign}</div>
                    <div>Spend: {formatCurrency(campaign.spend)}</div>
                    <div>Sales: {formatCurrency(campaign.sales)}</div>
                    <div>ACoS: {campaign.acos.toFixed(1)}%</div>
                    <div>ROAS: {campaign.roas.toFixed(2)}x</div>
                    <div>CTR: {campaign.ctr.toFixed(2)}%</div>
                    <div>CVR: {campaign.cvr.toFixed(2)}%</div>
                    <div>Search Terms: {campaign.searchTermCount}</div>
                  </div>
                }
              >
                                 <div 
                   className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                   style={{ 
                     backgroundColor: intensity,
                     opacity: opacity
                   }}
                 >
                  <div className="text-white font-semibold text-sm mb-1">
                    {campaign.campaign}
                  </div>
                  <div className="text-white text-lg font-bold">
                    {selectedMetricData?.format === 'currency' ? formatCurrency(value) :
                     selectedMetricData?.format === 'percentage' ? `${value.toFixed(1)}%` :
                     value.toFixed(2)}
                  </div>
                  <div className="text-white text-xs opacity-80">
                    {formatCurrency(campaign.spend)} spent
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      );
    }

    if (viewType === 'searchTerm') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {searchTermData.map(term => {
            const value = term[selectedMetric as keyof typeof term] as number;
            const intensity = getColorIntensity(value);
            const opacity = getOpacity(term.spend);
            
            return (
              <Tooltip
                key={term.searchTerm}
                content={
                  <div className="p-2">
                    <div className="font-semibold">{term.searchTerm}</div>
                    <div>Spend: {formatCurrency(term.spend)}</div>
                    <div>Sales: {formatCurrency(term.sales)}</div>
                    <div>ACoS: {term.acos.toFixed(1)}%</div>
                    <div>ROAS: {term.roas.toFixed(2)}x</div>
                    <div>CTR: {term.ctr.toFixed(2)}%</div>
                    <div>CVR: {term.cvr.toFixed(2)}%</div>
                    <div>Campaigns: {term.campaignCount}</div>
                  </div>
                }
              >
                                 <div 
                   className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                   style={{ 
                     backgroundColor: intensity,
                     opacity: opacity
                   }}
                 >
                  <div className="text-white font-medium text-xs mb-1 truncate">
                    {term.searchTerm}
                  </div>
                  <div className="text-white text-sm font-bold">
                    {selectedMetricData?.format === 'currency' ? formatCurrency(value) :
                     selectedMetricData?.format === 'percentage' ? `${value.toFixed(1)}%` :
                     value.toFixed(2)}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      );
    }

    if (viewType === 'time') {
      return (
        <div className="grid grid-cols-7 gap-2">
          {timeData.map(day => {
            const value = day[selectedMetric as keyof typeof day] as number;
            const intensity = getColorIntensity(value);
            const opacity = getOpacity(day.spend);
            
            return (
              <Tooltip
                key={day.date}
                content={
                  <div className="p-2">
                    <div className="font-semibold">{new Date(day.date).toLocaleDateString()}</div>
                    <div>Spend: {formatCurrency(day.spend)}</div>
                    <div>Sales: {formatCurrency(day.sales)}</div>
                    <div>ACoS: {day.acos.toFixed(1)}%</div>
                    <div>ROAS: {day.roas.toFixed(2)}x</div>
                    <div>CTR: {day.ctr.toFixed(2)}%</div>
                    <div>CVR: {day.cvr.toFixed(2)}%</div>
                  </div>
                }
              >
                                 <div 
                   className="aspect-square rounded-lg cursor-pointer transition-all duration-200 hover:scale-110"
                   style={{ 
                     backgroundColor: intensity,
                     opacity: opacity
                   }}
                 >
                  <div className="text-white text-xs font-bold h-full flex items-center justify-center">
                    {selectedMetricData?.format === 'currency' ? formatCurrency(value).replace('$', '') :
                     selectedMetricData?.format === 'percentage' ? `${value.toFixed(0)}%` :
                     value.toFixed(1)}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Performance Heatmap</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Good</span>
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Average</span>
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Poor</span>
              </div>
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
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="campaign">Campaigns</option>
                <option value="searchTerm">Search Terms</option>
                <option value="time">Time Series</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            {selectedMetricData?.label} Heatmap - {viewType === 'campaign' ? 'Campaigns' : 
             viewType === 'searchTerm' ? 'Search Terms' : 'Time Series'}
          </h3>
        </CardHeader>
        <CardContent>
          {renderHeatmap()}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Performance Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {viewType === 'campaign' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {campaignData.filter(c => c.acos <= 15).length}
                  </div>
                  <div className="text-sm text-gray-600">Good ACoS Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {campaignData.filter(c => c.acos > 15 && c.acos <= 25).length}
                  </div>
                  <div className="text-sm text-gray-600">Average ACoS Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {campaignData.filter(c => c.acos > 25).length}
                  </div>
                  <div className="text-sm text-gray-600">High ACoS Campaigns</div>
                </div>
              </>
            )}
            
            {viewType === 'searchTerm' && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {searchTermData.filter(t => t.acos <= 15).length}
                  </div>
                  <div className="text-sm text-gray-600">Good ACoS Terms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {searchTermData.filter(t => t.acos > 15 && t.acos <= 25).length}
                  </div>
                  <div className="text-sm text-gray-600">Average ACoS Terms</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {searchTermData.filter(t => t.acos > 25).length}
                  </div>
                  <div className="text-sm text-gray-600">High ACoS Terms</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 