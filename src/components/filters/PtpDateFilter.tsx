
import CustomMultiSelectFilter from "@/components/CustomMultiSelectFilter";
import { getPtpDateCategoryLabel } from "@/utils/ptpDateUtils";

interface PtpDateFilterProps {
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  availableOptions: string[];
}

const PtpDateFilter = ({ selectedValues, onValueChange, availableOptions }: PtpDateFilterProps) => {
  // Map internal values to display labels
  const displayOptions = availableOptions.map(value => ({
    value,
    label: getPtpDateCategoryLabel(value as any)
  }));

  // Get display labels for selected values
  const selectedLabels = selectedValues.map(value => 
    getPtpDateCategoryLabel(value as any)
  );

  const handleChange = (selectedLabels: string[]) => {
    // Map display labels back to internal values
    const internalValues = selectedLabels.map(label => {
      const option = displayOptions.find(opt => opt.label === label);
      return option?.value || label;
    });
    onValueChange(internalValues);
  };

  return (
    <CustomMultiSelectFilter
      label="PTP Date"
      options={displayOptions.map(opt => opt.label)}
      selected={selectedLabels}
      onSelectionChange={handleChange}
      placeholder="Select PTP dates"
    />
  );
};

export default PtpDateFilter;
