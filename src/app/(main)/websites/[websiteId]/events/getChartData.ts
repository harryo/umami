import { CHART_COLORS } from '@/lib/constants';
import ChartProps from '@/components/charts/Chart';

function numericValues(values: { value: string; total: number }[]) {
  if (values.length < 10) {
    return null;
  }
  const result = [];
  return values.every(({ value, total }) => {
    if (!value) {
      return false;
    }
    const num = Number(value);
    if (isNaN(num)) {
      return false;
    }
    result.push({ value: num, total });
    return true;
  })
    ? result
    : null;
}

function getPieChartData(values: { value: string; total: number }[]): ChartProps {
  return {
    type: 'pie',
    data: {
      labels: values.map(({ value }) => value),
      datasets: [
        {
          data: values.map(({ total }) => total),
          backgroundColor: CHART_COLORS,
          borderWidth: 0,
        },
      ],
    },
  };
}

function getLineChartData(values: { value: number; total: number }[]): ChartProps {
  let sum = 0;
  let count = 0;
  values.forEach(({ value, total }) => {
    count += total;
    sum += value * total;
  });
  const mean = sum / count;
  const numRanges = 15;
  const rangeCount = Array(numRanges).fill(0);
  const stepSize = mean / 5;
  values.forEach(({ value, total }) => {
    const index = Math.floor(Math.min(value / stepSize, numRanges - 1));
    rangeCount[index] += total;
  });

  return {
    type: 'line',
    data: {
      datasets: [
        {
          data: rangeCount.map((total, index) => ({
            x: Math.floor(index * stepSize + stepSize / 2),
            y: total,
          })),
          fill: true,
          tension: 0.1,
        },
      ],
    },
    chartOptions: {
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Value',
          },
          min: 0,
          max: mean * 3,
        },
        y: {
          title: {
            display: true,
            text: 'Total',
          },
        },
      },
    },
  };
}

function getChartData(values: { value: string; total: number }[]): ChartProps {
  const numValues = numericValues(values);
  return numValues ? getLineChartData(numValues) : getPieChartData(values);
}

export default getChartData;
