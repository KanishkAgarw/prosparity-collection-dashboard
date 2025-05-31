
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Download, Users, Pause, Play, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { sleep, retryWithBackoff, BulkOperationProgress, ProgressCallback } from '@/utils/bulkOperations';

interface ExcelUserData {
  'Email (User ID)': string;
  'Full Name': string;
  'Password': string;
  'Send Reset Email': string;
}

const BulkUserUpload = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<BulkOperationProgress>({
    current: 0,
    total: 0,
    success: 0,
    failed: 0
  });
  const [delayBetweenRequests, setDelayBetweenRequests] = useState(1500); // 1.5 seconds default
  const [batchSize, setBatchSize] = useState(5); // Process 5 users at a time

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setSelectedFile(file);
        // Reset progress when new file is selected
        setProgress({ current: 0, total: 0, success: 0, failed: 0 });
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

  const createSingleUser = async (userData: ExcelUserData) => {
    return await retryWithBackoff(
      async () => {
        const { data, error } = await supabase.auth.signUp({
          email: String(userData['Email (User ID)']),
          password: String(userData['Password']),
          options: {
            data: {
              full_name: String(userData['Full Name']),
            },
            emailRedirectTo: undefined,
          }
        });

        if (error) {
          throw new Error(`Failed to create user ${userData['Email (User ID)']}: ${error.message}`);
        }

        return data;
      },
      {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 10000
      }
    );
  };

  const handleBulkUserUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setPaused(false);
    
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

      // Initialize progress
      const totalUsers = jsonData.length;
      setProgress({
        current: 0,
        total: totalUsers,
        success: 0,
        failed: 0
      });

      let successCount = 0;
      let errorCount = 0;

      // Process users in batches
      for (let i = 0; i < jsonData.length; i += batchSize) {
        if (paused) {
          console.log('Bulk upload paused by user');
          break;
        }

        const batch = jsonData.slice(i, Math.min(i + batchSize, jsonData.length));
        
        // Process batch sequentially with delays
        for (const userData of batch) {
          if (paused) break;

          try {
            setProgress(prev => ({
              ...prev,
              current: i + batch.indexOf(userData) + 1,
              currentItem: userData['Email (User ID)']
            }));

            await createSingleUser(userData);
            successCount++;
            
            setProgress(prev => ({
              ...prev,
              success: successCount
            }));

            console.log(`User created successfully: ${userData['Email (User ID)']}`);
            
            // Add delay between requests to avoid rate limiting
            if (i + batch.indexOf(userData) < jsonData.length - 1) {
              await sleep(delayBetweenRequests);
            }
            
          } catch (error: any) {
            console.error(`Error creating user ${userData['Email (User ID)']}:`, error);
            errorCount++;
            
            setProgress(prev => ({
              ...prev,
              failed: errorCount
            }));
          }
        }

        // Pause between batches
        if (i + batchSize < jsonData.length && !paused) {
          await sleep(delayBetweenRequests * 2); // Longer pause between batches
        }
      }

      // Final results
      if (!paused) {
        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} users!`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to create ${errorCount} users. Check console for details.`);
        }

        setSelectedFile(null);
        setOpen(false);
      } else {
        toast.info('Bulk upload paused. You can resume or start over.');
      }

    } catch (error) {
      console.error('Excel processing error:', error);
      toast.error('Failed to process Excel file. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = () => {
    setPaused(!paused);
    if (paused) {
      toast.info('Resuming bulk upload...');
    } else {
      toast.info('Pausing bulk upload...');
    }
  };

  const handleCancel = () => {
    setPaused(true);
    setLoading(false);
    setProgress({ current: 0, total: 0, success: 0, failed: 0 });
    toast.info('Bulk upload cancelled');
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Bulk Upload Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users via Excel</DialogTitle>
          <DialogDescription>
            Upload multiple users using an Excel file. The system will handle rate limits automatically with delays and retries.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download User Template
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delay">Delay Between Requests (ms)</Label>
              <Input
                id="delay"
                type="number"
                value={delayBetweenRequests}
                onChange={(e) => setDelayBetweenRequests(Number(e.target.value))}
                min={500}
                max={10000}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 1000-2000ms
              </p>
            </div>
            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                min={1}
                max={20}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Users per batch
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-excel-file">Select Excel File</Label>
              <Input
                id="user-excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={loading}
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

            {loading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress: {progress.current} / {progress.total}</span>
                  <span>Success: {progress.success} | Failed: {progress.failed}</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
                {progress.currentItem && (
                  <p className="text-sm text-gray-600">
                    {paused ? 'Paused at:' : 'Creating:'} {progress.currentItem}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handlePauseResume}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {paused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                    {paused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {!loading && (
              <Button 
                onClick={handleBulkUserUpload}
                disabled={!selectedFile}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Start Bulk Upload
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUserUpload;
