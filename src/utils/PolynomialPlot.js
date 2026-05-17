import React, { useEffect, useRef, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

const X_VALS = Array.from({ length: 500 }, (_, i) => -1 + (2 * i) / 499);

const PolynomialPlot = ({ polynomial, approxData }) => {
  const chartRef = useRef(null);

  // Stable data object — never recreated, updated imperatively below
  const data = useMemo(() => ({
    labels: X_VALS,
    datasets: [
      {
        label: 'Polynomial Function',
        data: X_VALS.map((xi) => polynomial(xi)),
        borderColor: 'blue',
        pointBorderColor: 'blue',
        pointBackgroundColor: 'transparent',
        fill: false,
        pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 5 : 0),
        pointBorderWidth: (ctx) => (ctx.dataIndex % 10 === 0 ? 2 : 0),
      },
      {
        label: 'Neural Network Approximation',
        data: Array(500).fill(null),
        borderColor: 'red',
        pointBorderColor: 'red',
        pointBackgroundColor: 'transparent',
        fill: false,
        pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 5 : 0),
        pointBorderWidth: (ctx) => (ctx.dataIndex % 10 === 0 ? 2 : 0),
      },
    ],
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update polynomial line imperatively when it changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data.datasets[0].data = X_VALS.map((xi) => polynomial(xi));
    chartRef.current.update('none');
  }, [polynomial]);

  // Update approximation line imperatively — no re-render of the chart component
  useEffect(() => {
    if (!chartRef.current || approxData.length === 0) return;
    chartRef.current.data.datasets[1].data = approxData;
    chartRef.current.update('none');
  }, [approxData]);

  const options = useMemo(() => ({
    animation: { duration: 0 },
    scales: {
      x: { type: 'linear', ticks: { stepSize: 0.1 } },
      y: { ticks: { stepSize: 0.1 } },
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true },
    },
    elements: { point: { radius: 0 } },
  }), []);

  return <Line ref={chartRef} data={data} options={options} />;
};

// Only re-render when the polynomial function or approximation data actually changes,
// not on every epoch counter update from the parent.
export default React.memo(PolynomialPlot);
