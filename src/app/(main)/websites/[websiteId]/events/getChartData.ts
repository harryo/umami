import { CHART_COLORS } from '@/lib/constants';
import { ChartProps } from '@/components/charts/Chart';

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

function quickSort(list: { value: number }[]) {
  if (list.length < 2) {
    return list;
  }
  const pivot = list[0];
  const left = [];
  const right = [];
  for (let i = 1; i < list.length; i++) {
    if (list[i].value <= pivot.value) {
      left.push(list[i]);
    } else {
      right.push(list[i]);
    }
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
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
  const sortedValues = quickSort(values);
  const list = [];
  let sum = 0;
  sortedValues.forEach(({ value, total }) => {
    list.push(...Array(total).fill(value));
    sum += total * value;
  });
  const count = list.length;
  const median = list[Math.floor(count / 2)];
  const numRanges = 12;
  const rangeCount = Array(numRanges).fill(0);
  const max = median * 4;
  const stepSize = max / numRanges;
  let rangeIndex = 0;
  let lastIndex = 0;
  let nextLimit = stepSize;
  list.forEach((value: number, index: number) => {
    while (value > nextLimit && rangeIndex < numRanges) {
      rangeCount[rangeIndex++] += index - lastIndex;
      lastIndex = index;
      nextLimit += stepSize;
    }
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
            text: `Total = ${sum.toLocaleString()}`,
          },
          min: 0,
          max,
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
