
import { useState, useMemo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { useExport } from "@/hooks/useExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { Application } from "@/types/application";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import AppHeader from "@/components/layout/AppHeader";
import FiltersSection from "@/components/layout/FiltersSection";
import MainContent from "@/components/layout/MainContent";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { fetchProfiles } = useUserProfiles();
  const [currentPage, setCurrentPage] = useState(1);
  const { applications, loading: appsLoading, refetch, totalCount, totalPages } = useApplications({ 
    page: currentPage, 
    pageSize: 50 
  });
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { exportToExcel } = useExport();

  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications });

  // Sort applications by applicant name and apply search filter
  const sortedAndSearchFilteredApplications = useMemo(() => {
    let result = [...filteredApplications];
    
    // Sort by applicant name
    result.sort((a, b) => a.applicant_name.localeCompare(b.applicant_name));
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(app =>
        app.applicant_name.toLowerCase().includes(lowerSearchTerm) ||
        app.applicant_id.toLowerCase().includes(lowerSearchTerm) ||
        app.dealer_name.toLowerCase().includes(lowerSearchTerm) ||
        app.lender_name.toLowerCase().includes(lowerSearchTerm) ||
        app.rm_name.toLowerCase().includes(lowerSearchTerm) ||
        app.team_lead.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    return result;
  }, [filteredApplications, searchTerm]);

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
  };

  const handleExport = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export' });
      
      const exportData = {
        applications: sortedAndSearchFilteredApplications
      };

      exportToExcel(exportData, 'collection-monitoring-report');
      toast.success('Export completed successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data', { id: 'export' });
    }
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Redirect to auth if not authenticated
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show loading for applications
  if (appsLoading) {
    return <div className="flex items-center justify-center h-screen">Loading applications...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
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

          <MainContent
            applications={sortedAndSearchFilteredApplications}
            onRowClick={setSelectedApplication}
            onApplicationDeleted={handleApplicationDeleted}
            selectedApplicationId={selectedApplication?.id}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={totalCount}
            pageSize={50}
          />
        </div>
      </div>

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSave={handleApplicationUpdated}
        />
      )}
    </div>
  );
};

export default Index;
