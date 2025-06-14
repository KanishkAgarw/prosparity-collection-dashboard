
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePlanVsAchievementData } from '@/hooks/exports/usePlanVsAchievementData';
import { usePlanVsAchievementReport } from '@/hooks/exports/usePlanVsAchievementReport';
import { Application } from '@/types/application';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ApplicationDetails from '@/components/tables/ApplicationDetails';
import StatusBadge from '@/components/tables/StatusBadge';
import { formatPtpDate } from '@/utils/formatters';

interface PlanVsAchievementApplication {
  applicant_id: string;
  branch_name: string;
  rm_name: string;
  collection_rm: string;
  dealer_name: string;
  applicant_name: string;
  previous_ptp_date: string | null;
  previous_status: string | null;
  updated_ptp_date: string | null;
  updated_status: string | null;
  comment_trail: string;
}

const PlanVsAchievementTab = () => {
  // Set default to today and 11AM
  const today = new Date();
  const defaultDateTime = new Date(today);
  defaultDateTime.setHours(11, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [selectedTime, setSelectedTime] = useState<string>('11:00');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [reportData, setReportData] = useState<PlanVsAchievementApplication[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const { fetchPlanVsAchievementData, loading } = usePlanVsAchievementData();
  const { exportPlanVsAchievementReport } = usePlanVsAchievementReport();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };

  const getSelectedDateTime = (): Date | null => {
    if (!selectedDate) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  // Convert report data to Application format for the table
  const convertToApplications = (data: PlanVsAchievementApplication[]): Application[] => {
    return data.map(item => ({
      id: item.applicant_id,
      applicant_id: item.applicant_id,
      applicant_name: item.applicant_name,
      branch_name: item.branch_name,
      rm_name: item.rm_name,
      collection_rm: item.collection_rm,
      dealer_name: item.dealer_name,
      field_status: item.updated_status || 'Unknown',
      ptp_date: item.updated_ptp_date,
      // Add other required fields with default values
      user_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lms_status: 'Unknown',
      lender_name: '',
      team_lead: '',
      emi_amount: 0,
      principle_due: 0,
      interest_due: 0,
      last_month_bounce: 0,
      applicant_mobile: '',
      co_applicant_name: '',
      co_applicant_mobile: '',
      co_applicant_address: '',
      guarantor_name: '',
      guarantor_mobile: '',
      guarantor_address: '',
      reference_name: '',
      reference_mobile: '',
      reference_address: '',
      applicant_address: '',
      house_ownership: '',
      repayment: '',
      fi_location: '',
      demand_date: '',
      applicant_calling_status: 'Not Called',
      co_applicant_calling_status: 'Not Called',
      guarantor_calling_status: 'Not Called',
      reference_calling_status: 'Not Called',
      latest_calling_status: 'No Calls',
      recent_comments: []
    }));
  };

  // Generate change summary
  const getChangeSummary = (item: PlanVsAchievementApplication): string => {
    const statusChanged = item.previous_status !== item.updated_status;
    const ptpChanged = item.previous_ptp_date !== item.updated_ptp_date;

    if (statusChanged && ptpChanged) {
      return 'Status Changed & PTP Updated';
    } else if (statusChanged) {
      return 'Status Changed';
    } else if (ptpChanged) {
      return 'PTP Updated';
    } else {
      return 'No Change';
    }
  };

  // Automatically run report when date/time changes
  useEffect(() => {
    const runReport = async () => {
      const dateTime = getSelectedDateTime();
      if (!dateTime) return;

      const data = await fetchPlanVsAchievementData(dateTime);
      setReportData(data);
      setApplications(convertToApplications(data));
    };

    runReport();
  }, [selectedDate, selectedTime, fetchPlanVsAchievementData]);

  const handleExportReport = async () => {
    const dateTime = getSelectedDateTime();
    if (!dateTime) return;

    await exportPlanVsAchievementReport(dateTime, 'plan-vs-achievement-report');
  };

  const handleApplicationSelect = (app: Application) => {
    setSelectedApplication(app);
  };

  const handleClosePanel = () => {
    setSelectedApplication(null);
  };

  const handleApplicationUpdate = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    // In a real app, you'd update the applications list here
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan vs Achievement Analysis</CardTitle>
          <CardDescription>
            Compare planned follow-ups (PTP dates set for a specific date/time) vs actual achievements including status and comment changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Planned Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Planned Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              {reportData.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleExportReport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export to Excel
                </Button>
              )}
            </div>
          </div>

          {getSelectedDateTime() && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Analyzing:</strong> {format(getSelectedDateTime()!, "PPP 'at' HH:mm")}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing applications that had PTP dates set for this date/time and their status changes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? 'Loading Report...' : `Report Results (${reportData.length} applications)`}
          </CardTitle>
          <CardDescription>
            Applications that had PTP set for {selectedDate && format(selectedDate, "PPP")} as of {format(getSelectedDateTime() || new Date(), "PPP 'at' HH:mm")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications found matching the criteria
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 w-80">Application Details</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Previous PTP Date</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Previous Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Updated PTP Date</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Updated Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Change History</TableHead>
                      <TableHead className="font-semibold text-gray-900">Comment Trail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item) => {
                      const application = applications.find(app => app.applicant_id === item.applicant_id);
                      return (
                        <TableRow 
                          key={item.applicant_id}
                          className={`cursor-pointer transition-colors ${
                            selectedApplication?.applicant_id === item.applicant_id 
                              ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => application && handleApplicationSelect(application)}
                        >
                          <TableCell className="py-3">
                            {application && <ApplicationDetails application={application} />}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <span className={`${item.previous_ptp_date ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
                              {item.previous_ptp_date ? formatPtpDate(item.previous_ptp_date) : 'Not Set'}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {item.previous_status ? (
                              <StatusBadge status={item.previous_status} />
                            ) : (
                              <span className="text-gray-400">Unknown</span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <span className={`${item.updated_ptp_date ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
                              {item.updated_ptp_date ? formatPtpDate(item.updated_ptp_date) : 'Not Set'}
                            </span>
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {item.updated_status ? (
                              <StatusBadge status={item.updated_status} />
                            ) : (
                              <span className="text-gray-400">Unknown</span>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getChangeSummary(item) === 'No Change' 
                                ? 'bg-gray-100 text-gray-600'
                                : getChangeSummary(item).includes('Status Changed')
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {getChangeSummary(item)}
                            </span>
                          </TableCell>
                          
                          <TableCell className="max-w-[300px]">
                            <div className="text-sm text-gray-600 truncate" title={item.comment_trail}>
                              {item.comment_trail || 'No comments'}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Panel - Fixed positioning */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <ApplicationDetailsPanel
              application={selectedApplication}
              onClose={handleClosePanel}
              onSave={handleApplicationUpdate}
              onDataChanged={() => {
                // Handle data changes if needed
                console.log('Application data changed');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanVsAchievementTab;
