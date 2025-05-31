
import React, { useState, useMemo, useCallback } from "react";
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

  // Set up real-time updates
  useRealtimeUpdates({
    onApplicationUpdate: refetch
  });

  // Memoized cascading filters
  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications: allApplications });

  // Memoized search filtering
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

  // Memoized pagination
  const paginatedFilteredApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * 50;
    const endIndex = startIndex + 50;
    return finalFilteredApplications.slice(startIndex, endIndex);
  }, [finalFilteredApplications, currentPage]);

  // Memoized pagination info
  const paginationInfo = useMemo(() => ({
    filteredTotalCount: finalFilteredApplications.length,
    filteredTotalPages: Math.ceil(finalFilteredApplications.length / 50)
  }), [finalFilteredApplications.length]);

  // Load user profiles when needed
  useMemo(() => {
    if (user && applications.length > 0) {
      const userIds = [...new Set([user.id])];
      fetchProfiles(userIds);
    }
  }, [user, applications, fetchProfiles]);

  // Memoized callbacks
  const handleApplicationDeleted = useCallback(() => {
    refetch();
    setSelectedApplication(null);
  }, [refetch]);

  const handleApplicationUpdated = useCallback((updatedApp: Application) => {
    setSelectedApplication(updatedApp);
  }, []);

  const handleExport = useCallback(async () => {
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
  }, [finalFilteredApplications, exportToExcel]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
            onSearchChange={handleSearchChange}
          />

          <StatusCards applications={finalFilteredApplications} />

          <MainContent
            applications={paginatedFilteredApplications}
            onRowClick={setSelectedApplication}
            onApplicationDeleted={handleApplicationDeleted}
            selectedApplicationId={selectedApplication?.id}
            currentPage={currentPage}
            totalPages={paginationInfo.filteredTotalPages}
            onPageChange={handlePageChange}
            totalCount={paginationInfo.filteredTotalCount}
            pageSize={50}
          />
        </div>
      </div>

      <PWAInstallPrompt />

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
