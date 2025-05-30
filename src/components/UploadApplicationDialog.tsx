
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadApplicationDialogProps {
  onApplicationAdded: () => void;
}

interface ExcelRowData {
  'Applicant ID': string;
  'Branch Name': string;
  'RM Name': string;
  'Dealer Name': string;
  'Applicant Name': string;
  'Applicant Mobile Number': string;
  'Applicant Current Address': string;
  'House Ownership': string;
  'Co-Applicant Name': string;
  'Coapplicant Mobile Number': string;
  'Coapplicant Current Address': string;
  'Guarantor Name': string;
  'Guarantor Mobile Number': string;
  'Guarantor Current Address': string;
  'Reference Name': string;
  'Reference Mobile Number': string;
  'Reference Address': string;
  'FI Submission Location': string;
  'Demand Date': string;
  'Repayment': string;
  'Principle Due': number;
  'Interest Due': number;
  'EMI': number;
  'Last Month Bounce': number;
  'Lender Name': string;
  'Status': string;
  'Team Lead': string;
}

const UploadApplicationDialog = ({ onApplicationAdded }: UploadApplicationDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setSelectedFile(file);
      } else {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Applicant ID': 'PROSAPP250225000011',
        'Branch Name': 'Bhopal',
        'RM Name': 'Imtiyaz Ali',
        'Dealer Name': 'Maa Bhawani Automobiles',
        'Applicant Name': 'Ravindra Deshraj',
        'Applicant Mobile Number': '9131299920',
        'Applicant Current Address': 'SANT ASHARAM NAGAR PHASE-3 KI JUGGI BAG MUNGALIYA Bhopal Huzur BHOPAL 462043 Madhya Pradesh',
        'House Ownership': 'Owned',
        'Co-Applicant Name': 'Raj Kumar',
        'Coapplicant Mobile Number': '7909466931',
        'Coapplicant Current Address': '',
        'Guarantor Name': '',
        'Guarantor Mobile Number': '',
        'Guarantor Current Address': '',
        'Reference Name': 'Aftab Khan',
        'Reference Mobile Number': '7869498395',
        'Reference Address': 'H No 1071Mother India Colony Idgah Hills 462001',
        'FI Submission Location': 'FI_PENDING 23.2337937 77.4502460',
        'Demand Date': '45813',
        'Repayment': '2nd',
        'Principle Due': 4114,
        'Interest Due': 3542,
        'EMI': 7656,
        'Last Month Bounce': 0,
        'Lender Name': 'Namdev',
        'Status': 'Paid',
        'Team Lead': 'Hemant Joshi'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    
    // Set column widths
    const wscols = [
      { wch: 20 }, // Applicant ID
      { wch: 15 }, // Branch Name
      { wch: 15 }, // RM Name
      { wch: 20 }, // Dealer Name
      { wch: 20 }, // Applicant Name
      { wch: 15 }, // Mobile
      { wch: 40 }, // Address
      { wch: 12 }, // House Ownership
      { wch: 15 }, // Co-Applicant Name
      { wch: 15 }, // Co-Applicant Mobile
      { wch: 30 }, // Co-Applicant Address
      { wch: 15 }, // Guarantor Name
      { wch: 15 }, // Guarantor Mobile
      { wch: 30 }, // Guarantor Address
      { wch: 15 }, // Reference Name
      { wch: 15 }, // Reference Mobile
      { wch: 30 }, // Reference Address
      { wch: 25 }, // FI Location
      { wch: 12 }, // Demand Date
      { wch: 10 }, // Repayment
      { wch: 12 }, // Principle Due
      { wch: 12 }, // Interest Due
      { wch: 10 }, // EMI
      { wch: 15 }, // Last Month Bounce
      { wch: 15 }, // Lender Name
      { wch: 12 }, // Status
      { wch: 15 }  // Team Lead
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, 'applications_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const handleExcelUpload = async () => {
    if (!selectedFile || !user) return;
    
    setLoading(true);
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];

      console.log('Parsed Excel data:', jsonData);

      if (jsonData.length === 0) {
        toast.error('No data found in Excel file');
        return;
      }

      // Validate required columns
      const requiredColumns = [
        'Applicant ID',
        'Branch Name',
        'RM Name',
        'Dealer Name',
        'Applicant Name',
        'Lender Name',
        'Status',
        'Team Lead'
      ];

      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      // Process and insert data
      const applicationsToInsert = jsonData.map(row => ({
        applicant_id: String(row['Applicant ID']),
        branch_name: String(row['Branch Name']),
        rm_name: String(row['RM Name']),
        dealer_name: String(row['Dealer Name']),
        applicant_name: String(row['Applicant Name']),
        applicant_mobile: row['Applicant Mobile Number'] ? String(row['Applicant Mobile Number']) : null,
        applicant_address: row['Applicant Current Address'] ? String(row['Applicant Current Address']) : null,
        house_ownership: row['House Ownership'] ? String(row['House Ownership']) : null,
        co_applicant_name: row['Co-Applicant Name'] ? String(row['Co-Applicant Name']) : null,
        co_applicant_mobile: row['Coapplicant Mobile Number'] ? String(row['Coapplicant Mobile Number']) : null,
        co_applicant_address: row['Coapplicant Current Address'] ? String(row['Coapplicant Current Address']) : null,
        guarantor_name: row['Guarantor Name'] ? String(row['Guarantor Name']) : null,
        guarantor_mobile: row['Guarantor Mobile Number'] ? String(row['Guarantor Mobile Number']) : null,
        guarantor_address: row['Guarantor Current Address'] ? String(row['Guarantor Current Address']) : null,
        reference_name: row['Reference Name'] ? String(row['Reference Name']) : null,
        reference_mobile: row['Reference Mobile Number'] ? String(row['Reference Mobile Number']) : null,
        reference_address: row['Reference Address'] ? String(row['Reference Address']) : null,
        fi_location: row['FI Submission Location'] ? String(row['FI Submission Location']) : null,
        demand_date: row['Demand Date'] ? String(row['Demand Date']) : null,
        repayment: row['Repayment'] ? String(row['Repayment']) : null,
        principle_due: row['Principle Due'] ? Number(row['Principle Due']) : 0,
        interest_due: row['Interest Due'] ? Number(row['Interest Due']) : 0,
        emi_amount: Number(row['EMI']),
        last_month_bounce: row['Last Month Bounce'] ? Number(row['Last Month Bounce']) : 0,
        lender_name: String(row['Lender Name']),
        status: String(row['Status']),
        team_lead: String(row['Team Lead']),
        user_id: user.id
      }));

      console.log('Applications to insert:', applicationsToInsert);

      const { error } = await supabase
        .from('applications')
        .insert(applicationsToInsert);

      if (error) {
        console.error('Database error:', error);
        if (error.code === '23505') {
          toast.error('Some application IDs already exist');
        } else {
          toast.error('Failed to upload applications');
        }
      } else {
        toast.success(`Successfully uploaded ${applicationsToInsert.length} applications!`);
        setSelectedFile(null);
        setOpen(false);
        onApplicationAdded();
      }
    } catch (error) {
      console.error('Excel processing error:', error);
      toast.error('Failed to process Excel file. Please check the format.');
    } finally {
      setLoading(false);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Applications via Excel</DialogTitle>
          <DialogDescription>
            Upload multiple applications using an Excel file. Download the template to get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Excel Template
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">Select Excel File</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: .xlsx, .xls
              </p>
            </div>
            
            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm">Selected file: {selectedFile.name}</p>
                <p className="text-xs text-gray-500">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
            
            <Button 
              onClick={handleExcelUpload}
              disabled={!selectedFile || loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Upload Excel File'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
