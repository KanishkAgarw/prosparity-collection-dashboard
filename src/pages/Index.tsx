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
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { applications, loading: appsLoading, refetch } = useApplications();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications });

  // Apply search filter
  const searchFilteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return filteredApplications;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return filteredApplications.filter(app =>
      app.applicant_name.toLowerCase().includes(lowerSearchTerm) ||
      app.applicant_id.toLowerCase().includes(lowerSearchTerm) ||
      app.dealer_name.toLowerCase().includes(lowerSearchTerm) ||
      app.lender_name.toLowerCase().includes(lowerSearchTerm) ||
      app.rm_name.toLowerCase().includes(lowerSearchTerm) ||
      app.team_lead.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filteredApplications, searchTerm]);

  const handleApplicationDeleted = () => {
    refetch();
    setSelectedApplication(null);
  };

  const handleSaveApplication = () => {
    refetch();
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
              <div className="flex items-center gap-2">
                <UploadApplicationDialog onApplicationAdded={refetch} />
                {isAdmin && <AdminUserManagement isAdmin={isAdmin} />}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
            <StatusCards applications={searchFilteredApplications} />
          </div>
          <div className="sm:hidden">
            <MobileStatusCards applications={searchFilteredApplications} />
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

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSave={handleSaveApplication}
        />
      )}
    </div>
  );
};

export default Index;
