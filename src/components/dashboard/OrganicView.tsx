import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { FilterableTable } from '../ui/FilterableTable';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Leaf, ShoppingCart, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export function OrganicView() {
  const { state } = useApp();
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Calculate organic metrics
  const totalSales = state.businessReports.reduce((sum, item) => sum + item.sales, 0);
  const ppcSales = state.searchTermReports.reduce((sum, item) => sum + item.sales, 0);
  const organicSales = Math.max(0, totalSales - ppcSales);
  const totalSessions = state.businessReports.reduce((sum, item) => sum + item.sessions, 0);
  const totalUnits = state.businessReports.reduce((sum, item) => sum + item.unitsOrdered, 0);
  
  // Estimate organic units (assuming PPC contributes proportionally to its sales)
  const organicUnits = totalSales > 0 ? Math.round(totalUnits * (organicSales / totalSales)) : 0;
  
  const avgCVR = totalSessions > 0 ? (organicUnits / totalSessions) * 100 : 0;
  const organicCVR = organicSales > 0 ? (organicUnits / totalSessions) * 100 : 0;
  const salesPerSession = totalSessions > 0 ? organicSales / totalSessions : 0;

  // Prepare Organic-only metrics data
  const organicMetricsData = [
    {
      metric: 'Sales',
      value: organicSales
    },
    {
      metric: 'Units',
      value: organicUnits
    },
    {
      metric: 'CVR (%)',
      value: organicCVR
    },
    {
      metric: 'Sales per Session',
      value: salesPerSession
    }
  ];

  const kpis = [
    {
      title: 'Organic Sales',
      value: organicSales,
      format: 'currency' as const,
      icon: <Leaf className="w-6 h-6" />,
      extra: (
        <div className="inline-flex items-center mt-1 text-green-700 bg-green-100 rounded px-2 py-0.5 text-xs font-semibold">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          100% Organic
        </div>
      )
    },
    {
      title: 'Organic Units',
      value: organicUnits,
      format: 'number' as const,
      change: '+12.8%',
      icon: <ShoppingCart className="w-6 h-6" />
    },
    {
      title: 'Sessions',
      value: totalSessions,
      format: 'number' as const,
      change: '+6.1%',
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Conversion Rate',
      value: avgCVR,
      format: 'percentage' as const,
      change: '+3.4%',
      icon: <TrendingUp className="w-6 h-6" />
    }
  ];

  // Calculate top organic products
  const topOrganicProducts = state.businessReports.reduce((acc, br) => {
    const ppcSalesForDay = state.searchTermReports
      .filter(str => str.date === br.date)
      .reduce((sum, str) => sum + str.sales, 0);

    const organicSalesForDay = Math.max(0, br.sales - ppcSalesForDay);

    const sku = br.sku || `SKU-${Math.random().toString(36).substr(2, 9)}`;
    // Find existing product by SKU
    let existingProduct = acc.find(p => p.asin === sku);
    if (existingProduct) {
      existingProduct.organicSales += organicSalesForDay;
      existingProduct.unitsSold += Math.round(br.unitsOrdered * (organicSalesForDay / br.sales || 0));
      existingProduct.sessions += br.sessions;
      // Only set productName if it hasn't been set and br.title exists
      if ((!existingProduct.productName || existingProduct.productName === sku) && br.title) {
        existingProduct.productName = br.title;
      }
    } else {
      acc.push({
        asin: sku,
        productName: br.title || sku,
        organicSales: organicSalesForDay,
        unitsSold: Math.round(br.unitsOrdered * (organicSalesForDay / br.sales || 0)),
        sessions: br.sessions,
        cvr: br.sessions > 0 ? ((br.unitsOrdered * (organicSalesForDay / br.sales || 0)) / br.sessions) * 100 : 0
      });
    }
    return acc;
  }, [] as Array<{
    asin: string;
    productName: string;
    organicSales: number;
    unitsSold: number;
    sessions: number;
    cvr: number;
  }>)
  .sort((a, b) => b.organicSales - a.organicSales);

  // Show top 10 initially, all on "See More"
  const displayedProducts = showAllProducts ? topOrganicProducts : topOrganicProducts.slice(0, 10);
  const hasMoreProducts = topOrganicProducts.length > 10;

  return (
    <div id="organic-content" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            format={kpi.format}
            change={kpi.change}
            icon={kpi.icon}
            extra={kpi.extra}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Organic Performance Metrics</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={organicMetricsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value, name) => [
                  typeof value === 'number' && value > 1000 
                    ? formatCurrency(Number(value)) 
                    : typeof value === 'number' 
                      ? value.toFixed(2) 
                      : value,
                  'Organic'
                ]}
              />
              <Bar dataKey="value" fill="#34A853" name="Organic" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-lg font-semibold">Top Organic Products</h3>
        </CardHeader>
        <CardContent>
          {topOrganicProducts.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">No Business Report data uploaded yet.</div>
          ) : (
            <>
              <FilterableTable
                title=""
                data={displayedProducts}
                columns={[
                  { key: 'asin', label: 'SKU', type: 'text' },
                  { key: 'productName', label: 'Product Name', type: 'text' },
                  { key: 'organicSales', label: 'Organic Sales', type: 'currency' },
                  { key: 'unitsSold', label: 'Units Sold', type: 'number' },
                  { key: 'sessions', label: 'Sessions', type: 'number' },
                  { key: 'cvr', label: 'CVR (%)', type: 'percentage' }
                ]}
                maxRows={showAllProducts ? 1000 : 10}
                showFilters={false}
              />
              {hasMoreProducts && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="flex items-center gap-2"
                  >
                    {showAllProducts ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        See More ({topOrganicProducts.length - 10} more products)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}