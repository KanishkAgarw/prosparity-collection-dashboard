
import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export const useTableSorting = <T extends string>(initialField: T) => {
  const [sortField, setSortField] = useState<T>(initialField);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = <D extends Record<string, any>>(data: D[], getValue: (item: D, field: T) => any) => {
    return [...data].sort((a, b) => {
      const aValue = getValue(a, sortField);
      const bValue = getValue(b, sortField);

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  return { sortField, sortDirection, handleSort, getSortedData };
};
