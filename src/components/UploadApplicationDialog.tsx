
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface UploadApplicationDialogProps {
  onApplicationAdded: () => void;
}

const UploadApplicationDialog = ({ onApplicationAdded }: UploadApplicationDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    applicationId: '',
    applicantName: '',
    branch: '',
    teamLead: '',
    rm: '',
    dealer: '',
    lender: '',
    emiDue: '',
    emiMonth: '',
    status: 'Unpaid'
  });

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
    if (!selectedFile || !user) return;
    
    setLoading(true);
    try {
      // For now, show a message that Excel parsing will be implemented
      toast.error('Excel parsing functionality will be implemented. Please use manual entry for now.');
    } catch (error) {
      toast.error('Failed to process Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          application_id: formData.applicationId,
          applicant_name: formData.applicantName,
          branch: formData.branch,
          team_lead: formData.teamLead,
          rm: formData.rm,
          dealer: formData.dealer,
          lender: formData.lender,
          emi_due: parseFloat(formData.emiDue),
          emi_month: formData.emiMonth,
          status: formData.status,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Application ID already exists');
        } else {
          toast.error('Failed to add application');
        }
      } else {
        toast.success('Application added successfully!');
        setFormData({
          applicationId: '',
          applicantName: '',
          branch: '',
          teamLead: '',
          rm: '',
          dealer: '',
          lender: '',
          emiDue: '',
          emiMonth: '',
          status: 'Unpaid'
        });
        setOpen(false);
        onApplicationAdded();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Applications
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Applications</DialogTitle>
          <DialogDescription>
            Upload applications manually or via Excel file.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="excel">Excel Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    value={formData.applicationId}
                    onChange={(e) => handleInputChange('applicationId', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicantName">Applicant Name</Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => handleInputChange('applicantName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="teamLead">Team Lead</Label>
                  <Input
                    id="teamLead"
                    value={formData.teamLead}
                    onChange={(e) => handleInputChange('teamLead', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rm">RM</Label>
                  <Input
                    id="rm"
                    value={formData.rm}
                    onChange={(e) => handleInputChange('rm', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dealer">Dealer</Label>
                  <Input
                    id="dealer"
                    value={formData.dealer}
                    onChange={(e) => handleInputChange('dealer', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lender">Lender</Label>
                  <Input
                    id="lender"
                    value={formData.lender}
                    onChange={(e) => handleInputChange('lender', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emiDue">EMI Due (₹)</Label>
                  <Input
                    id="emiDue"
                    type="number"
                    step="0.01"
                    value={formData.emiDue}
                    onChange={(e) => handleInputChange('emiDue', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emiMonth">EMI Month</Label>
                  <Input
                    id="emiMonth"
                    placeholder="e.g., Jan 2024"
                    value={formData.emiMonth}
                    onChange={(e) => handleInputChange('emiMonth', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Application'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
