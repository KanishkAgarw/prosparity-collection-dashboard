
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
import ApplicationsTable from '@/components/ApplicationsTable';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';

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
            {loading ? 'Loading Report...' : `Report Results (${applications.length} applications)`}
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
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications found matching the criteria
            </div>
          ) : (
            <ApplicationsTable
              applications={applications}
              onRowClick={handleApplicationSelect}
              selectedApplicationId={selectedApplication?.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={handleClosePanel}
          onSave={handleApplicationUpdate}
          onDataChanged={() => {
            // Handle data changes if needed
            console.log('Application data changed');
          }}
        />
      )}
    </div>
  );
};

export default PlanVsAchievementTab;
