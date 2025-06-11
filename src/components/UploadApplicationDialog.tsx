
import { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import UploadModeSelector, { UploadMode } from './upload/UploadModeSelector';
import TemplateDownloadSection from './upload/TemplateDownloadSection';
import FileUploadProcessor from './upload/FileUploadProcessor';

interface UploadApplicationDialogProps {
  onApplicationsAdded: () => void;
}

const UploadApplicationDialog = ({ onApplicationsAdded }: UploadApplicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('mixed');

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
          <UploadModeSelector 
            uploadMode={uploadMode}
            onModeChange={setUploadMode}
          />

          <TemplateDownloadSection />

          <FileUploadProcessor
            uploadMode={uploadMode}
            uploading={uploading}
            onUploadingChange={setUploading}
            onApplicationsAdded={onApplicationsAdded}
            onDialogClose={() => setOpen(false)}
          />
          
          <div className="text-xs text-gray-500">
            <p>Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</p>
            <p><strong>New:</strong> Includes Collection RM field for assignment tracking</p>
            <p><strong>Status Values:</strong> Unpaid, Partially Paid, Cash Collected from Customer, Customer Deposited to Bank, Paid</p>
            <p><strong>Note:</strong> Invalid status values will default to 'Unpaid'</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
