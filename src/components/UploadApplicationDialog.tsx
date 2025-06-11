import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { processBulkApplications, recoverFinancialData, getRecoveryPreview } from '@/utils/bulkOperations';
import { useAuth } from '@/hooks/useAuth';

interface UploadApplicationDialogProps {
  onApplicationsAdded: () => void;
}

type UploadMode = 'add' | 'update' | 'mixed';

const UploadApplicationDialog = ({ onApplicationsAdded }: UploadApplicationDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('mixed');
  const [recovering, setRecovering] = useState(false);

  const downloadTemplate = () => {
    // Create template data with example row and the exact 29 required columns (including Collection RM and Status)
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
        'Team Lead': 'Team Lead Name',
        'Collection RM': 'Collection RM Name',
        'Status': 'Unpaid'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }
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

  const handleDataRecovery = async () => {
    setRecovering(true);
    toast.loading('Recovering financial data...', { id: 'recovery' });

    try {
      const result = await recoverFinancialData();
      
      if (result.success) {
        if (result.recoveredCount && result.recoveredCount > 0) {
          toast.success(
            `✅ Recovery completed!\n` +
            `📊 ${result.recoveredCount} applications recovered\n` +
            `📋 Total affected: ${result.totalAffected}` +
            (result.errors ? `\n⚠️ ${result.errors.length} errors` : ''),
            { 
              id: 'recovery',
              duration: 8000 
            }
          );
          onApplicationsAdded(); // Refresh the data
        } else {
          toast.info('No data recovery needed - all financial fields appear to be correct.', { 
            id: 'recovery',
            duration: 5000 
          });
        }
      } else {
        toast.error(`Recovery failed: ${result.error}`, { 
          id: 'recovery',
          duration: 8000 
        });
      }
    } catch (error) {
      console.error('Recovery error:', error);
      toast.error(`Recovery error: ${error}`, { 
        id: 'recovery',
        duration: 8000 
      });
    } finally {
      setRecovering(false);
    }
  };

  const showRecoveryPreview = async () => {
    try {
      const preview = await getRecoveryPreview();
      
      if (preview.success && preview.affectedApplications > 0) {
        console.log('Recovery preview:', preview.preview);
        toast.info(
          `🔍 Recovery Preview:\n` +
          `📊 ${preview.affectedApplications} applications need recovery\n` +
          `💾 Financial fields will be restored from audit logs`,
          { duration: 8000 }
        );
      } else {
        toast.info('✅ No applications need financial data recovery.', { duration: 5000 });
      }
    } catch (error) {
      toast.error(`Preview error: ${error}`, { duration: 5000 });
    }
  };

  const parseApplicationData = (row: any, uploadMode: UploadMode) => {
    const baseData: any = {
      applicant_id: row['Applicant ID'] || row['applicant_id'],
      uploadMode // Pass the upload mode to the processing function
    };

    // Always include user_id
    if (user?.id) {
      baseData.user_id = user.id;
    }

    // Field mapping with safe parsing
    const fieldMappings = [
      { excel: ['Applicant Name', 'applicant_name'], db: 'applicant_name' },
      { excel: ['Branch Name', 'branch_name'], db: 'branch_name' },
      { excel: ['Team Lead', 'team_lead'], db: 'team_lead' },
      { excel: ['RM Name', 'rm_name'], db: 'rm_name' },
      { excel: ['Dealer Name', 'dealer_name'], db: 'dealer_name' },
      { excel: ['Lender Name', 'lender_name'], db: 'lender_name' },
      { excel: ['LMS Status', 'lms_status'], db: 'lms_status' },
      { excel: ['Demand Date', 'demand_date'], db: 'demand_date' },
      { excel: ['Collection RM', 'collection_rm'], db: 'collection_rm' },
      { excel: ['Status', 'status'], db: 'status' },
      // Additional contact fields
      { excel: ['Applicant Mobile Number', 'applicant_mobile'], db: 'applicant_mobile' },
      { excel: ['Applicant Current Address', 'applicant_address'], db: 'applicant_address' },
      { excel: ['House Ownership', 'house_ownership'], db: 'house_ownership' },
      { excel: ['Co-Applicant Name', 'co_applicant_name'], db: 'co_applicant_name' },
      { excel: ['Coapplicant Mobile Number', 'co_applicant_mobile'], db: 'co_applicant_mobile' },
      { excel: ['Coapplicant Current Address', 'co_applicant_address'], db: 'co_applicant_address' },
      { excel: ['Guarantor Name', 'guarantor_name'], db: 'guarantor_name' },
      { excel: ['Guarantor Mobile Number', 'guarantor_mobile'], db: 'guarantor_mobile' },
      { excel: ['Guarantor Current Address', 'guarantor_address'], db: 'guarantor_address' },
      { excel: ['Reference Name', 'reference_name'], db: 'reference_name' },
      { excel: ['Reference Mobile Number', 'reference_mobile'], db: 'reference_mobile' },
      { excel: ['Reference Address', 'reference_address'], db: 'reference_address' },
      { excel: ['FI Submission Location', 'fi_location'], db: 'fi_location' },
      { excel: ['Repayment', 'repayment'], db: 'repayment' }
    ];

    // Financial fields - handle with extra care for update mode
    const financialFields = [
      { excel: ['EMI', 'EMI Amount', 'emi_amount'], db: 'emi_amount' },
      { excel: ['Principle Due', 'principle_due'], db: 'principle_due' },
      { excel: ['Interest Due', 'interest_due'], db: 'interest_due' },
      { excel: ['Last Month Bounce', 'last_month_bounce'], db: 'last_month_bounce' }
    ];

    // Process regular fields
    fieldMappings.forEach(({ excel, db }) => {
      const value = excel.find(key => row[key] !== undefined && row[key] !== null && row[key] !== '')?.[0];
      if (value !== undefined) {
        const actualValue = row[value];
        if (actualValue !== undefined && actualValue !== null && actualValue !== '') {
          baseData[db] = actualValue;
        }
      }
    });

    // Process financial fields with special handling for update mode
    financialFields.forEach(({ excel, db }) => {
      const value = excel.find(key => row[key] !== undefined && row[key] !== null)?.[0];
      if (value !== undefined) {
        const actualValue = row[value];
        const numericValue = parseFloat(actualValue);
        
        // For update mode, only include financial fields if they are explicitly provided and non-zero
        if (uploadMode === 'update') {
          if (!isNaN(numericValue) && numericValue > 0) {
            baseData[db] = numericValue;
          }
          // Don't include the field if it's zero or empty in update mode
        } else {
          // For add and mixed modes, include with default value
          baseData[db] = !isNaN(numericValue) ? numericValue : 0;
        }
      }
    });

    return baseData;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    toast.loading('Processing file...', { id: 'upload' });

    try {
      console.log('Starting file upload process with mode:', uploadMode);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Parsed data from file:', jsonData.length, 'rows');

      if (jsonData.length === 0) {
        toast.error('No data found in the file', { id: 'upload' });
        return;
      }

      // Transform data with safer parsing
      const applications = jsonData.map((row: any, index: number) => {
        console.log(`Transforming row ${index + 1}:`, row);
        return parseApplicationData(row, uploadMode);
      });

      console.log('Transformed applications ready for processing:', applications.length);

      const results = await processBulkApplications(applications, user);
      console.log('Bulk processing results:', results);

      // Provide detailed feedback based on results
      if (results.errors.length > 0) {
        console.error('Upload errors:', results.errors);
        
        let errorMessage = `Upload completed with some issues:\n`;
        errorMessage += `✅ ${results.successful} new applications added\n`;
        errorMessage += `✅ ${results.updated} applications updated\n`;
        if (results.statusUpdated > 0) {
          errorMessage += `✅ ${results.statusUpdated} statuses updated\n`;
        }
        errorMessage += `❌ ${results.failed} failed\n`;
        errorMessage += `\nFirst few errors:\n${results.errors.slice(0, 3).join('\n')}`;
        
        toast.error(errorMessage, { 
          id: 'upload',
          duration: 10000
        });
      } else {
        let message = `🎉 Upload successful!\n`;
        message += `✅ ${results.successful} new applications added\n`;
        message += `✅ ${results.updated} applications updated`;
        if (results.statusUpdated > 0) {
          message += `\n✅ ${results.statusUpdated} statuses updated`;
        }
        
        toast.success(message, { 
          id: 'upload',
          duration: 5000
        });
      }

      onApplicationsAdded();
      setOpen(false);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Failed to process file: ${error}`, { id: 'upload' });
    } finally {
      setUploading(false);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Applications
          </DialogTitle>
          <DialogDescription>
            Upload Excel/CSV files containing application data. Choose your upload mode and download the template to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Data Recovery Section */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-900">Data Recovery Available</h4>
                <p className="text-sm text-amber-700 mt-1">
                  If financial fields were accidentally reset during bulk uploads, you can recover the original values.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={showRecoveryPreview}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Preview Recovery
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={recovering}
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        {recovering ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Recovering...
                          </>
                        ) : (
                          'Recover Data'
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Data Recovery</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will restore financial field values (principle_due, interest_due, emi_amount, last_month_bounce) 
                          that were accidentally reset to 0 during bulk uploads. The system will use audit logs to find and restore the original values.
                          
                          This operation cannot be undone. Are you sure you want to proceed?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDataRecovery}>
                          Yes, Recover Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Mode</Label>
            <RadioGroup value={uploadMode} onValueChange={(value: UploadMode) => setUploadMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="text-sm">
                  <strong>Smart Mode</strong> - Automatically add new or update existing (Recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="text-sm">
                  <strong>Add Only</strong> - Only create new applications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="update" />
                <Label htmlFor="update" className="text-sm">
                  <strong>Update Only</strong> - Only update existing applications (SAFE: preserves existing financial data)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Template Download Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Step 1: Download Template</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download the Excel template with the required format (28 columns + Status)
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
            <p><strong>New:</strong> Includes Collection RM field for assignment tracking</p>
            <p><strong>Update Only Mode:</strong> Safely updates only provided fields, preserves existing financial data</p>
            <p><strong>Status Values:</strong> Unpaid, Partially Paid, Cash Collected from Customer, Customer Deposited to Bank, Paid</p>
            <p><strong>Note:</strong> Invalid status values will default to 'Unpaid'</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
