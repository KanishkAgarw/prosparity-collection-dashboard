
import { TableHead, TableHeader as UITableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { memo } from "react";

interface TableHeaderProps {
  showBulkSelection?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: (checked: boolean) => void;
}

const TableHeader = memo(({ 
  showBulkSelection, 
  allSelected, 
  someSelected, 
  onSelectAll 
}: TableHeaderProps) => {
  return (
    <UITableHeader>
      <TableRow>
        {showBulkSelection && (
          <TableHead className="w-[50px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              className={someSelected ? "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground opacity-50" : ""}
            />
          </TableHead>
        )}
        <TableHead className="min-w-[320px]">Details</TableHead>
        <TableHead className="min-w-[120px]">EMI Due</TableHead>
        <TableHead className="min-w-[120px]">Status</TableHead>
        <TableHead className="min-w-[100px]">PTP Date</TableHead>
        <TableHead className="min-w-[150px]">Call Status</TableHead>
        <TableHead className="min-w-[200px]">Recent Comments</TableHead>
      </TableRow>
    </UITableHeader>
  );
});

TableHeader.displayName = "TableHeader";

export default TableHeader;
