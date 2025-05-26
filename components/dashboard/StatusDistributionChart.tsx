import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface StatusData {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

interface StatusDistributionChartProps {
  data?: StatusData[];
}

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  // Default data if none provided
  const chartData = data || [
    { status: 'Pending', count: 18, color: '#f59e0b', percentage: 45 },
    { status: 'Approved', count: 12, color: '#10b981', percentage: 30 },
    { status: 'Rejected', count: 6, color: '#ef4444', percentage: 15 },
    { status: 'Flagged', count: 4, color: '#fb923c', percentage: 10 },
  ];
  const chartConfig = {
    labels: chartData.map(item => item.status),
    datasets: [      {
        data: chartData.map(item => item.count),
        backgroundColor: chartData.map(item => item.color),
        borderColor: chartData.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Status Distribution</h3>
        <p className="text-sm text-gray-500">KYC submissions by current status</p>
      </div>      <div className="h-64 relative">
        <Doughnut data={chartConfig} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium">{item.status} {item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusDistributionChart;