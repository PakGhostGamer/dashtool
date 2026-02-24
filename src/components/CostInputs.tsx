import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Tooltip } from './ui/Tooltip';
import { Save, Edit2, AlertCircle, Plus, Trash2, DollarSign, TrendingUp, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CostInput } from '../types';

export function CostInputsPage() {
  const { state, dispatch } = useApp();
  const [costInputs, setCostInputs] = useState<CostInput[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Initialize cost inputs for all unique SKUs with zero values
    const uniqueSkus = [...new Set(state.businessReports.map(br => br.sku))];
    
    // Get existing cost inputs to preserve user data
    const existingCosts = state.costInputs;
    
    // Create initial costs for all SKUs, starting with zero values
    const initialCosts = uniqueSkus.map(sku => {
      const existing = existingCosts.find(cost => cost.sku === sku);
      return existing || {
        sku,
        salePrice: 0,
        amazonFees: 0,
        cogs: 0,
        lastUpdated: new Date().toISOString()
      };
    });
    
    // Add any existing costs that might not be in current business reports
    const missingCosts = existingCosts.filter(cost => 
      !uniqueSkus.includes(cost.sku)
    );
    
    const allCosts = [...initialCosts, ...missingCosts];
    
    setCostInputs(allCosts);
    dispatch({ type: 'UPDATE_COST_INPUTS', payload: allCosts });
  }, [state.businessReports, dispatch, state.costInputs]);

  const handleInputChange = (sku: string, field: keyof Omit<CostInput, 'sku' | 'lastUpdated'>, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCostInputs(prev => prev.map(item => 
      item.sku === sku 
        ? { ...item, [field]: numValue, lastUpdated: new Date().toISOString() }
        : item
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Update the cost inputs in the global state
    dispatch({ type: 'UPDATE_COST_INPUTS', payload: costInputs });
    
    // Force a re-render by updating a timestamp
    dispatch({ type: 'UPDATE_COST_INPUTS', payload: [...costInputs] });
    
    setHasChanges(false);
    setEditingRow(null);
    
    // Show success notification (in a real app, you'd use a toast)
    alert('Cost data updated successfully! All metrics have been recalculated. Please refresh the dashboard to see updated calculations.');
  };

  const calculateProfit = (item: CostInput) => {
    return item.salePrice - item.amazonFees - item.cogs;
  };

  const handleAddNewSku = () => {
    if (newSku.trim() && !costInputs.find(item => item.sku === newSku.trim())) {
      const newCostInput: CostInput = {
        sku: newSku.trim(),
        salePrice: 0,
        amazonFees: 0,
        cogs: 0,
        lastUpdated: new Date().toISOString()
      };
      
      const updatedCosts = [...costInputs, newCostInput];
      setCostInputs(updatedCosts);
      dispatch({ type: 'UPDATE_COST_INPUTS', payload: updatedCosts });
      setNewSku('');
      setShowAddForm(false);
      setHasChanges(true);
    }
  };

  const handleDeleteSku = (skuToDelete: string) => {
    if (confirm(`Are you sure you want to delete the cost data for SKU: ${skuToDelete}?`)) {
      const updatedCosts = costInputs.filter(item => item.sku !== skuToDelete);
      setCostInputs(updatedCosts);
      dispatch({ type: 'UPDATE_COST_INPUTS', payload: updatedCosts });
      setHasChanges(true);
    }
  };

  const getProfitBadgeClass = (profit: number) => {
    if (profit > 0) {
      return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
    } else if (profit < 0) {
      return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
    } else {
      return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
    }
  };

  const handleEditClick = (sku: string) => {
    console.log('Edit button clicked for SKU:', sku);
    setEditingRow(sku);
  };

  const handleSaveRow = () => {
    setEditingRow(null);
    setHasChanges(true);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Debug info - remove this later */}
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
          Debug: Currently editing: {editingRow || 'None'}
        </div>
        
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Cost Input Management
            </h1>
            <div className="absolute bottom-0 left-0 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
          
          {/* Important Notice */}
          <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">Important Notice</h3>
                <p className="text-amber-800 text-base leading-relaxed">
                  <strong>Once you input or update your cost data, all figures and profitability metrics across the dashboard will be updated automatically.</strong> 
                  This includes sales, PPC, organic, and ASIN performance calculations throughout the entire application.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-slate-600 text-lg leading-relaxed">
            Enter or update sale prices, Amazon fees, and cost of goods sold for each SKU. 
            Changes will automatically recalculate all metrics across the dashboard.
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              SKU Cost Configuration
            </h2>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add New ASIN
              </Button>
              {hasChanges && (
                <Button 
                  onClick={handleSave} 
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Add New ASIN Form */}
            {showAddForm && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New ASIN
                </h3>
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">SKU/ASIN</label>
                    <Input
                      type="text"
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      placeholder="Enter SKU or ASIN"
                      className="w-48 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <Button 
                    onClick={handleAddNewSku} 
                    disabled={!newSku.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  >
                    Add ASIN
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      <Tooltip content="A unique identifier for each product variant. Used to track individual product performance. Data Source: Amazon Business Reports - SKU column">
                        <span className="cursor-help hover:text-slate-900 transition-colors flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          SKU
                        </span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      <Tooltip content="The price at which you sell your product to customers. This is the revenue per unit before any deductions. Data Source: User input in Cost Inputs section">
                        <span className="cursor-help hover:text-slate-900 transition-colors flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          Sale Price
                        </span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      <Tooltip content="The fees Amazon charges for selling on their platform, including referral fees and FBA fees. Data Source: User input in Cost Inputs section">
                        <span className="cursor-help hover:text-slate-900 transition-colors flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          Amazon Fees
                        </span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      <Tooltip content="The direct costs associated with producing or purchasing the products you sell. This includes manufacturing, shipping, and other direct costs. Data Source: User input in Cost Inputs section">
                        <span className="cursor-help hover:text-slate-900 transition-colors flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          COGS
                        </span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      <Tooltip content="Revenue minus Amazon fees and product costs, before accounting for advertising spend. Formula: Sale Price - Amazon Fees - COGS. Data Source: Calculated from user input">
                        <span className="cursor-help hover:text-slate-900 transition-colors flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          Profit per Unit
                        </span>
                      </Tooltip>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Actions</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {costInputs.map((item, index) => (
                    <tr 
                      key={item.sku} 
                      className={`border-b border-slate-100 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      } ${editingRow === item.sku ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500' : ''}`}
                    >
                      <td className="py-4 px-6 font-medium text-slate-800">{item.sku}</td>
                      <td className="py-4 px-6">
                        {editingRow === item.sku ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.salePrice}
                            onChange={(e) => handleInputChange(item.sku, 'salePrice', e.target.value)}
                            className="w-24 border-green-200 focus:border-green-400 focus:ring-green-400"
                          />
                        ) : (
                          <span className={`font-medium ${item.salePrice === 0 ? 'text-slate-400 italic' : 'text-green-600'}`}>
                            ${item.salePrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {editingRow === item.sku ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amazonFees}
                            onChange={(e) => handleInputChange(item.sku, 'amazonFees', e.target.value)}
                            className="w-24 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                          />
                        ) : (
                          <span className={`font-medium ${item.amazonFees === 0 ? 'text-slate-400 italic' : 'text-orange-600'}`}>
                            ${item.amazonFees.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {editingRow === item.sku ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.cogs}
                            onChange={(e) => handleInputChange(item.sku, 'cogs', e.target.value)}
                            className="w-24 border-red-200 focus:border-red-400 focus:ring-red-400"
                          />
                        ) : (
                          <span className={`font-medium ${item.cogs === 0 ? 'text-slate-400 italic' : 'text-red-600'}`}>
                            ${item.cogs.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getProfitBadgeClass(calculateProfit(item))}`}>
                          ${calculateProfit(item).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {editingRow === item.sku ? (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveRow}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Edit button clicked for:', item.sku);
                              setEditingRow(item.sku);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="ml-1 text-xs">Edit</span>
                          </Button>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSku(item.sku)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Total SKUs</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {costInputs.length}
              </p>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Avg. Profit per Unit</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                ${(costInputs.reduce((sum, item) => sum + calculateProfit(item), 0) / costInputs.length || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
              <div className="mb-4 flex justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Profitable SKUs</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {costInputs.filter(item => calculateProfit(item) > 0).length} / {costInputs.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}