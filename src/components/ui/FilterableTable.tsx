import React, { useState, useMemo } from 'react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'status';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

interface FilterableTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  maxRows?: number;
  className?: string;
  onRowClick?: (row: any) => void;
  showFilters?: boolean;
}

export function FilterableTable({ 
  data, 
  columns, 
  title, 
  maxRows = 50, 
  className = "",
  onRowClick,
  showFilters = false
}: FilterableTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = data;

    // Apply search term
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        result = result.filter(row => {
          const value = row[column];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Format cell value with color coding
  const formatCellValue = (value: any, type?: string, columnKey?: string) => {
    if (value === null || value === undefined) return '-';
    
    let formattedValue = '';
    switch (type) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
        break;
      case 'percentage':
        formattedValue = `${Number(value).toFixed(2)}%`;
        break;
      case 'number':
        formattedValue = new Intl.NumberFormat('en-US').format(Number(value));
        break;
      case 'date':
        formattedValue = new Date(value).toLocaleDateString();
        break;
      default:
        formattedValue = String(value);
    }

    // Add color coding for specific columns
    if (type === 'percentage' && columnKey === 'acos') {
      const numValue = Number(value);
      if (numValue === 0) {
        // ACoS = 0 means no sales, which is not good
        return (
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">{formattedValue}</span>
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
              No Sales
            </span>
          </div>
        );
      } else if (numValue > 35) {
        // Only show "High" if ACoS is really high (>35%)
        return (
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">{formattedValue}</span>
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
              High
            </span>
          </div>
        );
      } else {
        // For normal ACoS values, just show the colored value without tag
        return (
          <span className={numValue > 25 ? 'text-red-600 font-semibold' : numValue > 15 ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>
            {formattedValue}
          </span>
        );
      }
    } else if (type === 'number' && columnKey === 'roas') {
      // ROAS: Only show tags for extreme values
      const numValue = Number(value);
      if (numValue > 6) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-semibold">{formattedValue}</span>
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
              Excellent
            </span>
          </div>
        );
      } else if (numValue < 1) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">{formattedValue}</span>
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
              Poor
            </span>
          </div>
        );
      } else {
        // For normal ROAS values, just show colored value without tag
        return (
          <span className={numValue > 4 ? 'text-green-600 font-semibold' : numValue > 2 ? 'text-orange-600 font-semibold' : 'text-red-600 font-semibold'}>
            {formattedValue}
          </span>
        );
      }
    } else if (columnKey === 'status') {
      // Status badges - keep these as they are meaningful
      const status = String(value).toLowerCase();
      if (status === 'wasted') {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
            Wasted
          </span>
        );
      } else if (status === 'high acos') {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
            High ACoS
          </span>
        );
      } else if (status === 'good') {
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
            Good
          </span>
        );
      }
    }

    return formattedValue;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSortColumn('');
    setSortDirection('desc');
  };

  // Get unique values for a column
  const getUniqueValues = (columnKey: string) => {
    const values = new Set(data.map(row => row[columnKey]).filter(Boolean));
    return Array.from(values).sort();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with title and search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}
        
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Global search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Clear filters button */}
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg shadow-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Column filters */}
      {showFilters && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Advanced Filters
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {columns
              .filter(col => col.filterable !== false)
              .map(column => (
                <div key={column.key} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {column.label}
                  </label>
                  {column.type === 'number' ? (
                    <select
                      value={filters[column.key] || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [column.key]: e.target.value
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                      <option value="">All</option>
                      {getUniqueValues(column.key).map(value => (
                        <option key={value} value={value}>
                          {formatCellValue(value, column.type)}
                        </option>
                      ))}
                    </select>
                  ) : column.type === 'status' ? (
                    <select
                      value={filters[column.key] || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [column.key]: e.target.value
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    >
                      <option value="">All Statuses</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High ACoS">High ACoS</option>
                      <option value="Wasted">Wasted</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={`Filter ${column.label}...`}
                      value={filters[column.key] || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [column.key]: e.target.value
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Results summary */}
      {showFilters && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{sortedData.length}</span> of <span className="font-semibold">{data.length}</span> records
            {searchTerm && (
              <span className="text-blue-600 ml-2">
                (filtered by "{searchTerm}")
              </span>
            )}
          </div>
          {sortedData.length > 0 && (
            <div className="text-xs text-gray-500">
              Click column headers to sort
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200 ${
                    column.sortable !== false ? 'cursor-pointer' : ''
                  } ${column.width || ''}`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable !== false && sortColumn === column.key && (
                      <span className="text-blue-600 font-bold">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedData.slice(0, maxRows).map((row, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className="py-3 px-4 text-gray-900"
                  >
                    {formatCellValue(row[column.key], column.type, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more indicator */}
      {sortedData.length > maxRows && (
        <div className="text-center text-sm text-gray-500 py-2">
          Showing first {maxRows} results. Use filters to narrow down results.
        </div>
      )}

      {/* No results */}
      {sortedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No results found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
} 