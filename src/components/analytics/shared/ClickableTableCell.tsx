
import { TableCell } from '@/components/ui/table';

interface ClickableTableCellProps {
  value: number;
  onClick: () => void;
  className?: string;
  colorClass?: string;
}

const ClickableTableCell = ({ value, onClick, className = "", colorClass = "" }: ClickableTableCellProps) => {
  return (
    <TableCell 
      className={`text-center text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium ${colorClass} ${className}`}
      onClick={onClick}
    >
      {value}
    </TableCell>
  );
};

export default ClickableTableCell;
