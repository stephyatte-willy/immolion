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
import { useTheme } from '@/app/providers/ThemeProvider';
import '@/app/dashboard/dashboard.css';

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

interface EvolutionChartProps {
  data: { mois: string; revenus: number; annee?: number }[];
  isLocked?: boolean;
}

export default function EvolutionChart({ data, isLocked = false }: EvolutionChartProps) {
  const { formatMoney } = useTheme();

  const chartData = {
    labels: data.map(d => `${d.mois} ${d.annee ? d.annee : ''}`),
    datasets: [
      {
        label: 'Revenus',
        data: data.map(d => d.revenus),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#D4AF37',
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
        borderColor: '#D4AF37',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => `${formatMoney(context.raw)}`,
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
          callback: (value: any) => formatMoney(value),
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

  if (isLocked) {
    return (
      <div className="chart-locked">
        <div className="chart-locked-overlay">
          <div className="locked-icon">🔒</div>
          <p>Accès restreint</p>
          <span>Seuls les administrateurs peuvent voir les données financières</span>
        </div>
        <div className="chart-blur">
          <Line data={chartData} options={options} />
        </div>
      </div>
    );
  }

  return (
    <div className="evolution-chart">
      <div className="chart-header">
        <h3>Évolution des revenus</h3>
        <div className="chart-legend">
          <span className="legend-color" style={{ background: '#D4AF37' }}></span>
          <span>Revenus mensuels</span>
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}