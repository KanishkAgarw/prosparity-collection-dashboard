
import { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { processBulkApplications } from '@/utils/bulkOperations';
import { useAuth } from '@/hooks/useAuth';

interface UploadApplicationDialogProps {
  onApplicationsAdded: () => void;
}

const UploadApplicationDialog = ({ onApplicationsAdded }: UploadApplicationDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    toast.loading('Processing file...', { id: 'upload' });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Parsed data:', jsonData);

      if (jsonData.length === 0) {
        toast.error('No data found in the file', { id: 'upload' });
        return;
      }

      // Transform data to match database schema
      const applications = jsonData.map((row: any) => ({
        applicant_id: row['Applicant ID'] || row['applicant_id'],
        applicant_name: row['Applicant Name'] || row['applicant_name'],
        branch_name: row['Branch'] || row['branch_name'],
        team_lead: row['Team Lead'] || row['team_lead'],
        rm_name: row['RM Name'] || row['rm_name'],
        dealer_name: row['Dealer'] || row['dealer_name'],
        lender_name: row['Lender'] || row['lender_name'],
        status: row['Status'] || row['status'] || 'Unpaid',
        emi_amount: parseFloat(row['EMI Amount'] || row['emi_amount'] || '0'),
        principle_due: parseFloat(row['Principle Due'] || row['principle_due'] || '0'),
        interest_due: parseFloat(row['Interest Due'] || row['interest_due'] || '0'),
        demand_date: row['Demand Date'] || row['demand_date'],
        ptp_date: row['PTP Date'] || row['ptp_date'] || null,
        paid_date: row['Paid Date'] || row['paid_date'] || null,
        user_id: user.id,
        // Additional fields
        applicant_mobile: row['Applicant Mobile'] || row['applicant_mobile'],
        applicant_address: row['Applicant Address'] || row['applicant_address'],
        house_ownership: row['House Ownership'] || row['house_ownership'],
        co_applicant_name: row['Co-Applicant Name'] || row['co_applicant_name'],
        co_applicant_mobile: row['Co-Applicant Mobile'] || row['co_applicant_mobile'],
        co_applicant_address: row['Co-Applicant Address'] || row['co_applicant_address'],
        guarantor_name: row['Guarantor Name'] || row['guarantor_name'],
        guarantor_mobile: row['Guarantor Mobile'] || row['guarantor_mobile'],
        guarantor_address: row['Guarantor Address'] || row['guarantor_address'],
        reference_name: row['Reference Name'] || row['reference_name'],
        reference_mobile: row['Reference Mobile'] || row['reference_mobile'],
        reference_address: row['Reference Address'] || row['reference_address'],
        fi_location: row['FI Location'] || row['fi_location'],
        repayment: row['Repayment'] || row['repayment'],
        last_month_bounce: parseFloat(row['Last Month Bounce'] || row['last_month_bounce'] || '0'),
        rm_comments: row['RM Comments'] || row['rm_comments']
      }));

      console.log('Transformed applications:', applications);

      const results = await processBulkApplications(applications);

      if (results.errors.length > 0) {
        console.error('Upload errors:', results.errors);
        toast.error(`Upload completed with errors. ${results.successful} successful, ${results.updated} updated, ${results.failed} failed.`, { id: 'upload' });
      } else {
        toast.success(`Upload successful! ${results.successful} new applications added, ${results.updated} applications updated.`, { id: 'upload' });
      }

      onApplicationsAdded();
      setOpen(false);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file', { id: 'upload' });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Applications
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Applications
          </DialogTitle>
          <DialogDescription>
            Upload Excel/CSV files containing application data. The system will automatically update existing applications or add new ones.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Select File (Excel/CSV)
            </label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
          <div className="text-xs text-gray-500">
            <p>Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</p>
            <p>The system will update existing applications based on Applicant ID and add new ones.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
