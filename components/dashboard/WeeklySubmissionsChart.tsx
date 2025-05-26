'use client';

import React from 'react';

interface WeeklySubmissionsChartProps {
  data?: {
    day: string;
    count: number;
  }[];
}

const WeeklySubmissionsChart: React.FC<WeeklySubmissionsChartProps> = ({ data }) => {
  // Default sample data if none provided
  const chartData = data || [
    { day: 'Mon', count: 24 },
    { day: 'Tue', count: 13 },
    { day: 'Wed', count: 18 },
    { day: 'Thu', count: 27 },
    { day: 'Fri', count: 19 },
    { day: 'Sat', count: 12 },
    { day: 'Sun', count: 9 },
  ];

  // Find max value for scaling
  const maxValue = Math.max(...chartData.map(item => item.count));
  const barHeight = (value: number) => `${(value / maxValue) * 100}%`;

  return (
    <div className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Weekly Submissions</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Total submissions over the past week</p>
        
        <div className="flex-1 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
            <div>{maxValue}</div>
            <div>{Math.floor(maxValue * 3/4)}</div>
            <div>{Math.floor(maxValue * 2/4)}</div>
            <div>{Math.floor(maxValue * 1/4)}</div>
            <div>0</div>
          </div>
          
          {/* Grid lines */}
          <div className="absolute left-8 right-0 top-0 bottom-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="h-px w-full bg-gray-200"
              />
            ))}
          </div>
          
          {/* Chart */}
          <div className="absolute left-10 right-0 top-4 bottom-6 flex items-end justify-between">
            {chartData.map((item, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center justify-end h-full"
                style={{ width: `${100 / chartData.length}%` }}
              >
                <div 
                  className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t-sm opacity-80"
                  style={{ 
                    height: barHeight(item.count),
                    maxWidth: '24px',
                    margin: '0 auto'
                  }}
                />
                <div className="text-xs text-gray-500 mt-1">{item.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySubmissionsChart;