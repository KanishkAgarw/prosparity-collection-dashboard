
import { useState, useMemo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { useExport } from "@/hooks/useExport";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { Application } from "@/types/application";
import ApplicationsTable from "@/components/ApplicationsTable";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";
import StatusCards from "@/components/StatusCards";
import MobileStatusCards from "@/components/MobileStatusCards";
import PaginationControls from "@/components/PaginationControls";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import AdminUserManagement from "@/components/AdminUserManagement";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Download, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [currentPage, setCurrentPage] = useState(1);
  const { applications, loading: appsLoading, refetch, totalCount, totalPages } = useApplications({ 
    page: currentPage, 
    pageSize: 50 
  });
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { exportToExcel, exportToCSV } = useExport();

  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications });

  // Get user full name for display
  const userDisplayName = useMemo(() => {
    if (!user) return '';
    return getUserName(user.id, user.email || '');
  }, [user, getUserName]);

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
    // Optimistic update - update the selected application without full refetch
    setSelectedApplication(updatedApp);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error("Error signing out");
      } else {
        toast.success("Signed out successfully");
        navigate('/auth');
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      toast.loading('Preparing export...', { id: 'export' });
      
      const exportData = {
        applications: sortedAndSearchFilteredApplications
      };

      if (format === 'excel') {
        exportToExcel(exportData, 'collection-monitoring-report');
      } else {
        exportToCSV(exportData, 'collection-summary');
      }

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

  const isAdmin = user?.email === 'kanishk@prosparity.in';

  // Show loading for applications
  if (appsLoading) {
    return <div className="flex items-center justify-center h-screen">Loading applications...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png" 
                alt="Prosparity Logo" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Collection Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Admin buttons and Export - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export to CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isAdmin && <UploadApplicationDialog onApplicationAdded={refetch} />}
                {isAdmin && <AdminUserManagement isAdmin={isAdmin} />}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="hidden sm:inline font-medium">{userDisplayName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Export Button */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="hidden lg:block">
              <FilterBar
                filters={filters}
                availableOptions={availableOptions}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            <div className="lg:hidden">
              <MobileFilterBar
                filters={filters}
                availableOptions={availableOptions}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Search */}
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm}
            placeholder="Search by name, ID, dealer, lender, RM, or team lead..."
          />

          {/* Status Cards */}
          <div className="hidden sm:block">
            <StatusCards applications={sortedAndSearchFilteredApplications} />
          </div>
          <div className="sm:hidden">
            <MobileStatusCards applications={sortedAndSearchFilteredApplications} />
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-lg shadow">
            <ApplicationsTable
              applications={sortedAndSearchFilteredApplications}
              onRowClick={setSelectedApplication}
              onApplicationDeleted={handleApplicationDeleted}
              selectedApplicationId={selectedApplication?.id}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalCount={totalCount}
                pageSize={50}
              />
            )}
          </div>
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
