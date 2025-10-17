import * as React from 'react';
import type { InfoesteEvent } from '@infoeste/core';
import { DataTable } from './data-table';
import { eventsColumns } from './events-columns';

interface EventsTableProps {
  events: InfoesteEvent[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EventsTable({ events, onRefresh, isRefreshing }: EventsTableProps) {
  // Flatten the events structure to create a flat array of courses with event title
  const flattenedCourses = React.useMemo(() => {
    return events.flatMap(event =>
      event.courses.map(course => ({
        ...course,
        eventTitle: event.title
      }))
    );
  }, [events]);

  // Extract unique event titles for filter
  const eventTitles = React.useMemo(() => {
    const uniqueTitles = Array.from(new Set(events.map(e => e.title)));
    return uniqueTitles.map(title => ({
      label: title,
      value: title
    }));
  }, [events]);

  // Extract unique dates for filter
  const dates = React.useMemo(() => {
    const uniqueDates = Array.from(new Set(events.flatMap(event => event.courses.map(course => course.date)))).sort();
    return uniqueDates.map(date => ({
      label: date,
      value: date
    }));
  }, [events]);

  // Extract unique periods for filter
  const periods = React.useMemo(() => {
    const uniquePeriods = Array.from(
      new Set(events.flatMap(event => event.courses.map(course => course.periodTime)))
    ).sort();
    return uniquePeriods.map(period => ({
      label: period,
      value: period
    }));
  }, [events]);

  return (
    <DataTable
      columns={eventsColumns}
      data={flattenedCourses}
      eventTitles={eventTitles}
      dates={dates}
      periods={periods}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
