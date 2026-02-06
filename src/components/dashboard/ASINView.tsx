import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { KPICard } from '../ui/KPICard';
import { FilterableTable } from '../ui/FilterableTable';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, TrendingUp, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, calculateACoS } from '../../utils/calculations';

export function ASINView() {
  const { state, dispatch } = useApp();
  const [selectedSKU, setSelectedSKU] = useState('');
  const [editingCosts, setEditingCosts] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-calculation when cost inputs change
  React.useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [state.costInputs]);

  const uniqueSKUs = [...new Set(state.businessReports.map(br => br.sku))];
  const currentSKU = selectedSKU || uniqueSKUs[0];

  // Get cost data for current SKU from state, or use zero defaults
  const skuCostData = state.costInputs.find(cost => cost.sku === currentSKU);
  const [costData, setCostData] = useState({
    salePrice: skuCostData?.salePrice || 0,
    amazonFees: skuCostData?.amazonFees || 0,
    cogs: skuCostData?.cogs || 0
  });

  // Update cost data when SKU changes
  React.useEffect(() => {
    const skuCostData = state.costInputs.find(cost => cost.sku === currentSKU);
    setCostData({
      salePrice: skuCostData?.salePrice || 0,
      amazonFees: skuCostData?.amazonFees || 0,
      cogs: skuCostData?.cogs || 0
    });
  }, [currentSKU, state.costInputs]);

  // Filter data for selected SKU
  const skuBRData = state.businessReports.filter(br => br.sku === currentSKU);
  
  // Calculate metrics for selected SKU
  const totalSales = skuBRData.reduce((sum, item) => sum + item.sales, 0);
  const totalUnits = skuBRData.reduce((sum, item) => sum + item.unitsOrdered, 0);
  const totalSessions = skuBRData.reduce((sum, item) => sum + item.sessions, 0);
  
  // For ASIN view, we need to estimate PPC data since STR doesn't have SKU mapping
  // We'll use a proportional approach based on the SKU's share of total business
  const totalBusinessSales = state.businessReports.reduce((sum, item) => sum + item.sales, 0);
  const totalPpcSales = state.searchTermReports.reduce((sum, item) => sum + item.sales, 0);
  const totalPpcSpend = state.searchTermReports.reduce((sum, item) => sum + item.spend, 0);
  
  const skuSalesShare = totalBusinessSales > 0 ? totalSales / totalBusinessSales : 0;
  const estimatedPpcSales = totalPpcSales * skuSalesShare;
  const estimatedPpcSpend = totalPpcSpend * skuSalesShare;
  
  const ppcSales = estimatedPpcSales;
  const organicSales = Math.max(0, totalSales - ppcSales);
  const ppcSpend = estimatedPpcSpend;

  const profitBeforeAds = costData.salePrice - costData.amazonFees - costData.cogs;
  const costPerConversion = totalUnits > 0 ? ppcSpend / totalUnits : 0;
  const netProfitAfterAds = profitBeforeAds - costPerConversion;

  // Prepare chart data
  const dailyASINData = skuBRData.map(item => {
    // Estimate daily PPC data proportionally
    const daySalesShare = totalSales > 0 ? item.sales / totalSales : 0;
    const dayPPCSales = estimatedPpcSales * daySalesShare;
    const dayPPCSpend = estimatedPpcSpend * daySalesShare;

    return {
      date: item.date,
      sales: item.sales,
      ppcSales: dayPPCSales,
      organicSales: Math.max(0, item.sales - dayPPCSales),
      ppcSpend: dayPPCSpend,
      acos: calculateACoS(dayPPCSpend, dayPPCSales)
    };
  });

  const handleCostUpdate = () => {
    // Update cost inputs in state
    const existingCostIndex = state.costInputs.findIndex(cost => cost.sku === currentSKU);
    let updatedCosts;
    
    if (existingCostIndex >= 0) {
      // Update existing cost entry
      updatedCosts = state.costInputs.map((cost, index) => 
        index === existingCostIndex 
          ? { 
              ...cost, 
              salePrice: costData.salePrice,
              amazonFees: costData.amazonFees,
              cogs: costData.cogs,
              lastUpdated: new Date().toISOString() 
            }
          : cost
      );
    } else {
      // Add new cost entry
      updatedCosts = [
        ...state.costInputs,
        {
          sku: currentSKU,
          salePrice: costData.salePrice,
          amazonFees: costData.amazonFees,
          cogs: costData.cogs,
          lastUpdated: new Date().toISOString()
        }
      ];
    }
    
    dispatch({ type: 'UPDATE_COST_INPUTS', payload: updatedCosts });
    
    // Force a re-render by updating the state again
    setTimeout(() => {
      dispatch({ type: 'UPDATE_COST_INPUTS', payload: [...updatedCosts] });
    }, 100);
    
    setEditingCosts(false);
    
    // Show success message
    alert('Cost data updated successfully! Metrics will be recalculated.');
  };

  const kpis = [
    {
      title: 'Total Sales',
      value: totalSales,
      format: 'currency' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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
          {totalUnits > 0 ? (totalSales / totalUnits).toFixed(2) : '0'} AOV
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
          {ppcSales > 0 ? ((ppcSpend / ppcSales) * 100).toFixed(1) : '0'}% ACoS
        </div>
      )
    },
    {
      title: 'Net Profit per Unit',
      value: netProfitAfterAds,
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
          {totalSales > 0 ? ((netProfitAfterAds * totalUnits / totalSales) * 100).toFixed(1) : '0'}% Margin
        </div>
      )
    }
  ];

  return (
    <div id="asin-content" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">ASIN Performance Analysis</h2>
              <button
                onClick={() => setForceUpdate(prev => prev + 1)}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            <select
              value={currentSKU}
              onChange={(e) => setSelectedSKU(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {uniqueSKUs.map(sku => (
                <option key={sku} value={sku}>{sku}</option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Data Validation Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Data Validation Notice
              </p>
              <p className="text-xs text-blue-600 mt-1">
                PPC data is estimated proportionally since Search Term Reports don't include SKU mapping. 
                Business Report data is actual. Cost data is from user input.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Data Update Notice */}
      <div className="mb-6">
        <div className="relative flex items-center p-5 rounded-2xl shadow-xl bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 border-l-8 border-amber-400">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-amber-500 drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="#FDE68A" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" stroke="#B45309" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-amber-900 mb-1 tracking-tight">Cost Data Update</h3>
            <p className="text-amber-800 text-base font-medium leading-relaxed">
              <span className="font-semibold">Any changes you make to cost data here will instantly update all figures and profitability metrics across your dashboard.</span> This includes sales, PPC, organic, and ASIN performance calculations. <span className="font-semibold">Keep your costs accurate for the most reliable insights!</span>
            </p>
          </div>
        </div>
      </div>

      <div id="cost-config">
        {/* Debug Info - Remove this later */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-semibold text-blue-800 mb-2">Cost Data Status for {currentSKU}:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-medium">Sale Price:</span> {formatCurrency(costData.salePrice)}
            </div>
            <div>
              <span className="font-medium">Amazon Fees:</span> {formatCurrency(costData.amazonFees)}
            </div>
            <div>
              <span className="font-medium">COGS:</span> {formatCurrency(costData.cogs)}
            </div>
            <div>
              <span className="font-medium">Profit/Unit:</span> {formatCurrency(costData.salePrice - costData.amazonFees - costData.cogs)}
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Last updated: {new Date().toLocaleTimeString()} | Force update count: {forceUpdate}
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-semibold">Cost Configuration</h3>
            <Button
              variant="outline"
              onClick={() => setEditingCosts(!editingCosts)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {editingCosts ? 'Cancel' : 'Edit Costs'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tooltip content="The price at which you sell your product to customers. This is the revenue per unit before any deductions. Data Source: User input in Cost Inputs section">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Sale Price</span>
                  </Tooltip>
                </label>
                {editingCosts ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={costData.salePrice}
                    onChange={(e) => setCostData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
                  />
                ) : (
                  <p className="text-lg font-semibold">{formatCurrency(costData.salePrice)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tooltip content="The fees Amazon charges for selling on their platform, including referral fees and FBA fees. Data Source: User input in Cost Inputs section">
                    <span className="cursor-help hover:text-gray-800 transition-colors">Amazon Fees</span>
                  </Tooltip>
                </label>
                {editingCosts ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={costData.amazonFees}
                    onChange={(e) => setCostData(prev => ({ ...prev, amazonFees: parseFloat(e.target.value) || 0 }))}
                  />
                ) : (
                  <p className="text-lg font-semibold">{formatCurrency(costData.amazonFees)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Tooltip content="The direct costs associated with producing or purchasing the products you sell. This includes manufacturing, shipping, and other direct costs. Data Source: User input in Cost Inputs section">
                    <span className="cursor-help hover:text-gray-800 transition-colors">COGS</span>
                  </Tooltip>
                </label>
                {editingCosts ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={costData.cogs}
                    onChange={(e) => setCostData(prev => ({ ...prev, cogs: parseFloat(e.target.value) || 0 }))}
                  />
                ) : (
                  <p className="text-lg font-semibold">{formatCurrency(costData.cogs)}</p>
                )}
              </div>
            </div>
            
            {editingCosts && (
              <div className="mt-4">
                <Button onClick={handleCostUpdate}>Save Changes</Button>
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <Tooltip content="Revenue minus Amazon fees and product costs, before accounting for advertising spend. Formula: Sale Price - Amazon Fees - COGS. Data Source: Calculated from user input">
                      <span className="cursor-help hover:text-gray-800 transition-colors">Profit per Unit (before ads)</span>
                    </Tooltip>
                  </p>
                  <p className={`text-lg font-semibold ${profitBeforeAds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitBeforeAds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <Tooltip content="Final profit after deducting all costs including advertising spend. Formula: Profit before ads - Cost per conversion. Data Source: Calculated from multiple data sources">
                      <span className="cursor-help hover:text-gray-800 transition-colors">Net Profit per Unit (after ads)</span>
                    </Tooltip>
                  </p>
                  <p className={`text-lg font-semibold ${netProfitAfterAds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfitAfterAds)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales Over Time</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyASINData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="sales" stroke="#1B73E8" strokeWidth={2} name="Total Sales" />
                <Line type="monotone" dataKey="ppcSales" stroke="#EA4335" strokeWidth={2} name="PPC Sales" />
                <Line type="monotone" dataKey="organicSales" stroke="#34A853" strokeWidth={2} name="Organic Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">PPC Performance</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyASINData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="ppcSpend" stroke="#EA4335" strokeWidth={2} name="PPC Spend" />
                <Line type="monotone" dataKey="acos" stroke="#FBBC04" strokeWidth={2} name="ACoS %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="text-sm text-gray-700">
            <div className="font-semibold mb-2">PPC Data Estimation Debug:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="font-medium">Total Business Sales:</span> {formatCurrency(state.businessReports.reduce((sum, item) => sum + item.sales, 0))}
              </div>
              <div>
                <span className="font-medium">Total PPC Sales:</span> {formatCurrency(state.searchTermReports.reduce((sum, item) => sum + item.sales, 0))}
              </div>
              <div>
                <span className="font-medium">Total PPC Spend:</span> {formatCurrency(state.searchTermReports.reduce((sum, item) => sum + item.spend, 0))}
              </div>
              <div>
                <span className="font-medium">Current SKU Share:</span> {((totalSales / (state.businessReports.reduce((sum, item) => sum + item.sales, 0) || 1)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All ASINs Performance Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">All ASINs Performance Summary</h3>
        </CardHeader>
        <CardContent>
          {uniqueSKUs.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">No Business Report data uploaded yet.</div>
          ) : (
            <FilterableTable
              title=""
              data={uniqueSKUs.map(sku => {
                const asinData = state.businessReports.filter(br => br.sku === sku);
                const totalSales = asinData.reduce((sum, br) => sum + br.sales, 0);
                const totalUnits = asinData.reduce((sum, br) => sum + br.unitsOrdered, 0);
                const totalSessions = asinData.reduce((sum, br) => sum + br.sessions, 0);
                const avgSalePrice = totalUnits > 0 ? totalSales / totalUnits : 0;
                const conversionRate = totalSessions > 0 ? (totalUnits / totalSessions) * 100 : 0;
                
                // Estimate PPC data proportionally using the same logic as the main calculations
                const totalBusinessSales = state.businessReports.reduce((sum, item) => sum + item.sales, 0);
                const totalPpcSales = state.searchTermReports.reduce((sum, item) => sum + item.sales, 0);
                const totalPpcSpend = state.searchTermReports.reduce((sum, item) => sum + item.spend, 0);
                
                const skuSalesShare = totalBusinessSales > 0 ? totalSales / totalBusinessSales : 0;
                const ppcSales = totalPpcSales * skuSalesShare;
                const ppcSpend = totalPpcSpend * skuSalesShare;
                const acos = ppcSales > 0 ? (ppcSpend / ppcSales) * 100 : 0;
                
                return {
                  sku,
                  totalSales,
                  totalUnits,
                  totalSessions,
                  avgSalePrice,
                  conversionRate,
                  ppcSales,
                  ppcSpend,
                  acos,
                  organicSales: totalSales - ppcSales
                };
              })}
              columns={[
                { key: 'sku', label: 'SKU', type: 'text' },
                { key: 'totalSales', label: 'Total Sales', type: 'currency' },
                { key: 'totalUnits', label: 'Units Sold', type: 'number' },
                { key: 'totalSessions', label: 'Sessions', type: 'number' },
                { key: 'avgSalePrice', label: 'Avg Sale Price', type: 'currency' },
                { key: 'conversionRate', label: 'CVR (%)', type: 'percentage' },
                { key: 'ppcSales', label: 'PPC Sales', type: 'currency' },
                { key: 'organicSales', label: 'Organic Sales', type: 'currency' },
                { key: 'ppcSpend', label: 'PPC Spend', type: 'currency' },
                { key: 'acos', label: 'ACoS (%)', type: 'percentage' }
              ]}
              maxRows={50}
              showFilters={false}
              allBusinessReports={state.businessReports}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}