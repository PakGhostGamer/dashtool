import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/calculations';
import { Tooltip } from './Tooltip';
import { getTooltipContent, formatTooltipContent } from '../../utils/tooltipData';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  format?: 'currency' | 'percentage' | 'number';
  icon?: React.ReactNode;
  extra?: React.ReactNode;
}

export function KPICard({ title, value, change, format = 'number', icon, extra }: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return formatPercentage(val);
      default:
        return formatNumber(val);
    }
  };

  const isPositiveChange = change && change.startsWith('+');
  const tooltipData = getTooltipContent(title);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {tooltipData ? (
              <Tooltip content={formatTooltipContent(tooltipData)}>
                <p className="text-sm font-semibold text-gray-600 cursor-help hover:text-gray-800 transition-colors tracking-wide">
                  {title}
                </p>
              </Tooltip>
            ) : (
              <p className="text-sm font-semibold text-gray-600 tracking-wide">{title}</p>
            )}
            <p className="text-3xl font-bold text-gray-900 mt-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {formatValue(value)}
            </p>
            {extra && (
              <div className="mt-3">{extra}</div>
            )}
          </div>
          {icon && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative text-blue-600 group-hover:text-blue-700 transition-colors duration-300 p-3 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 group-hover:from-blue-100 group-hover:to-purple-100">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}