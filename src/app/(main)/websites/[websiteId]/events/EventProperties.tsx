import { GridColumn, GridTable } from 'react-basics';
import { useEventDataProperties, useEventDataValues, useMessages } from '@/components/hooks';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import PieChart from '@/components/charts/PieChart';
import Chart from '@/components/charts/Chart';
import { useState } from 'react';
import styles from './EventProperties.module.css';
import getChartData from './getChartData';

export function EventProperties({ websiteId }: { websiteId: string }) {
  const [propertyName, setPropertyName] = useState('');
  const [eventName, setEventName] = useState('');
  const { formatMessage, labels } = useMessages();
  const { data, isLoading, isFetched, error } = useEventDataProperties(websiteId);
  const { data: values } = useEventDataValues(websiteId, eventName, propertyName);
  const chartData = propertyName && values ? getChartData(values) : null;

  const handleRowClick = row => {
    setEventName(row.eventName);
    setPropertyName(row.propertyName);
  };

  return (
    <LoadingPanel isLoading={isLoading} isFetched={isFetched} data={data} error={error}>
      <div className={styles.container}>
        <GridTable data={data} cardMode={false} className={styles.table}>
          <GridColumn name="eventName" label={formatMessage(labels.name)}>
            {row => (
              <div className={styles.link} onClick={() => handleRowClick(row)}>
                {row.eventName}
              </div>
            )}
          </GridColumn>
          <GridColumn name="propertyName" label={formatMessage(labels.property)}>
            {row => (
              <div className={styles.link} onClick={() => handleRowClick(row)}>
                {row.propertyName}
              </div>
            )}
          </GridColumn>
          <GridColumn name="total" label={formatMessage(labels.count)} alignment="end" />
        </GridTable>
        {propertyName && (
          <div className={styles.chart}>
            <div className={styles.title}>{propertyName}</div>
            {chartData?.type === 'line' ? (
              <Chart key={propertyName + eventName} {...chartData} />
            ) : (
              <PieChart key={propertyName + eventName} {...chartData} />
            )}
          </div>
        )}
      </div>
    </LoadingPanel>
  );
}

export default EventProperties;
