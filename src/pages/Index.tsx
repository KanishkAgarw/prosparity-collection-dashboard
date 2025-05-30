
import { useState, useMemo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { Application } from "@/types/application";
import ApplicationsTable from "@/components/ApplicationsTable";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";
import StatusCards from "@/components/StatusCards";
import MobileStatusCards from "@/components/MobileStatusCards";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import AdminUserManagement from "@/components/AdminUserManagement";
import UserSidebar from "@/components/UserSidebar";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";

const Index = () => {
  const { user } = useAuth();
  const { applications, loading, refetch } = useApplications();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Transform applications to match expected interface
  const transformedApplications = useMemo(() => {
    return applications.map(app => ({
      applicationId: app.applicant_id,
      applicantName: app.applicant_name,
      branch: app.branch_name,
      teamLead: app.team_lead,
      rm: app.rm_name,
      dealer: app.dealer_name,
      lender: app.lender_name,
      status: app.status,
      emiDue: app.emi_amount,
      demandMonth: app.demand_date || '',
      ptpDate: app.ptp_date,
      rmComments: app.rm_comments,
      ...app
    }));
  }, [applications]);

  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications: transformedApplications });

  // Apply search filter
  const searchFilteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return filteredApplications;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return filteredApplications.filter(app =>
      app.applicantName.toLowerCase().includes(lowerSearchTerm) ||
      app.applicationId.toLowerCase().includes(lowerSearchTerm) ||
      app.dealer.toLowerCase().includes(lowerSearchTerm) ||
      app.lender.toLowerCase().includes(lowerSearchTerm) ||
      app.rm.toLowerCase().includes(lowerSearchTerm) ||
      app.teamLead.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filteredApplications, searchTerm]);

  const handleApplicationDeleted = () => {
    refetch();
    setSelectedApplication(null);
  };

  const handleSaveApplication = () => {
    refetch();
  };

  const isAdmin = user?.email === 'kanishk@prosparity.in';

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-1">
          <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Applications Dashboard</h1>
                  <p className="text-gray-600">Manage and track all applications</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <UploadApplicationDialog onApplicationAdded={refetch} />
                  {isAdmin && <AdminUserManagement isAdmin={isAdmin} />}
                </div>
              </div>

              {/* Status Cards */}
              <div className="hidden sm:block">
                <StatusCards applications={searchFilteredApplications} />
              </div>
              <div className="sm:hidden">
                <MobileStatusCards applications={searchFilteredApplications} />
              </div>

              {/* Search and Filters */}
              <div className="space-y-4">
                <SearchBar 
                  searchTerm={searchTerm} 
                  onSearchChange={setSearchTerm}
                  placeholder="Search by name, ID, dealer, lender, RM, or team lead..."
                />
                
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

              {/* Applications Table */}
              <div className="bg-white rounded-lg shadow">
                <ApplicationsTable
                  applications={searchFilteredApplications}
                  onRowClick={setSelectedApplication}
                  onApplicationDeleted={handleApplicationDeleted}
                  selectedApplicationId={selectedApplication?.id}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Application Details Panel */}
        {selectedApplication && (
          <ApplicationDetailsPanel
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            onSave={handleSaveApplication}
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Index;
