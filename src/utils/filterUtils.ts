
// Calculate total active filters with proper typing
export const calculateActiveFilterCount = (filters: Record<string, unknown>): number => {
  return Object.values(filters).reduce((total: number, filterArray: unknown): number => {
    if (Array.isArray(filterArray)) {
      return total + filterArray.length;
    }
    return total;
  }, 0);
};
