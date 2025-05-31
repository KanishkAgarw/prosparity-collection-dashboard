
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUserUploadProps {
  onUsersAdded: () => void;
}

interface ExcelUserData {
  'Email (User ID)': string;
  'Full Name': string;
  'Password': string;
}

const BulkUserUpload = ({ onUsersAdded }: BulkUserUploadProps) => {
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

  const handleExcelUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelUserData[];

      console.log('Parsed Excel data:', jsonData);

      if (jsonData.length === 0) {
        toast.error('No data found in Excel file');
        return;
      }

      // Validate required columns
      const requiredColumns = ['Email (User ID)', 'Full Name', 'Password'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      // Process users one by one
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const row of jsonData) {
        try {
          const email = String(row['Email (User ID)']).trim();
          const fullName = String(row['Full Name']).trim();
          const password = String(row['Password']).trim();

          // Basic validation
          if (!email || !fullName || !password) {
            results.failed++;
            results.errors.push(`Row with email "${email}": Missing required fields`);
            continue;
          }

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            results.failed++;
            results.errors.push(`Row with email "${email}": Invalid email format`);
            continue;
          }

          // Password length validation
          if (password.length < 6) {
            results.failed++;
            results.errors.push(`Row with email "${email}": Password must be at least 6 characters`);
            continue;
          }

          console.log('Creating user:', { email, fullName });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
              emailRedirectTo: undefined,
            }
          });

          if (error) {
            console.error('User creation error:', error);
            results.failed++;
            if (error.message.includes('User already registered')) {
              results.errors.push(`${email}: User already exists`);
            } else {
              results.errors.push(`${email}: ${error.message}`);
            }
          } else {
            console.log('User created successfully:', email);
            results.successful++;
          }
        } catch (error) {
          console.error('Unexpected error creating user:', error);
          results.failed++;
          results.errors.push(`${row['Email (User ID)'] || 'Unknown'}: Unexpected error`);
        }
      }

      // Show results
      if (results.successful > 0) {
        toast.success(`Successfully created ${results.successful} users!`);
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to create ${results.failed} users. Check console for details.`);
        console.log('Failed user creation details:', results.errors);
      }

      if (results.successful > 0) {
        onUsersAdded();
      }

      setSelectedFile(null);
      setOpen(false);
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
          Bulk Upload Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users via Excel</DialogTitle>
          <DialogDescription>
            Upload multiple users using an Excel file. Use the template format with Email, Full Name, and Password columns.
          </DialogDescription>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  );
};

export default BulkUserUpload;
