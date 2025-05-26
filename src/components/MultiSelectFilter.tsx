
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}

const MultiSelectFilter = ({ label, options, selectedValues, onSelectionChange }: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(options);
    }
  };

  const handleOptionToggle = (option: string) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter(item => item !== option)
      : [...selectedValues, option];
    onSelectionChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return `All ${label}`;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} selected`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedValues.length === options.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All
            </label>
          </div>
          <div className="mt-2 space-y-1">
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={() => handleOptionToggle(option)}
                />
                <label htmlFor={option} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MultiSelectFilter;
