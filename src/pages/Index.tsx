import { useState, useMemo } from "react";
import StatusCards from "@/components/StatusCards";
import FilterBar from "@/components/FilterBar";
import ApplicationsTable from "@/components/ApplicationsTable";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import { mockApplications, getFilterOptions, getStatusCounts } from "@/utils/mockData";
import { Application, AuditLog } from "@/types/application";

const Index = () => {
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filters, setFilters] = useState({
    branch: "all",
    teamLead: "all",
    dealer: "all",
    lender: "all",
    status: "all",
    emiMonth: "all"
  });

  const filterOptions = useMemo(() => getFilterOptions(applications), [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      return (
        (filters.branch === "all" || app.branch === filters.branch) &&
        (filters.teamLead === "all" || app.teamLead === filters.teamLead) &&
        (filters.dealer === "all" || app.dealer === filters.dealer) &&
        (filters.lender === "all" || app.lender === filters.lender) &&
        (filters.status === "all" || app.status === filters.status) &&
        (filters.emiMonth === "all" || app.demandMonth === filters.emiMonth)
      );
    });
  }, [applications, filters]);

  const statusCounts = useMemo(() => getStatusCounts(filteredApplications), [filteredApplications]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRowClick = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleClosePanel = () => {
    setSelectedApplication(null);
  };

  const handleSaveApplication = (updatedApp: Application, logs: AuditLog[]) => {
    setApplications(prev => 
      prev.map(app => 
        app.applicationId === updatedApp.applicationId 
          ? { ...updatedApp, auditLogs: [...(app.auditLogs || []), ...logs] }
          : app
      )
    );
    setSelectedApplication(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-lg p-2">
                <span className="font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ProsParity</h1>
                <p className="text-sm text-gray-500">Collection Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Your Access Level: Admin - You have full access to all applications.
              </span>
              <div className="text-right">
                <p className="text-sm font-medium">Admin Panel</p>
                <p className="text-xs text-gray-500">kanak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatusCards data={statusCounts} />
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
        />
        <div className="bg-white rounded-lg shadow">
          <ApplicationsTable 
            applications={filteredApplications}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Right Panel */}
      <ApplicationDetailsPanel
        application={selectedApplication}
        onClose={handleClosePanel}
        onSave={handleSaveApplication}
      />
    </div>
  );
};

export default Index;
