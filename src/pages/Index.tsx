import { useState, useMemo, useEffect } from "react";
import { useSimpleApplications } from "@/hooks/useSimpleApplications";
import { useOptimizedCascadingFilters } from "@/hooks/useOptimizedCascadingFilters";
import { useStatusCounts } from "@/hooks/useStatusCounts";
import { useEnhancedExport } from "@/hooks/useEnhancedExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useDebounce } from "@/hooks/useDebounce";
import { Application } from "@/types/application";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import AppHeader from "@/components/layout/AppHeader";
import FiltersSection from "@/components/layout/FiltersSection";
import MainContent from "@/components/layout/MainContent";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import StatusCards from "@/components/StatusCards";
import { ApplicationTableSkeleton, StatusCardsSkeleton } from "@/components/LoadingStates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PendingApprovals from "@/components/PendingApprovals";

const PAGE_SIZE = 20;

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { fetchProfiles } = useUserProfiles();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use optimized cascading filters system
  const { 
    filters, 
    availableOptions, 
    handleFilterChange, 
    selectedEmiMonth: selectedEmiMonthRaw,
    handleEmiMonthChange,
    emiMonthOptions,
    defaultEmiMonth,
    loading: filtersLoading 
  } = useOptimizedCascadingFilters();

  // Always extract selectedEmiMonth as a single value (for mobile multi-select compatibility)
  const selectedEmiMonth = Array.isArray(filters.emiMonth) && filters.emiMonth.length > 0
    ? filters.emiMonth[0]
    : selectedEmiMonthRaw || null;

  // Use simplified applications hook
  const { 
    applications, 
    totalCount, 
    totalPages, 
    loading: appsLoading, 
    refetch 
  } = useSimpleApplications({
    filters,
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    pageSize: PAGE_SIZE,
    selectedEmiMonth
  });

  // Use status counts hook with search term
  const { statusCounts, loading: statusLoading, refetch: refetchStatusCounts } = useStatusCounts({ 
    filters, 
    selectedEmiMonth,
    searchTerm: debouncedSearchTerm
  });

  const { exportPtpCommentsReport, exportFullReport, exportPlanVsAchievementReport, planVsAchievementLoading } = useEnhancedExport();

  // Reset page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters, selectedEmiMonth]);

  // Load user profiles
  useEffect(() => {
    if (user && applications.length > 0) {
      const timeout = setTimeout(() => {
        const userIds = [...new Set([user.id])];
        fetchProfiles(userIds);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [user, applications.length, fetchProfiles]);

  const handleApplicationDeleted = () => {
    refetch();
    setSelectedApplication(null);
  };

  const handleApplicationUpdated = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    refetch();
  };

  const handleDataChanged = async () => {
    await refetch();
    await refetchStatusCounts();
    if (selectedApplication) {
      const updatedApp = applications.find(app => app.applicant_id === selectedApplication.applicant_id);
      if (updatedApp) {
        setSelectedApplication(updatedApp);
      }
    }
  };

  const handleApplicationSelect = (app: Application) => {
    setSelectedApplication(app);
  };

  const handleApplicationClose = () => {
    setSelectedApplication(null);
  };

  const handleExportFull = async () => {
    try {
      toast.loading('Preparing full report...', { id: 'export' });
      
      const exportData = {
        applications: applications
      };

      exportFullReport(exportData, 'collection-monitoring-full-report');
      toast.success('Full report exported successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', { id: 'export' });
    }
  };

  const handleExportPtpComments = async () => {
    try {
      toast.loading('Preparing PTP + Comments report...', { id: 'export' });
      
      const exportData = {
        applications: applications
      };

      exportPtpCommentsReport(exportData, 'collection-ptp-comments-report');
      toast.success('PTP + Comments report exported successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', { id: 'export' });
    }
  };

  const handleExportPlanVsAchievement = async (plannedDateTime: Date) => {
    try {
      toast.loading('Preparing Plan vs Achievement report...', { id: 'export-plan' });
      
      const count = await exportPlanVsAchievementReport(plannedDateTime, 'plan-vs-achievement-report');
      toast.success(`Plan vs Achievement report exported successfully! Found ${count} applications.`, { id: 'export-plan' });
    } catch (error) {
      console.error('Plan vs Achievement export error:', error);
      toast.error('Failed to export Plan vs Achievement data', { id: 'export-plan' });
    }
  };

  // Show loading screen while auth is loading
  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          <AppHeader 
            onExportFull={handleExportFull}
            onExportPtpComments={handleExportPtpComments}
            onExportPlanVsAchievement={handleExportPlanVsAchievement}
          />

          <FiltersSection
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedEmiMonth={selectedEmiMonth}
            onEmiMonthChange={handleEmiMonthChange}
            emiMonthOptions={emiMonthOptions}
            loading={filtersLoading}
            searchLoading={appsLoading}
            totalCount={totalCount}
          />

          {statusLoading ? (
            <StatusCardsSkeleton />
          ) : (
            <StatusCards statusCounts={statusCounts} />
          )}

          {/* Only show Pending Approvals for Admin users */}
          {isAdmin && <PendingApprovals onUpdate={refetch} />}

          {appsLoading ? (
            <ApplicationTableSkeleton />
          ) : (
            <MainContent
              applications={applications}
              onRowClick={handleApplicationSelect}
              onApplicationDeleted={handleApplicationDeleted}
              selectedApplicationId={selectedApplication?.id}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              selectedEmiMonth={selectedEmiMonth}
            />
          )}
        </div>
      </div>

      <PWAInstallPrompt />

      {selectedApplication && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleApplicationClose}
          />
          <div className="fixed inset-y-0 right-0 w-[95%] sm:w-96 lg:w-[500px] z-50">
            <ApplicationDetailsPanel
              application={selectedApplication}
              onClose={handleApplicationClose}
              onSave={handleApplicationUpdated}
              onDataChanged={handleDataChanged}
              selectedEmiMonth={selectedEmiMonth}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
