
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Eye, FileText, Users, MapPin } from 'lucide-react';
import { Application } from '@/types/application';
import { DrillDownFilter } from '@/pages/Analytics';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  filter: DrillDownFilter | null;
}

const ApplicationDetailsModal = ({ isOpen, onClose, applications, filter }: ApplicationDetailsModalProps) => {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleApplicationSelect = (app: Application) => {
    setSelectedApplication(app);
  };

  const handleApplicationClose = () => {
    setSelectedApplication(null);
  };

  const handleApplicationUpdated = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    // In a real app, you'd also update the applications list
  };

  const getFilterDescription = () => {
    if (!filter) return '';
    
    let description = `Applications in ${filter.branch_name}`;
    if (filter.rm_name) {
      description += ` (RM: ${filter.rm_name})`;
    }
    
    switch (filter.status_type) {
      case 'unpaid':
        return `${description} with Unpaid status`;
      case 'partially_paid':
        return `${description} with Partially Paid status`;
      case 'paid_pending_approval':
        return `${description} with Paid (Pending Approval) status`;
      case 'paid':
        return `${description} with Paid status`;
      case 'others':
        return `${description} with Other statuses`;
      case 'overdue':
        return `${description} with Overdue PTPs`;
      case 'today':
        return `${description} with Today's PTPs`;
      case 'tomorrow':
        return `${description} with Tomorrow's PTPs`;
      case 'future':
        return `${description} with Future PTPs`;
      case 'no_ptp_set':
        return `${description} with No PTP set`;
      default:
        return description;
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numAmount || 0);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Paid (Pending Approval)':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  console.log('Modal applications count:', applications.length);
  console.log('Filter:', filter);

  return (
    <>
      <Dialog open={isOpen && !selectedApplication} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Application Details
                </DialogTitle>
                <DialogDescription className="text-base">
                  {getFilterDescription()}
                </DialogDescription>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{applications.length} applications</span>
                  </div>
                  {filter?.branch_name && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{filter.branch_name}</span>
                    </div>
                  )}
                  {filter?.rm_name && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{filter.rm_name}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {applications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center space-y-4">
                <div>
                  <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900">No applications found</h3>
                  <p className="text-gray-500">No applications match the selected criteria.</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Applicant</TableHead>
                        <TableHead className="font-semibold max-w-[120px]">Branch</TableHead>
                        <TableHead className="font-semibold max-w-[120px]">RM</TableHead>
                        <TableHead className="font-semibold">EMI Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">PTP Date</TableHead>
                        <TableHead className="font-semibold w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id} className="hover:bg-gray-50">
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-medium">{app.applicant_name}</div>
                              <div className="text-sm text-gray-500">ID: {app.applicant_id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={app.branch_name}>
                              {app.branch_name}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[120px]">
                            <div className="truncate" title={app.collection_rm || app.rm_name}>
                              {app.collection_rm || app.rm_name}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(app.emi_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getStatusBadgeColor(app.field_status || 'Unpaid')}
                            >
                              {app.field_status || 'Unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {app.ptp_date ? (
                              <span className="text-blue-600 font-medium">
                                {new Date(app.ptp_date).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">No PTP</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApplicationSelect(app)}
                              className="h-8 w-8 p-0 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={handleApplicationClose}
          onSave={handleApplicationUpdated}
          onDataChanged={() => {
            // Handle data changes if needed
            console.log('Application data changed');
          }}
        />
      )}
    </>
  );
};

export default ApplicationDetailsModal;
