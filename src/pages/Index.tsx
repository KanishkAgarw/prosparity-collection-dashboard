
import { useState, useMemo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { useExport } from "@/hooks/useExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Application } from "@/types/application";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import AppHeader from "@/components/layout/AppHeader";
import FiltersSection from "@/components/layout/FiltersSection";
import MainContent from "@/components/layout/MainContent";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import StatusCards from "@/components/StatusCards";
import SearchBar from "@/components/SearchBar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
    onApplicationUpdate: refetch
  });

  // Use allApplications for filter generation instead of paginated applications
  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications: allApplications });

  // Apply search filter to the already filtered applications from the current page
  const searchFilteredApplications = useMemo(() => {
    let result = [...applications];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(app =>
        app.applicant_name.toLowerCase().includes(lowerSearchTerm) ||
        app.applicant_id.toLowerCase().includes(lowerSearchTerm) ||
        app.dealer_name.toLowerCase().includes(lowerSearchTerm) ||
        (app.lender_name === 'Vivriti Capital Limited' ? 'vivriti' : app.lender_name.toLowerCase()).includes(lowerSearchTerm) ||
        app.rm_name.toLowerCase().includes(lowerSearchTerm) ||
        app.team_lead.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply filters from cascading filters
    return result.filter(app => {
      const repaymentMatch = filters.repayment.length === 0 || 
        filters.repayment.includes(app.repayment?.replace(/(\d+)(st|nd|rd|th)/, '$1') || '');
      
      const categorizeLastMonthBounce = (bounce: number | null | undefined) => {
        if (bounce === null || bounce === undefined) return 'Not paid';
        if (bounce === 0) return 'Paid on time';
        if (bounce >= 1 && bounce <= 5) return '1-5 days late';
        if (bounce >= 6 && bounce <= 15) return '6-15 days late';
        if (bounce > 15) return '15+ days late';
        return 'Not paid';
      };
      
      const appLastMonthBounceCategory = categorizeLastMonthBounce(app.last_month_bounce);
      const lastMonthBounceMatch = filters.lastMonthBounce.length === 0 || 
        filters.lastMonthBounce.includes(appLastMonthBounceCategory);

      return (
        (filters.branch.length === 0 || filters.branch.includes(app.branch_name)) &&
        (filters.teamLead.length === 0 || filters.teamLead.includes(app.team_lead)) &&
        (filters.rm.length === 0 || filters.rm.includes(app.rm_name)) &&
        (filters.dealer.length === 0 || filters.dealer.includes(app.dealer_name)) &&
        (filters.lender.length === 0 || filters.lender.includes(app.lender_name)) &&
        (filters.status.length === 0 || filters.status.includes(app.status)) &&
        repaymentMatch &&
        lastMonthBounceMatch
      );
    });
  }, [applications, searchTerm, filters]);

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
        applications: searchFilteredApplications
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

          {/* Status Cards */}
          <StatusCards applications={allApplications} />

          <MainContent
            applications={searchFilteredApplications}
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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

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
