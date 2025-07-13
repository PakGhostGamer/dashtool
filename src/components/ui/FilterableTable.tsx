import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
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

  // Format cell value
  const formatCellValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
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
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Global search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear filters button */}
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Column filters */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {columns
            .filter(col => col.filterable !== false)
            .map(column => (
              <div key={column.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  {column.label}
                </label>
                {column.type === 'number' ? (
                  <select
                    value={filters[column.key] || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      [column.key]: e.target.value
                    }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {getUniqueValues(column.key).map(value => (
                      <option key={value} value={value}>
                        {formatCellValue(value, column.type)}
                      </option>
                    ))}
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
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Results summary */}
      {showFilters && (
        <div className="text-sm text-gray-600">
          Showing {sortedData.length} of {data.length} records
          {searchTerm && ` (filtered by "${searchTerm}")`}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`text-left py-3 px-4 font-medium text-gray-700 ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.width || ''}`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable !== false && sortColumn === column.key && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.slice(0, maxRows).map((row, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className="py-3 px-4 text-gray-900"
                  >
                    {formatCellValue(row[column.key], column.type)}
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
          <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>No results found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
} 