
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}

const MultiSelectFilter = ({ 
  label, 
  options, 
  selected, 
  onSelectionChange,
  placeholder = "Select options..."
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onSelectionChange(newSelected);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-between min-w-[200px] text-left font-normal"
          >
            <span className="truncate">
              {selected.length === 0 
                ? label 
                : selected.length === 1
                ? selected[0]
                : `${selected.length} selected`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 z-50" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {selected.length > 0 && (
                <div className="p-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All ({selected.length})
                  </Button>
                </div>
              )}
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => toggleOption(option)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      selected.includes(option) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {selected.includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="flex-1 truncate">{option}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.slice(0, 3).map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
          {selected.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selected.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
