import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application } from "@/types/application";
import { AuditLog } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { History, Clock, AlertCircle } from "lucide-react";
import { useFilteredAuditLogs } from "@/hooks/useFilteredAuditLogs";
import { toast } from "sonner";
import LogDialog from "./LogDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFieldStatus } from "@/hooks/useFieldStatus";
import { CALLING_STATUS_OPTIONS } from '@/constants/options';

interface StatusTabProps {
  application: Application;
  auditLogs: AuditLog[];
  onStatusChange: (newStatus: string) => void;
  onPtpDateChange: (newDate: string) => void;
  addAuditLog: (appId: string, field: string, previousValue: string | null, newValue: string | null, demandDate: string) => Promise<void>;
  selectedMonth: string;
}

const StatusTab = ({ application, auditLogs, onStatusChange, onPtpDateChange, addAuditLog, selectedMonth }: StatusTabProps) => {
  const [ptpDate, setPtpDate] = useState('');
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [isUpdatingPtp, setIsUpdatingPtp] = useState(false);
  const { user } = useAuth();
  const [amountCollected, setAmountCollected] = useState<number | ''>(application.amount_collected ?? '');
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);
  const { fetchFieldStatus, updateFieldStatus } = useFieldStatus();
  const [currentStatus, setCurrentStatus] = useState<string>('Unpaid');
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentCallingStatus, setCurrentCallingStatus] = useState<string>('');
  const [callingStatusLoading, setCallingStatusLoading] = useState(false);

  // Helper function to normalize date format
  const normalizeDate = (date: string | null | undefined): string | null => {
    if (!date) return null;
    
    try {
      if (date.length === 7) {
        // YYYY-MM format, convert to first day of month
        return `${date}-01`;
      } else if (date.length === 10) {
        // Already in YYYY-MM-DD format
        return date;
      } else {
        // Try to parse and format
        const parsedDate = new Date(date);
        return parsedDate.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error normalizing date:', error);
      return null;
    }
  };
  
  // PTP date synchronization - improved to handle month-specific data
  useEffect(() => {
    console.log('📅 StatusTab: Synchronizing PTP date for month:', selectedMonth);
    console.log('Application PTP date:', application.ptp_date);
    console.log('Type of PTP date:', typeof application.ptp_date);
    
    if (application.ptp_date) {
      try {
        let inputValue = '';
        
        if (typeof application.ptp_date === 'string') {
          let parsedDate: Date;
          
          // Handle different date formats
          if (application.ptp_date.includes('T') || application.ptp_date.includes('Z')) {
            // ISO string format
            parsedDate = new Date(application.ptp_date);
          } else if (application.ptp_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format
            parsedDate = new Date(application.ptp_date + 'T00:00:00.000Z');
          } else {
            // Try parsing as generic date
            parsedDate = new Date(application.ptp_date);
          }
          
          if (!isNaN(parsedDate.getTime())) {
            // Format for HTML date input (YYYY-MM-DD)
            inputValue = parsedDate.toISOString().split('T')[0];
            console.log('✅ Parsed date for input:', inputValue);
          } else {
            console.warn('⚠️ Could not parse date:', application.ptp_date);
          }
        }
        
        setPtpDate(inputValue);
      } catch (error) {
        console.error('❌ Error parsing PTP date:', error);
        setPtpDate('');
      }
    } else {
      console.log('🚫 No PTP date or date is null - showing empty input');
      setPtpDate('');
    }
  }, [application.ptp_date, selectedMonth]);
  
  useEffect(() => {
    setAmountCollected(application.amount_collected ?? '');
  }, [application.amount_collected, selectedMonth]);
  
  // Use the hook directly without wrapping in useMemo
  const statusAndPtpLogs = useFilteredAuditLogs(auditLogs);

  // Fetch per-month status on mount or when application/selectedMonth changes
  useEffect(() => {
    const fetchStatus = async () => {
      if (!application?.applicant_id || !selectedMonth) return;
      setStatusLoading(true);
      const statusMap = await fetchFieldStatus([application.applicant_id], selectedMonth);
      setCurrentStatus(statusMap[application.applicant_id] || 'Unpaid');
      setStatusLoading(false);
    };
    fetchStatus();
  }, [application?.applicant_id, selectedMonth, fetchFieldStatus]);

  // Fetch calling status for the selected month
  useEffect(() => {
    const fetchCallingStatus = async () => {
      if (!application?.applicant_id || !selectedMonth) return;
      
      const normalizedMonth = normalizeDate(selectedMonth);
      if (!normalizedMonth) return;

      setCallingStatusLoading(true);
      try {
        const { data, error } = await supabase
          .from('field_status')
          .select('calling_status')
          .eq('application_id', application.applicant_id)
          .eq('demand_date', normalizedMonth)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching calling status:', error);
          setCurrentCallingStatus('');
        } else {
          setCurrentCallingStatus(data?.calling_status || '');
        }
      } catch (error) {
        console.error('Exception in fetchCallingStatus:', error);
        setCurrentCallingStatus('');
      } finally {
        setCallingStatusLoading(false);
      }
    };
    fetchCallingStatus();
  }, [application?.applicant_id, selectedMonth]);

  const handlePtpDateChange = async (value: string) => {
    console.log('=== PTP DATE INPUT CHANGE ===');
    console.log('Application:', application.applicant_name);
    console.log('Input value:', value);
    console.log('Is clearing date:', value === '');
    
    setPtpDate(value);
    setIsUpdatingPtp(true);

    try {
      console.log('Calling onPtpDateChange with value:', value);
      await onPtpDateChange(value);
      console.log('✅ PTP date change completed');
      
      // Show appropriate success message
      if (value === '') {
        toast.success('PTP date cleared successfully');
      } else {
        const formattedDisplayDate = new Date(value + 'T00:00:00.000Z').toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        toast.success(`PTP date updated to ${formattedDisplayDate}`);
      }
    } catch (error) {
      console.error('❌ Error updating PTP date:', error);
      toast.error('Failed to update PTP date. Please try again.');
      
      // Revert the input value on error
      if (application.ptp_date) {
        try {
          const parsedDate = new Date(application.ptp_date);
          if (!isNaN(parsedDate.getTime())) {
            setPtpDate(parsedDate.toISOString().split('T')[0]);
          }
        } catch (revertError) {
          console.error('Error reverting PTP date:', revertError);
          setPtpDate('');
        }
      } else {
        setPtpDate('');
      }
    } finally {
      setIsUpdatingPtp(false);
    }
  };

  // Update status handler to use per-month update
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedMonth) return;
    
    const normalizedMonth = normalizeDate(selectedMonth);
    if (!normalizedMonth) {
      toast.error('Invalid month format');
      return;
    }

    setStatusLoading(true);
    try {
      if (newStatus === "Paid") {
        await onStatusChange(newStatus);
      } else {
        const prevStatus = currentStatus;
        await updateFieldStatus(application.applicant_id, newStatus, selectedMonth);
        setCurrentStatus(newStatus);
        await addAuditLog(application.applicant_id, 'Status', prevStatus, newStatus, normalizedMonth);
        onStatusChange(newStatus);
        toast.success('Status updated');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status: ' + (err as Error).message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAmountCollectedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAmountCollected('');
    } else if (/^\d*\.?\d*$/.test(value)) {
      setAmountCollected(Number(value));
    }
  };

  const saveAmountCollected = async () => {
    if (!user || !application || !selectedMonth) return;
    
    const normalizedMonth = normalizeDate(selectedMonth);
    if (!normalizedMonth) {
      toast.error('Invalid month format');
      return;
    }

    setIsUpdatingAmount(true);
    const prev = application.amount_collected ?? '';
    const newVal = amountCollected === '' ? null : Number(amountCollected);
    
    try {
      console.log('=== UPDATING AMOUNT COLLECTED ===');
      console.log('Application ID:', application.applicant_id);
      console.log('Demand Date (normalized):', normalizedMonth);
      console.log('Previous Amount:', prev);
      console.log('New Amount:', newVal);

      // Update the collection table instead of applications table
      const { error } = await supabase
        .from('collection')
        .upsert({
          application_id: application.applicant_id,
          demand_date: normalizedMonth,
          amount_collected: newVal,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'application_id,demand_date'
        });
      
      if (error) {
        console.error('Error updating amount collected:', error);
        throw error;
      }
      
      console.log('✅ Amount collected updated successfully');
      
      if (prev !== newVal) {
        await addAuditLog(application.applicant_id, 'Amount Collected', prev?.toString() ?? '', newVal?.toString() ?? '', normalizedMonth);
      }
      
      toast.success('Amount Collected updated');
      
      // Update the local application state instead of reloading the page
      const updatedApplication = { ...application, amount_collected: newVal };
      // Trigger parent component to refresh data
      if (onStatusChange) {
        onStatusChange(currentStatus); // This will trigger a refresh of the application data
      }
      
    } catch (err) {
      console.error('Exception in saveAmountCollected:', err);
      toast.error('Failed to update Amount Collected: ' + (err as Error).message);
    } finally {
      setIsUpdatingAmount(false);
    }
  };

  // Optimized date formatting function
  const formatDateTime = useMemo(() => {
    return (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return `${format(date, 'dd-MMM-yyyy')} at ${format(date, 'HH:mm')}`;
      } catch {
        return dateStr;
      }
    };
  }, []);

  // Show only recent 2 status/PTP changes and deduplicate
  const recentStatusAndPtpLogs = useMemo(() => {
    if (!Array.isArray(statusAndPtpLogs)) return [];
    
    // Deduplicate logs based on field + timestamp combination
    const seenLogs = new Set();
    const uniqueLogs = statusAndPtpLogs.filter(log => {
      const key = `${log.field}-${log.created_at}-${log.new_value}`;
      if (seenLogs.has(key)) {
        return false;
      }
      seenLogs.add(key);
      return true;
    });
    
    return uniqueLogs.slice(0, 2);
  }, [statusAndPtpLogs]);

  // Get the 4 basic status options (removed "Customer Deposited to Bank")
  const getStatusOptions = () => {
    return [
      { value: "Unpaid", label: "Unpaid" },
      { value: "Partially Paid", label: "Partially Paid" },
      { value: "Cash Collected from Customer", label: "Cash Collected from Customer" },
      { value: "Paid", label: "Paid" }
    ];
  };

  // Check if status is pending approval
  const isPendingApproval = currentStatus?.includes('Pending Approval');

  // Handle calling status change
  const handleCallingStatusChange = async (newStatus: string) => {
    if (!selectedMonth) return;
    
    const normalizedMonth = normalizeDate(selectedMonth);
    if (!normalizedMonth) {
      toast.error('Invalid month format');
      return;
    }

    setCallingStatusLoading(true);
    try {
      console.log('=== UPDATING CALLING STATUS ===');
      console.log('Application ID:', application.applicant_id);
      console.log('New Calling Status:', newStatus);
      console.log('Demand Date (normalized):', normalizedMonth);

      // Fetch previous value
      const { data: existingStatus } = await supabase
        .from('field_status')
        .select('calling_status')
        .eq('application_id', application.applicant_id)
        .eq('demand_date', normalizedMonth)
        .maybeSingle();
      
      const prevStatus = existingStatus?.calling_status || '';
      
      // Upsert new value
      const { error } = await supabase
        .from('field_status')
        .upsert({
          application_id: application.applicant_id,
          calling_status: newStatus,
          demand_date: normalizedMonth,
          user_id: user.id,
          user_email: user.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'application_id,demand_date' });
      
      if (error) {
        console.error('Error updating calling status:', error);
        throw error;
      }
      
      console.log('✅ Calling status updated successfully');
      setCurrentCallingStatus(newStatus);
      
      if (prevStatus !== newStatus) {
        await addAuditLog(application.applicant_id, 'Calling Status', prevStatus, newStatus, normalizedMonth);
      }
      
      toast.success('Calling status updated');
    } catch (err) {
      console.error('Exception in handleCallingStatusChange:', err);
      toast.error('Failed to update calling status: ' + (err as Error).message);
    } finally {
      setCallingStatusLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Status Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Calling Status dropdown - moved to first position */}
            <div>
              <Label htmlFor="callingStatus">Calling Status</Label>
              <Select
                value={currentCallingStatus}
                onValueChange={handleCallingStatusChange}
                disabled={callingStatusLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select calling status..." />
                </SelectTrigger>
                <SelectContent>
                  {CALLING_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Collection Status dropdown - moved to second position */}
            <div>
              <Label htmlFor="status">Collection Status</Label>
              {isPendingApproval ? (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <div className="font-medium text-yellow-800">
                        {currentStatus}
                      </div>
                      <div className="text-sm text-yellow-600">
                        This status change is awaiting admin approval
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Pending
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Status cannot be changed while approval is pending
                  </div>
                </div>
              ) : (
                <Select 
                  value={currentStatus} 
                  onValueChange={handleStatusChange}
                  disabled={statusLoading || isPendingApproval}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {/* PTP DATE INPUT - Enhanced with better clearing support */}
            <div>
              <Label htmlFor="ptpDate">PTP Date</Label>
              <div className="space-y-2">
                <Input
                  id="ptpDate"
                  type="date"
                  value={ptpDate}
                  onChange={(e) => handlePtpDateChange(e.target.value)}
                  className="mt-1"
                  disabled={isUpdatingPtp}
                  placeholder="Select PTP date"
                />
                {isUpdatingPtp && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    {ptpDate === '' ? 'Clearing PTP date...' : 'Updating PTP date...'}
                  </div>
                )}
                {!application.ptp_date && !isUpdatingPtp && (
                  <div className="text-xs text-gray-500">No PTP date set</div>
                )}
              </div>
            </div>
            {/* AMOUNT COLLECTED INPUT */}
            <div>
              <Label htmlFor="amountCollected">Amount Collected</Label>
              <div className="flex gap-2 items-center mt-1">
                <span className="inline-flex items-center px-3 h-10 border border-r-0 border-input bg-muted text-base rounded-l-md text-gray-600 select-none">
                  ₹
                </span>
                <Input
                  id="amountCollected"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountCollected}
                  onChange={handleAmountCollectedChange}
                  className="rounded-l-none"
                  disabled={isUpdatingAmount}
                  placeholder="Enter amount"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                />
                <Button
                  size="sm"
                  onClick={saveAmountCollected}
                  disabled={isUpdatingAmount || amountCollected === application.amount_collected}
                >
                  {isUpdatingAmount ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Status & PTP Changes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Changes
            </div>
            {Array.isArray(statusAndPtpLogs) && statusAndPtpLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({statusAndPtpLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentStatusAndPtpLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No status or PTP date changes recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentStatusAndPtpLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700">{log.field}</span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_value || 'Not Set'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_value || 'Cleared'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{formatDateTime(log.created_at)}</div>
                    <div>by {log.user_name || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <LogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        logs={Array.isArray(statusAndPtpLogs) ? statusAndPtpLogs : []}
        title="Status & PTP Date History"
        type="audit"
      />
    </div>
  );
};

export default StatusTab;
