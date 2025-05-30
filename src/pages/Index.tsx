import { useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { User, Mail, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileStatusCards from "@/components/MobileStatusCards";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";
import ApplicationsTable from "@/components/ApplicationsTable";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import AdminUserManagement from "@/components/AdminUserManagement";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import { useCascadingFilters } from "@/hooks/useCascadingFilters";
import { format, parse, isValid } from "date-fns";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { applications, loading: appsLoading, refetch } = useApplications();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  // Format EMI month to MMM-YY format properly
  const formatEmiMonth = (emiMonth: string) => {
    if (!emiMonth) return emiMonth;
    
    try {
      // Handle Excel serial date numbers (like 45778)
      if (/^\d+$/.test(emiMonth)) {
        // Excel serial date: days since January 1, 1900
        const excelEpoch = new Date(1900, 0, 1);
        const serialDate = parseInt(emiMonth);
        // Excel incorrectly treats 1900 as a leap year, so subtract 2 days
        const actualDate = new Date(excelEpoch.getTime() + (serialDate - 2) * 24 * 60 * 60 * 1000);
        return format(actualDate, 'MMM-yy');
      }
      
      // Handle MM/YYYY format
      if (/^\d{1,2}\/\d{4}$/.test(emiMonth)) {
        const [month, year] = emiMonth.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, 'MMM-yy');
      }
      
      // Handle YYYY-MM format
      if (/^\d{4}-\d{2}$/.test(emiMonth)) {
        const [year, month] = emiMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, 'MMM-yy');
      }
      
      // Handle MMM YYYY format (Jan 2024)
      if (/^[A-Za-z]{3}\s\d{4}$/.test(emiMonth)) {
        const date = new Date(emiMonth);
        if (!isNaN(date.getTime())) {
          return format(date, 'MMM-yy');
        }
      }
      
      // If already in MMM-YY format, return as is
      if (/^[A-Za-z]{3}-\d{2}$/.test(emiMonth)) {
        return emiMonth;
      }
      
      // Return as is if can't parse
      return emiMonth;
    } catch {
      return emiMonth;
    }
  };

  // Convert applications to the format expected by existing components
  const formattedApplications = useMemo(() => {
    if (!applications) return [];
    console.log('Raw applications from database:', applications);
    
    return applications.map(app => {
      const formatted = {
        applicationId: app.application_id,
        applicantName: app.applicant_name,
        branch: app.branch,
        teamLead: app.team_lead,
        rm: app.rm,
        dealer: app.dealer,
        lender: app.lender,
        status: app.status,
        emiDue: app.emi_due,
        amountPaid: app.amount_paid,
        paidDate: app.paid_date,
        ptpDate: app.ptp_date,
        demandMonth: formatEmiMonth(app.emi_month),
        rmComments: app.rm_comments,
        auditLogs: []
      };
      
      console.log(`Formatted EMI month for ${app.application_id}: ${app.emi_month} -> ${formatted.demandMonth}`);
      return formatted;
    });
  }, [applications]);

  // Use the new cascading filter system
  const {
    filters,
    filteredApplications: cascadeFilteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications: formattedApplications });

  // Apply search filter on top of cascade filtered applications
  const finalFilteredApplications = useMemo(() => {
    return cascadeFilteredApplications.filter(app => {
      const matchesSearch = searchTerm === "" || 
        app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [cascadeFilteredApplications, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts = finalFilteredApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEMIs = finalFilteredApplications.length;
    const fullyPaid = counts['Paid'] || 0;
    const partiallyPaid = counts['Partially Paid'] || 0;
    const unpaid = counts['Unpaid'] || 0;

    console.log('Status counts:', { totalEMIs, fullyPaid, partiallyPaid, unpaid });

    return {
      totalEMIs,
      fullyPaid,
      partiallyPaid,
      unpaid
    };
  }, [finalFilteredApplications]);

  // All hooks are called above this point - now we can do conditional returns
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <img 
            src="/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png" 
            alt="ProsParity Logo" 
            className="w-12 h-12 mx-auto mb-4"
          />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = user?.email === 'kanishk@prosparity.in';

  const handleRowClick = (application: any) => {
    setSelectedApplication(application);
  };

  const handleClosePanel = () => {
    setSelectedApplication(null);
  };

  const handleSaveApplication = () => {
    setSelectedApplication(null);
    refetch();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img 
                src="/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png" 
                alt="ProsParity Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">ProsParity</h1>
                <p className="text-xs sm:text-sm text-gray-500">Collection Management</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-sm font-semibold text-gray-900">ProsParity</h1>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <UploadApplicationDialog onApplicationAdded={refetch} />
              <AdminUserManagement isAdmin={isAdmin} />
              
              {/* Mobile Menu */}
              {isMobile ? (
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>User Menu</DrawerTitle>
                      <DrawerDescription>
                        Logged in as {user.email}
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <DrawerFooter>
                      <Button onClick={handleSignOut} variant="outline">
                        <LogOut className="h-4 w-4 mr-2" />
                        Log Out
                      </Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700 hidden md:inline">{user.email}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Log Out</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <MobileFilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          filterOptions={availableOptions}
        />
        
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <MobileStatusCards data={statusCounts} />
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {appsLoading ? (
            <div className="p-8 text-center">Loading applications...</div>
          ) : finalFilteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              {searchTerm || Object.values(filters).some(f => f.length > 0) ? (
                <p className="text-gray-500">No applications found matching your search criteria.</p>
              ) : (
                <p className="text-gray-500">No applications found. Upload some applications to get started.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ApplicationsTable 
                applications={finalFilteredApplications}
                onRowClick={handleRowClick}
                onApplicationDeleted={refetch}
                selectedApplicationId={selectedApplication?.applicationId}
              />
            </div>
          )}
        </div>
      </div>

      <ApplicationDetailsPanel
        application={selectedApplication}
        onClose={handleClosePanel}
        onSave={handleSaveApplication}
      />
    </div>
  );
};

export default Index;
