
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEmiMonth } from "@/utils/formatters";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EmiMonthSelectorProps {
  selectedMonth: string | null;
  onMonthChange: (month: string) => void;
  loading?: boolean;
}

const EmiMonthSelector = ({ selectedMonth, onMonthChange, loading = false }: EmiMonthSelectorProps) => {
  const { user } = useAuth();
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [fetchingMonths, setFetchingMonths] = useState(false);

  // Fetch all available EMI months
  useEffect(() => {
    const fetchEmiMonths = async () => {
      if (!user) return;

      setFetchingMonths(true);
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('demand_date')
          .not('demand_date', 'is', null)
          .order('demand_date', { ascending: false });

        if (error) {
          console.error('Error fetching EMI months:', error);
          return;
        }

        // Get unique months and sort them
        const uniqueMonths = [...new Set(data.map(app => app.demand_date))].filter(Boolean);
        const sortedMonths = uniqueMonths.sort().reverse(); // Latest first
        
        console.log('Available EMI months:', sortedMonths);
        setAvailableMonths(sortedMonths);

        // Auto-select latest month if no month is selected
        if (!selectedMonth && sortedMonths.length > 0) {
          console.log('Auto-selecting latest month:', sortedMonths[0]);
          onMonthChange(sortedMonths[0]);
        }
      } catch (error) {
        console.error('Error fetching EMI months:', error);
      } finally {
        setFetchingMonths(false);
      }
    };

    fetchEmiMonths();
  }, [user, selectedMonth, onMonthChange]);

  const isLoading = loading || fetchingMonths;

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <Select
        value={selectedMonth || ""}
        onValueChange={onMonthChange}
        disabled={isLoading || availableMonths.length === 0}
      >
        <SelectTrigger className="w-[140px] bg-white border-gray-300 focus:border-blue-500">
          <SelectValue 
            placeholder={isLoading ? "Loading..." : "Select month"} 
          />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg">
          {availableMonths.map((month) => (
            <SelectItem 
              key={month} 
              value={month}
              className="hover:bg-blue-50 focus:bg-blue-50"
            >
              <div className="flex items-center">
                <span className="font-medium text-blue-800">
                  {formatEmiMonth(month)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedMonth && (
        <span className="text-sm text-gray-600 font-medium">
          Selected: {formatEmiMonth(selectedMonth)}
        </span>
      )}
    </div>
  );
};

export default EmiMonthSelector;
