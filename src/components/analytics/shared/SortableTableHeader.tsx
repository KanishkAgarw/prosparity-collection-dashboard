
import { ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  onSort: (field: string) => void;
  className?: string;
}

const SortableTableHeader = ({ label, field, onSort, className = "" }: SortableTableHeaderProps) => {
  return (
    <TableHead className={`font-medium text-sm ${className}`}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
};

export default SortableTableHeader;
