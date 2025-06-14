
import { useState, useEffect } from 'react';
import { usePlanVsAchievementData } from '@/hooks/exports/usePlanVsAchievementData';
import { usePlanVsAchievementReport } from '@/hooks/exports/usePlanVsAchievementReport';
import { Application } from '@/types/application';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';
import { useComments } from '@/hooks/useComments';
import PlanVsAchievementHeader from './planVsAchievement/PlanVsAchievementHeader';
import PlanVsAchievementSummary from './planVsAchievement/PlanVsAchievementSummary';
import PlanVsAchievementTable from './planVsAchievement/PlanVsAchievementTable';

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
  const [reportData, setReportData] = useState<PlanVsAchievementApplication[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [commentsByApp, setCommentsByApp] = useState<Record<string, Array<{content: string; user_name: string}>>>({});

  const { fetchPlanVsAchievementData, loading } = usePlanVsAchievementData();
  const { exportPlanVsAchievementReport } = usePlanVsAchievementReport();
  const { fetchCommentsByApplications } = useComments();

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
      <PlanVsAchievementHeader
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={setSelectedDate}
        onTimeChange={setSelectedTime}
      />

      <PlanVsAchievementSummary
        stats={stats}
        loading={loading}
        hasData={reportData.length > 0}
      />

      <PlanVsAchievementTable
        loading={loading}
        reportData={reportData}
        sortedReportData={sortedReportData}
        applications={applications}
        commentsByApp={commentsByApp}
        selectedDate={selectedDate}
        selectedApplication={selectedApplication}
        onExportReport={handleExportReport}
        onApplicationSelect={handleApplicationSelect}
        getChangeSummary={getChangeSummary}
      />

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
