'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <div
        className={`text-2xl font-bold ${
          isLoading ? 'animate-pulse bg-gray-200 rounded w-16 h-8' : ''
        }`}
      >
        {isLoading ? <span className="opacity-0">0</span> : value}
      </div>
    </div>
  );
};

export default StatCard;