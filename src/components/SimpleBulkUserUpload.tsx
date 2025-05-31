
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, Users, X, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelUserData {
  'Email': string;
  'Full Name': string;
  'Password': string;
}

interface UploadResult {
  email: string;
  status: 'success' | 'exists' | 'failed';
  error?: string;
}

const SimpleBulkUserUpload = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState('');
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setSelectedFile(file);
        setResults([]);
        setShowResults(false);
      } else {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Email': 'user1@example.com',
        'Full Name': 'John Doe',
        'Password': 'SecurePass123!'
      },
      {
        'Email': 'user2@example.com',
        'Full Name': 'Jane Smith',
        'Password': 'AnotherPass456!'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    const wscols = [
      { wch: 25 }, // Email
      { wch: 20 }, // Full Name
      { wch: 15 }  // Password
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, 'bulk_users_template.xlsx');
    toast.success('Template downloaded successfully');
  };

  const createUser = async (userData: ExcelUserData): Promise<UploadResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.Email.trim(),
        password: userData.Password,
        options: {
          data: {
            full_name: userData['Full Name'].trim(),
          },
          emailRedirectTo: undefined,
        }
      });

      if (error) {
        if (error.message.includes('User already registered') || error.status === 422) {
          return {
            email: userData.Email,
            status: 'exists'
          };
        }
        return {
          email: userData.Email,
          status: 'failed',
          error: error.message
        };
      }

      return {
        email: userData.Email,
        status: 'success'
      };
    } catch (error: any) {
      return {
        email: userData.Email,
        status: 'failed',
        error: error.message || 'Unknown error'
      };
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);
    
    try {
      // Parse Excel file
      const fileBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelUserData[];

      if (jsonData.length === 0) {
        toast.error('No data found in Excel file');
        return;
      }

      // Validate required columns
      const requiredColumns = ['Email', 'Full Name', 'Password'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      // Validate data
      const validUsers = jsonData.filter(user => {
        const email = user.Email?.trim();
        const fullName = user['Full Name']?.trim();
        const password = user.Password?.trim();
        
        return email && fullName && password && email.includes('@');
      });

      if (validUsers.length === 0) {
        toast.error('No valid user data found');
        return;
      }

      if (validUsers.length !== jsonData.length) {
        toast.warning(`${jsonData.length - validUsers.length} rows skipped due to invalid data`);
      }

      // Limit to 20 users max
      const usersToProcess = validUsers.slice(0, 20);
      if (validUsers.length > 20) {
        toast.info('Processing first 20 users. Upload remaining users separately.');
      }

      const uploadResults: UploadResult[] = [];

      // Process users one by one
      for (let i = 0; i < usersToProcess.length; i++) {
        const user = usersToProcess[i];
        setCurrentUser(user.Email);
        setProgress(((i + 1) / usersToProcess.length) * 100);

        const result = await createUser(user);
        uploadResults.push(result);

        // Wait 4 seconds between requests to avoid rate limits
        if (i < usersToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }

      setResults(uploadResults);
      setShowResults(true);

      // Show summary
      const successful = uploadResults.filter(r => r.status === 'success').length;
      const existing = uploadResults.filter(r => r.status === 'exists').length;
      const failed = uploadResults.filter(r => r.status === 'failed').length;

      if (successful > 0) {
        toast.success(`Successfully created ${successful} users`);
      }
      if (existing > 0) {
        toast.info(`${existing} users already existed`);
      }
      if (failed > 0) {
        toast.error(`${failed} users failed to create`);
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to process Excel file');
    } finally {
      setLoading(false);
      setCurrentUser('');
    }
  };

  const handleCancel = () => {
    setLoading(false);
    setProgress(0);
    setCurrentUser('');
    toast.info('Upload cancelled');
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setResults([]);
    setShowResults(false);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Bulk Upload Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users</DialogTitle>
          <DialogDescription>
            Upload multiple users using an Excel file. Maximum 20 users per upload.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This tool processes users slowly (4 seconds between each) to avoid rate limits. 
              Maximum 20 users per upload session.
            </AlertDescription>
          </Alert>

          {!showResults && (
            <>
              <div className="flex justify-center">
                <Button onClick={downloadTemplate} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-file">Select Excel File</Label>
                  <Input
                    id="user-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Required columns: Email, Full Name, Password
                  </p>
                </div>
                
                {selectedFile && !loading && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Selected: {selectedFile.name}</p>
                    <p className="text-xs text-gray-500">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}

                {loading && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {Math.round(progress)}%</span>
                      <Button onClick={handleCancel} variant="destructive" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                    <Progress value={progress} className="w-full" />
                    {currentUser && (
                      <p className="text-sm text-gray-600">Creating: {currentUser}</p>
                    )}
                  </div>
                )}
                
                {!loading && (
                  <Button 
                    onClick={handleBulkUpload}
                    disabled={!selectedFile}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Start Upload
                  </Button>
                )}
              </div>
            </>
          )}

          {showResults && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Upload Results</h3>
                <Button onClick={resetUpload} variant="outline" size="sm">
                  Upload More Users
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </p>
                  <p className="text-sm text-green-700">Created</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <p className="text-2xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'exists').length}
                  </p>
                  <p className="text-sm text-yellow-700">Already Exist</p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <p className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'failed').length}
                  </p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{result.email}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'success' ? 'bg-green-100 text-green-800' :
                        result.status === 'exists' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'success' ? 'Created' :
                         result.status === 'exists' ? 'Exists' : 'Failed'}
                      </span>
                      {result.error && (
                        <span className="text-xs text-red-600" title={result.error}>
                          ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleBulkUserUpload;
