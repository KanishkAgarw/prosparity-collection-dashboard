
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface CustomMultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}

const CustomMultiSelectFilter = ({ 
  label, 
  options = [], 
  selected = [], 
  onSelectionChange,
  placeholder = "Select options..."
}: CustomMultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Clean and filter options
  const safeOptions = options.filter(option => 
    option && typeof option === 'string' && option.trim().length > 0
  );

  const safeSelected = selected.filter(item => 
    item && typeof item === 'string' && item.trim().length > 0
  );

  // Filter options based on search term
  const filteredOptions = safeOptions.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (!option) return;
    
    const newSelected = safeSelected.includes(option)
      ? safeSelected.filter(item => item !== option)
      : [...safeSelected, option];
    onSelectionChange(newSelected);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const removeItem = (item: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectionChange(safeSelected.filter(selected => selected !== item));
  };

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Reset search when closed
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto min-h-[40px] text-left font-normal p-3"
          >
            <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
              {safeSelected.length === 0 ? (
                <span className="text-muted-foreground">{label}</span>
              ) : (
                <>
                  {safeSelected.slice(0, 2).map((item) => (
                    <Badge 
                      key={item} 
                      variant="secondary" 
                      className="text-xs h-6 px-2"
                    >
                      {item}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={(e) => removeItem(item, e)}
                      />
                    </Badge>
                  ))}
                  {safeSelected.length > 2 && (
                    <Badge variant="secondary" className="text-xs h-6 px-2">
                      +{safeSelected.length - 2} more
                    </Badge>
                  )}
                </>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[250px] p-0" align="start">
          <div className="p-3 border-b">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {safeSelected.length > 0 && (
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All ({safeSelected.length})
                </Button>
              </div>
            )}
            
            {filteredOptions.length > 0 ? (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => toggleOption(option)}
                    className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      safeSelected.includes(option) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {safeSelected.includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="flex-1 text-sm">{option}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchTerm ? 'No matching options' : 'No options available'}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomMultiSelectFilter;
