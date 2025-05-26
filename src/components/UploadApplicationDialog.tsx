
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
  'Application ID': string;
  'Applicant Name': string;
  'Branch': string;
  'Team Lead': string;
  'RM': string;
  'Dealer': string;
  'Lender': string;
  'EMI Due': number;
  'EMI Month': string;
  'Status': string;
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
        'Application ID': 'APP001',
        'Applicant Name': 'John Doe',
        'Branch': 'Mumbai',
        'Team Lead': 'Manager Name',
        'RM': 'RM Name',
        'Dealer': 'Dealer Name',
        'Lender': 'Bank Name',
        'EMI Due': 25000,
        'EMI Month': 'Jan 2024',
        'Status': 'Unpaid'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    
    // Set column widths
    const wscols = [
      { wch: 15 }, // Application ID
      { wch: 20 }, // Applicant Name
      { wch: 15 }, // Branch
      { wch: 15 }, // Team Lead
      { wch: 15 }, // RM
      { wch: 15 }, // Dealer
      { wch: 15 }, // Lender
      { wch: 12 }, // EMI Due
      { wch: 12 }, // EMI Month
      { wch: 15 }  // Status
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
        'Application ID',
        'Applicant Name', 
        'Branch',
        'Team Lead',
        'RM',
        'Dealer',
        'Lender',
        'EMI Due',
        'EMI Month',
        'Status'
      ];

      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      // Process and insert data
      const applicationsToInsert = jsonData.map(row => ({
        application_id: String(row['Application ID']),
        applicant_name: String(row['Applicant Name']),
        branch: String(row['Branch']),
        team_lead: String(row['Team Lead']),
        rm: String(row['RM']),
        dealer: String(row['Dealer']),
        lender: String(row['Lender']),
        emi_due: Number(row['EMI Due']),
        emi_month: String(row['EMI Month']),
        status: String(row['Status']),
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
