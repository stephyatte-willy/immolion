'use client';

import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import '@/app/dashboard/dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RepartitionChartProps {
  data: { type_bien: string; total: number }[];
}

const typeColors: Record<string, string> = {
  'APPARTEMENT': '#D4AF37',
  'MAISON': '#10b981',
  'VILLA': '#8B5CF6',
  'STUDIO': '#EC4899',
  'COMMERCIAL': '#F59E0B',
  'TERRAIN': '#3B82F6',
  'ENTREPOT': '#EF4444',
  'BUREAU': '#06B6D4'
};

export default function RepartitionChart({ data }: RepartitionChartProps) {
  const labels = data.map(item => {
    const typeMap: Record<string, string> = {
      'APPARTEMENT': 'Appartements',
      'MAISON': 'Maisons',
      'VILLA': 'Villas',
      'STUDIO': 'Studios',
      'COMMERCIAL': 'Commerciaux',
      'TERRAIN': 'Terrains',
      'ENTREPOT': 'Entrepôts',
      'BUREAU': 'Bureaux'
    };
    return typeMap[item.type_bien] || item.type_bien;
  });

  const values = data.map(item => item.total);
  const backgroundColors = data.map(item => typeColors[item.type_bien] || '#94a3b8');

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: 'white',
        bodyColor: '#cbd5e1',
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="repartition-chart">
      <h3>📊 Répartition des biens</h3>
      <div className="chart-container-pie">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}