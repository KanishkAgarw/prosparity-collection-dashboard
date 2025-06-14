
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
import CommentsDisplay from '@/components/tables/CommentsDisplay';
import { formatPtpDate } from '@/utils/formatters';
import { useComments } from '@/hooks/useComments';

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
  const [commentsByApp, setCommentsByApp] = useState<Record<string, Array<{content: string; user_name: string}>>>({});

  const { fetchPlanVsAchievementData, loading } = usePlanVsAchievementData();
  const { exportPlanVsAchievementReport } = usePlanVsAchievementReport();
  const { fetchCommentsByApplications } = useComments();

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

  // Get change priority for sorting
  const getChangePriority = (item: PlanVsAchievementApplication): number => {
    const statusChanged = item.previous_status !== item.updated_status;
    const ptpChanged = item.previous_ptp_date !== item.updated_ptp_date;

    if (statusChanged && ptpChanged) return 1;
    if (statusChanged) return 2;
    if (ptpChanged) return 3;
    return 4; // No change
  };

  // Sort applications by change priority
  const sortedReportData = [...reportData].sort((a, b) => {
    return getChangePriority(a) - getChangePriority(b);
  });

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

  // Filter comments by date range
  const filterCommentsByDateRange = async (appIds: string[]) => {
    const plannedDateTime = getSelectedDateTime();
    if (!plannedDateTime || appIds.length === 0) return {};

    const allComments = await fetchCommentsByApplications(appIds);
    const filteredComments: Record<string, Array<{content: string; user_name: string}>> = {};

    // Note: Since fetchCommentsByApplications doesn't return created_at dates,
    // we'll use all recent comments for now. In a real implementation,
    // you'd need to modify the hook to include date filtering.
    return allComments;
  };

  // Automatically run report when date/time changes
  useEffect(() => {
    const runReport = async () => {
      const dateTime = getSelectedDateTime();
      if (!dateTime) return;

      const data = await fetchPlanVsAchievementData(dateTime);
      setReportData(data);
      
      const convertedApps = convertToApplications(data);
      setApplications(convertedApps);

      // Fetch filtered comments for all applications
      const appIds = data.map(item => item.applicant_id);
      if (appIds.length > 0) {
        const comments = await filterCommentsByDateRange(appIds);
        setCommentsByApp(comments);
      }
    };

    runReport();
  }, [selectedDate, selectedTime, fetchPlanVsAchievementData, fetchCommentsByApplications]);

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
    <div className={`space-y-8 ${selectedApplication ? 'pr-[500px] md:pr-[600px]' : ''} transition-all duration-300`}>
      {/* Header Section with Date/Time Controls */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Plan vs Achievement Analysis
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Analysis Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full sm:w-48 justify-start text-left font-medium bg-white",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
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
              <label className="text-sm font-medium text-gray-700 block">
                Planned Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full sm:w-32 pl-10 pr-4 py-3 border border-gray-200 rounded-lg font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      {!loading && reportData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.statusChanged}</p>
                  <p className="text-sm font-medium text-gray-600">Status Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.ptpUpdated}</p>
                  <p className="text-sm font-medium text-gray-600">PTP Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.noChange}</p>
                  <p className="text-sm font-medium text-gray-600">No Changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Data Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-600" />
                {loading ? 'Loading Analysis...' : `Analysis Results (${reportData.length} applications)`}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Plan vs achievement analysis for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
              </CardDescription>
            </div>
            {reportData.length > 0 && (
              <Button 
                onClick={handleExportReport}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                size="lg"
              >
                <Download className="h-4 w-4" />
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
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="font-bold text-gray-900 w-80 py-4">Application Details</TableHead>
                    <TableHead className="font-bold text-gray-900 text-center py-4">Previous PTP Date</TableHead>
                    <TableHead className="font-bold text-gray-900 text-center py-4">Previous Status</TableHead>
                    <TableHead className="font-bold text-gray-900 text-center py-4">Updated PTP Date</TableHead>
                    <TableHead className="font-bold text-gray-900 text-center py-4">Updated Status</TableHead>
                    <TableHead className="font-bold text-gray-900 text-center py-4">Change Summary</TableHead>
                    <TableHead className="font-bold text-gray-900 py-4">Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReportData.map((item, index) => {
                    const application = applications.find(app => app.applicant_id === item.applicant_id);
                    const changeSummary = getChangeSummary(item);
                    const comments = commentsByApp[item.applicant_id] || [];
                    return (
                      <TableRow 
                        key={item.applicant_id}
                        className={`
                          cursor-pointer transition-all duration-200 border-b border-gray-100
                          ${selectedApplication?.applicant_id === item.applicant_id 
                            ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                            : 'hover:bg-gray-50'
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
                          <CommentsDisplay comments={comments} />
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

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={handleClosePanel}
          onSave={handleApplicationUpdate}
          onDataChanged={() => {
            console.log('Application data changed');
          }}
        />
      )}
    </div>
  );
};

export default PlanVsAchievementTab;
