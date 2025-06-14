
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Download, TrendingUp, Users, FileText, Filter } from 'lucide-react';
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

  // Calculate summary statistics
  const getSummaryStats = () => {
    const total = reportData.length;
    const statusChanged = reportData.filter(item => item.previous_status !== item.updated_status).length;
    const ptpUpdated = reportData.filter(item => item.previous_ptp_date !== item.updated_ptp_date).length;
    const noChange = reportData.filter(item => 
      item.previous_status === item.updated_status && 
      item.previous_ptp_date === item.updated_ptp_date
    ).length;

    return { total, statusChanged, ptpUpdated, noChange };
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

  const stats = getSummaryStats();

  return (
    <div className="space-y-8">
      {/* Header Section with Date/Time Controls */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Plan vs Achievement Analysis
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Track the effectiveness of your planned follow-ups by comparing intended actions with actual achievements
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Analysis Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full sm:w-48 justify-start text-left font-medium bg-white shadow-sm hover:shadow-md transition-all",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-blue-500" />
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">
                Planned Time
              </label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full sm:w-32 pl-12 pr-4 py-3 border border-gray-200 rounded-lg font-medium bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {getSelectedDateTime() && (
          <div className="mt-6 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">
                  Analyzing: {format(getSelectedDateTime()!, "EEEE, MMMM dd, yyyy 'at' HH:mm")}
                </p>
                <p className="text-sm text-blue-700">
                  Comparing planned vs actual achievements for this specific date and time
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics Cards */}
      {!loading && reportData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                  <p className="text-sm font-medium text-blue-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.statusChanged}</p>
                  <p className="text-sm font-medium text-green-600">Status Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.ptpUpdated}</p>
                  <p className="text-sm font-medium text-purple-600">PTP Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700">{stats.noChange}</p>
                  <p className="text-sm font-medium text-orange-600">No Changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Data Table */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Filter className="h-6 w-6 text-blue-600" />
                {loading ? 'Loading Analysis...' : `Analysis Results (${reportData.length} applications)`}
              </CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Detailed breakdown of planned vs actual achievements for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
              </CardDescription>
            </div>
            {reportData.length > 0 && (
              <Button 
                onClick={handleExportReport}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                size="lg"
              >
                <Download className="h-5 w-5" />
                Export Report
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-lg font-medium text-gray-600">Analyzing planned vs achievements...</p>
              </div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-xl font-medium text-gray-600">No Data Found</p>
                  <p className="text-gray-500 mt-2">No applications found with PTP set for the selected date and time</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
                    <TableHead className="font-bold text-gray-900 text-base w-80 py-4">Application Details</TableHead>
                    <TableHead className="font-bold text-gray-900 text-base text-center py-4">Previous PTP Date</TableHead>
                    <TableHead className="font-bold text-gray-900 text-base text-center py-4">Previous Status</TableHead>
                    <TableHead className="font-bold text-gray-900 text-base text-center py-4">Updated PTP Date</TableHead>
                    <TableHead className="font-bold text-gray-900 text-base text-center py-4">Updated Status</TableHead>
                    <TableHead className="font-bold text-gray-900 text-base text-center py-4">Change Summary</TableHead>
                    <TableHead className="font-bold text-gray-900 text-base py-4">Comment Trail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => {
                    const application = applications.find(app => app.applicant_id === item.applicant_id);
                    const changeSummary = getChangeSummary(item);
                    return (
                      <TableRow 
                        key={item.applicant_id}
                        className={`
                          cursor-pointer transition-all duration-200 border-b border-gray-100
                          ${selectedApplication?.applicant_id === item.applicant_id 
                            ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-md' 
                            : 'hover:bg-gray-50 hover:shadow-sm'
                          }
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}
                        `}
                        onClick={() => application && handleApplicationSelect(application)}
                      >
                        <TableCell className="py-4">
                          {application && <ApplicationDetails application={application} />}
                        </TableCell>
                        
                        <TableCell className="text-center py-4">
                          <span className={`
                            font-medium whitespace-nowrap px-3 py-1 rounded-full text-sm
                            ${item.previous_ptp_date 
                              ? 'text-blue-700 bg-blue-100' 
                              : 'text-gray-500 bg-gray-100'
                            }
                          `}>
                            {item.previous_ptp_date ? formatPtpDate(item.previous_ptp_date) : 'Not Set'}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-center py-4">
                          {item.previous_status ? (
                            <StatusBadge status={item.previous_status} />
                          ) : (
                            <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-center py-4">
                          <span className={`
                            font-medium whitespace-nowrap px-3 py-1 rounded-full text-sm
                            ${item.updated_ptp_date 
                              ? 'text-blue-700 bg-blue-100' 
                              : 'text-gray-500 bg-gray-100'
                            }
                          `}>
                            {item.updated_ptp_date ? formatPtpDate(item.updated_ptp_date) : 'Not Set'}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-center py-4">
                          {item.updated_status ? (
                            <StatusBadge status={item.updated_status} />
                          ) : (
                            <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-center py-4">
                          <span className={`
                            px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                            ${changeSummary === 'No Change' 
                              ? 'bg-gray-100 text-gray-600'
                              : changeSummary.includes('Status Changed') && changeSummary.includes('PTP')
                              ? 'bg-purple-100 text-purple-700'
                              : changeSummary.includes('Status Changed')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                            }
                          `}>
                            {changeSummary}
                          </span>
                        </TableCell>
                        
                        <TableCell className="max-w-[300px] py-4">
                          <div className="text-sm text-gray-700 truncate bg-gray-50 px-3 py-2 rounded-lg" title={item.comment_trail}>
                            {item.comment_trail || 'No comments available'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
