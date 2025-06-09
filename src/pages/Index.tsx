
import { useState, useMemo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { useExport } from "@/hooks/useExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useUserRoles } from "@/hooks/useUserRoles";
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
  const [currentPage, setCurrentPage] = useState(1);
  const { applications, allApplications, loading: appsLoading, refetch, totalCount, totalPages } = useApplications({ 
    page: currentPage, 
    pageSize: 50 
  });
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { exportToExcel } = useExport();

  // Set up real-time updates for the main applications list
  useRealtimeUpdates({
    onApplicationUpdate: refetch,
    onCommentUpdate: refetch, // Refresh when comments are updated
    onAuditLogUpdate: refetch, // Refresh when audit logs are updated
    onCallingLogUpdate: refetch // Refresh when calling logs are updated
  });

  // Use allApplications for filter generation and get filtered results
  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications: allApplications });

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
      app.rm_name.toLowerCase().includes(lowerSearchTerm) ||
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
  };

  const handleApplicationUpdated = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    // Refresh the main list to ensure all data is up to date
    refetch();
  };

  // New handler for when data changes in the detail panel
  const handleDataChanged = () => {
    refetch(); // Refresh the main applications list
  };

  const handleExport = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export' });
      
      const exportData = {
        applications: finalFilteredApplications
      };

      exportToExcel(exportData, 'collection-monitoring-report');
      toast.success('Export completed successfully!', { id: 'export' });
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
      <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8 max-w-7xl">
        <div className="space-y-6">
          <AppHeader 
            onExport={handleExport}
            onApplicationAdded={refetch}
          />

          <FiltersSection
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Status Cards - now using filtered applications */}
          <StatusCards applications={finalFilteredApplications} />

          <MainContent
            applications={paginatedFilteredApplications}
            onRowClick={setSelectedApplication}
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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSave={handleApplicationUpdated}
          onDataChanged={handleDataChanged}
        />
      )}
    </div>
  );
};

export default Index;
