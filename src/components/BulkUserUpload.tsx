
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUserUploadProps {
  onUsersAdded: () => void;
}

interface ExcelUserData {
  'Email (User ID)': string;
  'Full Name': string;
  'Password': string;
  'Role'?: string;
}

const BulkUserUpload = ({ onUsersAdded }: BulkUserUploadProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [defaultRole, setDefaultRole] = useState<'admin' | 'user'>('user');

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
    // Create template data with example row including Role column
    const templateData = [
      {
        'Email (User ID)': 'user@example.com',
        'Full Name': 'John Doe',
        'Password': 'SecurePassword123',
        'Role': 'user'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 25 }, // Email (User ID)
      { wch: 20 }, // Full Name
      { wch: 15 }, // Password
      { wch: 10 }  // Role
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Template');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `user-bulk-upload-template-${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
    
    toast.success('Template downloaded successfully!');
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

      // Prepare user data for the Edge Function with role support
      const users = jsonData.map(row => ({
        email: String(row['Email (User ID)']).trim(),
        fullName: String(row['Full Name']).trim(),
        password: String(row['Password']).trim(),
        role: row['Role'] ? String(row['Role']).toLowerCase() : defaultRole
      }));

      console.log('Calling Edge Function with users:', users.length);

      // Call the Edge Function to create users
      const { data, error } = await supabase.functions.invoke('create-bulk-users', {
        body: { users }
      });

      if (error) {
        console.error('Edge Function error:', error);
        toast.error('Failed to process users. Please try again.');
        return;
      }

      const results = data as {
        successful: number;
        failed: number;
        errors: string[];
      };

      // Show results
      if (results.successful > 0) {
        toast.success(`Successfully created/updated ${results.successful} users with roles!`);
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to process ${results.failed} users. Check console for details.`);
        console.log('Failed user processing details:', results.errors);
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
          <DialogTitle>Bulk Upload Users</DialogTitle>
          <DialogDescription>
            Upload multiple users with role assignment using an Excel file. Download the template to get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Step 1: Download Template</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download the Excel template with Role column for user management
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

          {/* Default Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="default-role">Default Role (if not specified in Excel)</Label>
            <Select value={defaultRole} onValueChange={(value: 'admin' | 'user') => setDefaultRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select default role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              This role will be assigned to users where the Role column is empty
            </p>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Step 2: Upload Your File</h4>
              <Label htmlFor="excel-file">Select Excel File</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: .xlsx, .xls
              </p>
            </div>
            
            {selectedFile && (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm font-medium text-green-800">Selected file: {selectedFile.name}</p>
                <p className="text-xs text-green-600">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExcelUpload}
              disabled={!selectedFile || loading}
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
