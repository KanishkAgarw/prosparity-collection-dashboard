import { useState, useMemo, useEffect } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { useEnhancedExport } from "@/hooks/useEnhancedExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStatePersistence } from "@/hooks/useStatePersistence";
import { Application } from "@/types/application";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import AppHeader from "@/components/layout/AppHeader";
import FiltersSection from "@/components/layout/FiltersSection";
import MainContent from "@/components/layout/MainContent";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import StatusCards from "@/components/StatusCards";
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

  const { applications, allApplications, loading: appsLoading, refetch, totalCount, totalPages } = useApplications({ 
    page: currentPage, 
    pageSize: 50 
  });

  const { exportPtpCommentsReport, exportFullReport } = useEnhancedExport();

  // Restore state on component mount
  useEffect(() => {
    if (!hasRestoredState && !authLoading && user) {
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
  }, [hasRestoredState, authLoading, user, applications, restoreFiltersState, restoreSelectedApplication, restoreScrollPosition, setIsRestoringState]);

  // Save scroll position when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition(window.scrollY);
    };

    const throttledScroll = throttle(handleScroll, 1000);
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [saveScrollPosition]);

  // Set up real-time updates with optimized refresh logic
  const { isActive: realtimeActive } = useRealtimeUpdates({
    onApplicationUpdate: () => {
      // Only refetch if tab is active to prevent unnecessary network calls
      if (!document.hidden) {
        refetch();
      }
    },
    onCommentUpdate: refetch,
    onAuditLogUpdate: refetch,
    onCallingLogUpdate: refetch
  });

  // Use allApplications for filter generation and get filtered results
  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters(allApplications);

  // Save filters state when they change
  useEffect(() => {
    if (hasRestoredState) {
      saveFiltersState(filters, searchTerm, currentPage);
    }
  }, [filters, searchTerm, currentPage, hasRestoredState, saveFiltersState]);

  // Apply search filter to the filtered applications
  const finalFilteredApplications = useMemo(() => {
    if (!searchTerm.trim()) {
      return filteredApplications;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return filteredApplications.filter(app =>
      app.applicant_name.toLowerCase().includes(lowerSearchTerm) ||
      app.applicant_id.toLowerCase().includes(lowerSearchTerm) ||
      app.dealer_name.toLowerCase().includes(lowerSearchTerm) ||
      (app.lender_name === 'Vivriti Capital Limited' ? 'vivriti' : app.lender_name.toLowerCase()).includes(lowerSearchTerm) ||
      (app.rm_name || app.collection_rm || '').toLowerCase().includes(lowerSearchTerm) ||
      app.team_lead.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filteredApplications, searchTerm]);

  // For pagination, we need to slice the filtered results to match current page
  const paginatedFilteredApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * 50;
    const endIndex = startIndex + 50;
    return finalFilteredApplications.slice(startIndex, endIndex);
  }, [finalFilteredApplications, currentPage]);

  // Calculate pagination info based on filtered results
  const filteredTotalCount = finalFilteredApplications.length;
  const filteredTotalPages = Math.ceil(filteredTotalCount / 50);

  // Load user profiles for comments/logs when component mounts
  useMemo(() => {
    if (user && applications.length > 0) {
      const userIds = [...new Set([user.id])];
      fetchProfiles(userIds);
    }
  }, [user, applications, fetchProfiles]);

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

  const handleDataChanged = () => {
    refetch();
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
        applications: finalFilteredApplications
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
        applications: finalFilteredApplications
      };

      exportPtpCommentsReport(exportData, 'collection-ptp-comments-report');
      toast.success('PTP + Comments report exported successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', { id: 'export' });
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

  // Show loading for applications
  if (appsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          <AppHeader 
            onExportFull={handleExportFull}
            onExportPtpComments={handleExportPtpComments}
          />

          <FiltersSection
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          <StatusCards applications={finalFilteredApplications} />

          <MainContent
            applications={paginatedFilteredApplications}
            onRowClick={handleApplicationSelect}
            onApplicationDeleted={handleApplicationDeleted}
            selectedApplicationId={selectedApplication?.id}
            currentPage={currentPage}
            totalPages={filteredTotalPages}
            onPageChange={setCurrentPage}
            totalCount={filteredTotalCount}
            pageSize={50}
          />
        </div>
      </div>

      <PWAInstallPrompt />

      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={handleApplicationClose}
          onSave={handleApplicationUpdated}
          onDataChanged={handleDataChanged}
        />
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

}
