
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ClickableTableCellProps {
  value: number;
  onClick: () => void;
  className?: string;
}

const ClickableTableCell = ({ value, onClick, className }: ClickableTableCellProps) => {
  return (
    <TableCell 
      className={cn(
        "text-center cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {value}
    </TableCell>
  );
};

export default ClickableTableCell;
