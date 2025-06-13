
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExportDialogProps {
  onExportFull: () => void;
  onExportPtpComments: () => void;
}

type ExportType = 'full' | 'ptp-comments';

const ExportDialog = ({ onExportFull, onExportPtpComments }: ExportDialogProps) => {
  const [selectedType, setSelectedType] = useState<ExportType>('ptp-comments');
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = () => {
    if (selectedType === 'full') {
      onExportFull();
    } else {
      onExportPtpComments();
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Download className="h-3 w-3 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={selectedType} onValueChange={(value) => setSelectedType(value as ExportType)}>
            <Card className={`cursor-pointer transition-colors ${selectedType === 'ptp-comments' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ptp-comments" id="ptp-comments" />
                  <Label htmlFor="ptp-comments" className="cursor-pointer">
                    <CardTitle className="text-sm">PTP + Comments Report</CardTitle>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Simplified report with: Applicant ID, Branch Name, RM Name, Dealer Name, Applicant Name, PTP Date, and Comment Trail
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${selectedType === 'full' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="cursor-pointer">
                    <CardTitle className="text-sm">Full Report</CardTitle>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Complete report with all available fields including contact details, financial information, and status
                </CardDescription>
              </CardContent>
            </Card>
          </RadioGroup>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleExport} size="sm">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
