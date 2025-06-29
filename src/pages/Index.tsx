import { useState, useMemo, useEffect } from "react";
import { useOptimizedApplicationsV3 } from "@/hooks/useOptimizedApplicationsV3";
import { useOptimizedCascadingFilters } from "@/hooks/useOptimizedCascadingFilters";
import { useOptimizedRealtimeUpdates } from "@/hooks/useOptimizedRealtimeUpdates";
import { useStatusCounts } from "@/hooks/useStatusCounts";
import { useEnhancedExport } from "@/hooks/useEnhancedExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStatePersistence } from "@/hooks/useStatePersistence";
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

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { fetchProfiles } = useUserProfiles();
  
  // State persistence hooks
  const {
    saveScrollPosition,
    restoreScrollPosition,
    saveFiltersState,
    restoreFiltersState,
    saveSelectedApplication,
    restoreSelectedApplication,
    setIsRestoringState
  } = useStatePersistence();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [hasRestoredState, setHasRestoredState] = useState(false);

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Increased debounce

  // Use optimized cascading filters system
  const { 
    filters, 
    availableOptions, 
    handleFilterChange, 
    selectedEmiMonth,
    handleEmiMonthChange,
    emiMonthOptions,
    defaultEmiMonth,
    loading: filtersLoading 
  } = useOptimizedCascadingFilters();

  // Use optimized status counts hook
  const { statusCounts, loading: statusLoading } = useStatusCounts({ 
    filters, 
    selectedEmiMonth 
  });

  // Use optimized applications hook V3
  const { 
    applications, 
    totalCount, 
    totalPages, 
    loading: appsLoading, 
    refetch 
  } = useOptimizedApplicationsV3({
    filters,
    searchTerm: debouncedSearchTerm,
    page: currentPage,
    pageSize: 20,
    selectedEmiMonth
  });

  // Get current application IDs for selective real-time updates
  const currentApplicationIds = useMemo(() => 
    applications.map(app => app.applicant_id), 
    [applications]
  );

  // Use optimized real-time updates
  const { isActive: realtimeActive } = useOptimizedRealtimeUpdates({
    onApplicationUpdate: async () => {
      if (!document.hidden) {
        console.log('Real-time application update triggered');
        await refetch();
      }
    },
    onStatusUpdate: async () => {
      if (!document.hidden) {
        console.log('Real-time status update triggered');
        // Only refetch if we're viewing the affected applications
        await refetch();
      }
    },
    selectedEmiMonth,
    currentApplicationIds
  });

  const { exportPtpCommentsReport, exportFullReport, exportPlanVsAchievementReport, planVsAchievementLoading } = useEnhancedExport();

  // Restore state on component mount
  useEffect(() => {
    if (!hasRestoredState && !authLoading && user && defaultEmiMonth) {
      setIsRestoringState(true);
      
      // Restore filters and search state
      const savedFiltersState = restoreFiltersState();
      if (savedFiltersState) {
        setSearchTerm(savedFiltersState.searchTerm || "");
        setCurrentPage(savedFiltersState.currentPage || 1);
      }

      // Restore selected application
      const savedApplicationId = restoreSelectedApplication();
      if (savedApplicationId && applications.length > 0) {
        const app = applications.find(a => a.id === savedApplicationId);
        if (app) {
          setSelectedApplication(app);
        }
      }

      // Restore scroll position
      restoreScrollPosition();
      
      setHasRestoredState(true);
      setIsRestoringState(false);
    }
  }, [hasRestoredState, authLoading, user, applications, defaultEmiMonth, restoreFiltersState, restoreSelectedApplication, restoreScrollPosition, setIsRestoringState]);

  // Save scroll position when user scrolls (throttled)
  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition(window.scrollY);
    };

    const throttledScroll = throttle(handleScroll, 1000);
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [saveScrollPosition]);

  // Save filters state when they change (with debounce)
  useEffect(() => {
    if (hasRestoredState) {
      const timeout = setTimeout(() => {
        saveFiltersState(filters, searchTerm, currentPage);
      }, 1000); // Debounce save operations
      
      return () => clearTimeout(timeout);
    }
  }, [filters, searchTerm, currentPage, hasRestoredState, saveFiltersState]);

  // Reset page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters, selectedEmiMonth]);

  // Optimized user profiles loading
  useEffect(() => {
    if (user && applications.length > 0) {
      const timeout = setTimeout(() => {
        const userIds = [...new Set([user.id])];
        fetchProfiles(userIds);
      }, 500); // Delay to avoid blocking main render
      
      return () => clearTimeout(timeout);
    }
  }, [user, applications.length, fetchProfiles]);

  const handleApplicationDeleted = () => {
    refetch();
    setSelectedApplication(null);
    saveSelectedApplication(null);
  };

  const handleApplicationUpdated = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    saveSelectedApplication(updatedApp.id);
    refetch();
  };

  const handleDataChanged = async () => {
    await refetch();
    if (selectedApplication) {
      const updatedApp = applications.find(app => app.applicant_id === selectedApplication.applicant_id);
      if (updatedApp) {
        setSelectedApplication(updatedApp);
      }
    }
  };

  const handleApplicationSelect = (app: Application) => {
    setSelectedApplication(app);
    saveSelectedApplication(app.id);
  };

  const handleApplicationClose = () => {
    setSelectedApplication(null);
    saveSelectedApplication(null);
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
          />

          {statusLoading ? (
            <StatusCardsSkeleton />
          ) : (
            <StatusCards statusCounts={statusCounts} />
          )}

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
              pageSize={20}
              selectedEmiMonth={selectedEmiMonth}
            />
          )}
        </div>
      </div>

      <PWAInstallPrompt />

      {/* Application Details Panel with proper overlay positioning */}
      {selectedApplication && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleApplicationClose}
          />
          {/* Panel */}
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

// Simple throttle utility
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

export default Index;
