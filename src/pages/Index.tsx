
import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { User, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusCards from "@/components/StatusCards";
import FilterBar from "@/components/FilterBar";
import ApplicationsTable from "@/components/ApplicationsTable";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import { format, parse, isValid } from "date-fns";
import { toast } from "sonner";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { applications, loading: appsLoading, refetch } = useApplications();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [filters, setFilters] = useState({
    branch: [] as string[],
    teamLead: [] as string[],
    dealer: [] as string[],
    lender: [] as string[],
    status: [] as string[],
    emiMonth: [] as string[]
  });

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
    console.log('Raw applications from database:', applications); // Debug log
    
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
        paidDate: app.paid_date,
        ptpDate: app.ptp_date,
        demandMonth: formatEmiMonth(app.emi_month),
        rmComments: app.rm_comments,
        auditLogs: []
      };
      
      console.log(`Formatted EMI month for ${app.application_id}: ${app.emi_month} -> ${formatted.demandMonth}`); // Debug log
      return formatted;
    });
  }, [applications]);

  const filterOptions = useMemo(() => {
    const branches = [...new Set(formattedApplications.map(app => app.branch))];
    const teamLeads = [...new Set(formattedApplications.map(app => app.teamLead))];
    const dealers = [...new Set(formattedApplications.map(app => app.dealer))];
    const lenders = [...new Set(formattedApplications.map(app => app.lender))];
    const statuses = [...new Set(formattedApplications.map(app => app.status))];
    const emiMonths = [...new Set(formattedApplications.map(app => app.demandMonth))];

    return {
      branches,
      teamLeads,
      dealers,
      lenders,
      statuses,
      emiMonths
    };
  }, [formattedApplications]);

  const filteredApplications = useMemo(() => {
    return formattedApplications.filter(app => {
      return (
        (filters.branch.length === 0 || filters.branch.includes(app.branch)) &&
        (filters.teamLead.length === 0 || filters.teamLead.includes(app.teamLead)) &&
        (filters.dealer.length === 0 || filters.dealer.includes(app.dealer)) &&
        (filters.lender.length === 0 || filters.lender.includes(app.lender)) &&
        (filters.status.length === 0 || filters.status.includes(app.status)) &&
        (filters.emiMonth.length === 0 || filters.emiMonth.includes(app.demandMonth))
      );
    });
  }, [formattedApplications, filters]);

  const statusCounts = useMemo(() => {
    const counts = filteredApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEMIs = filteredApplications.length;
    const fullyPaid = counts['Paid'] || 0;
    const partiallyPaid = counts['Partially Paid'] || 0;
    const unpaid = counts['Unpaid'] || 0;

    console.log('Status counts:', { totalEMIs, fullyPaid, partiallyPaid, unpaid }); // Debug log

    return {
      totalEMIs,
      fullyPaid,
      partiallyPaid,
      unpaid
    };
  }, [filteredApplications]);

  // All hooks are called above this point - now we can do conditional returns
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 text-white rounded-lg p-2 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="font-bold text-xl">P</span>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

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
              <UploadApplicationDialog onApplicationAdded={refetch} />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
        />
        
        <StatusCards data={statusCounts} />
        
        <div className="bg-white rounded-lg shadow">
          {appsLoading ? (
            <div className="p-8 text-center">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No applications found. Upload some applications to get started.</p>
            </div>
          ) : (
            <ApplicationsTable 
              applications={filteredApplications}
              onRowClick={handleRowClick}
              onApplicationDeleted={refetch}
              selectedApplicationId={selectedApplication?.applicationId}
            />
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
