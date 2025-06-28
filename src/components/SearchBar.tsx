import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder = "Search by name, ID, dealer, lender, RM..." }: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);

  // Sync internal state if external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSearch = () => {
    onChange(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(''); // Immediately clear the search
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 text-sm w-full"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-gray-500 hover:text-gray-900"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} className="h-10">
        Search
      </Button>
    </div>
  );
};

export default SearchBar;
