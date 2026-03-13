// app/components/dashboard/ChartRevenue.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import './ChartRevenue.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ChartRevenueProps {
  data: {
    mois: string;
    revenus: number;
  }[];
}

export default function ChartRevenue({ data }: ChartRevenueProps) {
  const chartData = {
    labels: data.map(d => d.mois),
    datasets: [
      {
        label: 'Revenus mensuels',
        data: data.map(d => d.revenus),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: 'white',
        bodyColor: '#cbd5e1',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.raw.toLocaleString()} €`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          callback: (value: any) => `${value} €`,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  };

  return (
    <div className="chart-revenue">
      <div className="chart-header">
        <h3>Évolution des revenus</h3>
        <div className="chart-legend">
          <span className="legend-color" style={{ background: '#8B5CF6' }}></span>
          <span>Revenus 2024</span>
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}