
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
}

const PaginationControls = memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalCount, 
  pageSize 
}: PaginationControlsProps) => {
  const { startRecord, endRecord, pageNumbers } = useMemo(() => {
    const startRecord = (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalCount);
    
    // Calculate page numbers to show
    const pageNumbers = [];
    const maxPages = Math.min(5, totalPages);
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pageNumbers.push(i);
      }
    }
    
    return { startRecord, endRecord, pageNumbers };
  }, [currentPage, totalPages, pageSize, totalCount]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing {startRecord} to {endRecord} of {totalCount} applications
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-8 h-8 p-0"
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
});

PaginationControls.displayName = "PaginationControls";

export default PaginationControls;
