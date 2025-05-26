'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  change?: { value: number; direction: 'up' | 'down' | 'neutral' };
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  color = 'blue',
  isLoading = false,
}) => {
  // Color mapping
  const colorMap = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      icon: 'text-blue-600',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      icon: 'text-green-600',
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      icon: 'text-amber-600',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      icon: 'text-red-600',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: 'text-gray-600',
    },
  };

  const colors = colorMap[color];

  const changeColors = {
    up: 'text-green-700 bg-green-100',
    down: 'text-red-700 bg-red-100',
    neutral: 'text-gray-700 bg-gray-100',
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`${colors.bg} p-2 rounded-full`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
      ) : (
        <>
          <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
          
          {change && (
            <div className="mt-2 flex items-center">
              <span
                className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full mr-1.5 ${
                  changeColors[change.direction]
                }`}
              >
                {change.direction === 'up' && '+'}
                {change.value}%
              </span>
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatCard;