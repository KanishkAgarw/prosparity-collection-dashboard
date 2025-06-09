
import { useState } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
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

  const downloadTemplate = () => {
    // Create template data with example row and the exact 27 required columns
    const templateData = [
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Branch Name': 'Mumbai Branch',
        'RM Name': 'RM Name',
        'Dealer Name': 'Dealer Name',
        'Applicant Name': 'John Doe',
        'Applicant Mobile Number': '9876543210',
        'Applicant Current Address': 'Sample Address',
        'House Ownership': 'Own',
        'Co-Applicant Name': 'Co-Applicant Name',
        'Coapplicant Mobile Number': '9876543211',
        'Coapplicant Current Address': 'Co-Applicant Address',
        'Guarantor Name': 'Guarantor Name',
        'Guarantor Mobile Number': '9876543212',
        'Guarantor Current Address': 'Guarantor Address',
        'Reference Name': 'Reference Name',
        'Reference Mobile Number': '9876543213',
        'Reference Address': 'Reference Address',
        'FI Submission Location': 'Field Investigation Location',
        'Demand Date': '2024-01-15',
        'Repayment': 'Monthly',
        'Principle Due': 45000,
        'Interest Due': 2500,
        'EMI': 5000,
        'Last Month Bounce': 0,
        'Lender Name': 'Lender Name',
        'Status': 'Unpaid',
        'Team Lead': 'Team Lead Name'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Applicant ID
      { wch: 20 }, // Branch Name
      { wch: 15 }, // RM Name
      { wch: 25 }, // Dealer Name
      { wch: 25 }, // Applicant Name
      { wch: 15 }, // Applicant Mobile Number
      { wch: 30 }, // Applicant Current Address
      { wch: 15 }, // House Ownership
      { wch: 25 }, // Co-Applicant Name
      { wch: 15 }, // Coapplicant Mobile Number
      { wch: 30 }, // Coapplicant Current Address
      { wch: 25 }, // Guarantor Name
      { wch: 15 }, // Guarantor Mobile Number
      { wch: 30 }, // Guarantor Current Address
      { wch: 25 }, // Reference Name
      { wch: 15 }, // Reference Mobile Number
      { wch: 30 }, // Reference Address
      { wch: 25 }, // FI Submission Location
      { wch: 12 }, // Demand Date
      { wch: 15 }, // Repayment
      { wch: 12 }, // Principle Due
      { wch: 12 }, // Interest Due
      { wch: 12 }, // EMI
      { wch: 15 }, // Last Month Bounce
      { wch: 25 }, // Lender Name
      { wch: 12 }, // Status
      { wch: 20 }  // Team Lead
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications Template');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `applications-bulk-upload-template-${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
    
    toast.success('Template downloaded successfully!');
  };

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

      // Transform data to match database schema with the new column mapping
      const applications = jsonData.map((row: any) => ({
        applicant_id: row['Applicant ID'] || row['applicant_id'],
        applicant_name: row['Applicant Name'] || row['applicant_name'],
        branch_name: row['Branch Name'] || row['branch_name'],
        team_lead: row['Team Lead'] || row['team_lead'],
        rm_name: row['RM Name'] || row['rm_name'],
        dealer_name: row['Dealer Name'] || row['dealer_name'],
        lender_name: row['Lender Name'] || row['lender_name'],
        lms_status: row['Status'] || row['LMS Status'] || row['lms_status'] || row['status'] || 'Unpaid',
        emi_amount: parseFloat(row['EMI'] || row['EMI Amount'] || row['emi_amount'] || '0'),
        principle_due: parseFloat(row['Principle Due'] || row['principle_due'] || '0'),
        interest_due: parseFloat(row['Interest Due'] || row['interest_due'] || '0'),
        demand_date: row['Demand Date'] || row['demand_date'],
        user_id: user.id,
        // Additional fields
        applicant_mobile: row['Applicant Mobile Number'] || row['applicant_mobile'],
        applicant_address: row['Applicant Current Address'] || row['applicant_address'],
        house_ownership: row['House Ownership'] || row['house_ownership'],
        co_applicant_name: row['Co-Applicant Name'] || row['co_applicant_name'],
        co_applicant_mobile: row['Coapplicant Mobile Number'] || row['co_applicant_mobile'],
        co_applicant_address: row['Coapplicant Current Address'] || row['co_applicant_address'],
        guarantor_name: row['Guarantor Name'] || row['guarantor_name'],
        guarantor_mobile: row['Guarantor Mobile Number'] || row['guarantor_mobile'],
        guarantor_address: row['Guarantor Current Address'] || row['guarantor_address'],
        reference_name: row['Reference Name'] || row['reference_name'],
        reference_mobile: row['Reference Mobile Number'] || row['reference_mobile'],
        reference_address: row['Reference Address'] || row['reference_address'],
        fi_location: row['FI Submission Location'] || row['fi_location'],
        repayment: row['Repayment'] || row['repayment'],
        last_month_bounce: parseFloat(row['Last Month Bounce'] || row['last_month_bounce'] || '0')
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
          {/* Template Download Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Step 1: Download Template</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download the Excel template with the required format (27 columns)
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={downloadTemplate}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Step 2: Select File (Excel/CSV)
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
            <p><strong>Note:</strong> LMS Status can only be updated through this upload feature.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
