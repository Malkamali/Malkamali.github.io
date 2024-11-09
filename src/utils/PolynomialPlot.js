import React, { useEffect, useRef } from 'react';
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

const PolynomialPlot = ({ polynomial, approxData }) => {
  const chartRef = useRef(null);

  // Compute initial data for the polynomial line
  const initialX = Array.from({ length: 500 }, (_, i) => -1 + (2 * i) / 499);
  const initialY = initialX.map((xi) => polynomial(xi));

  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;

      const x = Array.from({ length: 500 }, (_, i) => -1 + (2 * i) / 499);
      const y = x.map((xi) => polynomial(xi));

      chart.data.datasets[0].data = y; // Update blue line data
      chart.update(); // Trigger chart update
    }
  }, [polynomial]); // Only update when the polynomial function changes

  const data = {
    labels: initialX,
    datasets: [
      {
        label: 'Polynomial Function',
        data: initialY, // Set initial data based on the polynomial
        borderColor: 'blue',
        pointBorderColor: 'blue',
        pointBackgroundColor: 'transparent',
        fill: false,
        pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 5 : 0),
        pointBorderWidth: (ctx) => (ctx.dataIndex % 10 === 0 ? 2 : 0),
      },
      {
        label: 'Neural Network Approximation',
        data: approxData.length > 0 ? approxData : Array(500).fill(null),
        borderColor: 'red',
        pointBorderColor: 'red',
        pointBackgroundColor: 'transparent',
        fill: false,
        pointRadius: (ctx) => (ctx.dataIndex % 10 === 0 ? 5 : 0),
        pointBorderWidth: (ctx) => (ctx.dataIndex % 10 === 0 ? 2 : 0),
      },
    ],
  };

  const options = {
    scales: {
      x: { type: 'linear', ticks: { stepSize: 0.1 } },
      y: { ticks: { stepSize: 0.1 } },
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
};

export default PolynomialPlot;
