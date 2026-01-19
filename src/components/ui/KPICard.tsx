import React from 'react';
import { Card } from './Card';
import { Tooltip } from './Tooltip';
import { getTooltipContent, formatTooltipContent } from '../../utils/tooltipData';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/calculations';

interface KPICardProps {
  title: string;
  value: string | number;
  format?: 'currency' | 'percentage' | 'number';
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
  extra?: React.ReactNode;
}

export function KPICard({ 
  title, 
  value, 
  format = 'number',
  change, 
  changeType = 'neutral',
  icon,
  className = "",
  extra
}: KPICardProps) {
  const tooltipData = getTooltipContent(title);

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Format the value based on the format prop
  let formattedValue = value;
  if (typeof value === 'number') {
    if (format === 'currency') {
      formattedValue = formatCurrency(value);
    } else if (format === 'percentage') {
      formattedValue = formatPercentage(value);
    } else {
      formattedValue = formatNumber(value);
    }
  }

  return (
    <Card className={`border-0 bg-gradient-to-br from-white to-gray-50/50 overflow-hidden relative ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {tooltipData ? (
            <Tooltip content={formatTooltipContent(tooltipData)}>
              <p className="text-sm font-semibold text-gray-600 cursor-help tracking-wide">
                {title}
              </p>
            </Tooltip>
          ) : (
            <p className="text-sm font-semibold text-gray-600 tracking-wide">
              {title}
            </p>
          )}
          
          {icon && (
            <div className="relative text-blue-600 p-3 rounded-full bg-gradient-to-br from-blue-50 to-purple-50">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-900">
            {formattedValue}
          </p>
          {extra && (
            <div>{extra}</div>
          )}
          {change && (
            <p className={`text-sm font-medium ${getChangeColor()}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}