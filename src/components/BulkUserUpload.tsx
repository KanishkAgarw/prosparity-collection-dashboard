
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelUserData {
  'Email (User ID)': string;
  'Full Name': string;
  'Password': string;
  'Send Reset Email': string;
}

const BulkUserUpload = () => {
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
        'Email (User ID)': 'user1@example.com',
        'Full Name': 'John Doe',
        'Password': 'SecurePass123!',
        'Send Reset Email': 'No'
      },
      {
        'Email (User ID)': 'user2@example.com',
        'Full Name': 'Jane Smith',
        'Password': 'AnotherPass456!',
        'Send Reset Email': 'Yes'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    // Set column widths
    const wscols = [
      { wch: 25 }, // Email
      { wch: 20 }, // Full Name
      { wch: 15 }, // Password
      { wch: 15 }  // Send Reset Email
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, 'users_template.xlsx');
    toast.success('User template downloaded successfully');
  };

  const handleBulkUserUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelUserData[];

      console.log('Parsed Excel user data:', jsonData);

      if (jsonData.length === 0) {
        toast.error('No data found in Excel file');
        return;
      }

      // Validate required columns
      const requiredColumns = [
        'Email (User ID)',
        'Full Name',
        'Password'
      ];

      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process users one by one
      for (const row of jsonData) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: String(row['Email (User ID)']),
            password: String(row['Password']),
            options: {
              data: {
                full_name: String(row['Full Name']),
              },
              emailRedirectTo: undefined,
            }
          });

          if (error) {
            console.error(`Error creating user ${row['Email (User ID)']}:`, error);
            errorCount++;
          } else {
            console.log(`User created successfully: ${row['Email (User ID)']}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Unexpected error creating user ${row['Email (User ID)']}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} users!`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} users. Check console for details.`);
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
          <Users className="h-4 w-4 mr-2" />
          Bulk Upload Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users via Excel</DialogTitle>
          <DialogDescription>
            Upload multiple users using an Excel file. Download the template to get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download User Template
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-excel-file">Select Excel File</Label>
              <Input
                id="user-excel-file"
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
              onClick={handleBulkUserUpload}
              disabled={!selectedFile || loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Upload Users'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUserUpload;
