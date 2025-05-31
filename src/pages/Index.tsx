
import React, { useState, useMemo } from 'react';
import { useApplications } from '@/hooks/useApplications';
import { useCascadingFilters } from '@/hooks/useCascadingFilters';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import StatusCards from '@/components/StatusCards';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import MobileFilterBar from '@/components/MobileFilterBar';
import ApplicationsTable from '@/components/ApplicationsTable';
import MobileOptimizedTable from '@/components/MobileOptimizedTable';
import PaginationControls from '@/components/PaginationControls';
import UploadApplicationDialog from '@/components/UploadApplicationDialog';
import SimpleBulkUserUpload from '@/components/SimpleBulkUserUpload';
import UserManagementDialog from '@/components/UserManagementDialog';
import AppHeader from '@/components/layout/AppHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExport } from '@/hooks/useExport';

const Index = () => {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>();
  const pageSize = 50;
  
  const {
    applications,
    allApplications,
    totalCount,
    totalPages,
    loading,
    refetch
  } = useApplications({ page: currentPage, pageSize });

  const {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  } = useCascadingFilters({ applications: allApplications });

  const { handleExport } = useExport();

  // Search functionality
  const searchedApplications = useMemo(() => {
    if (!searchTerm.trim()) return filteredApplications;
    
    const searchLower = searchTerm.toLowerCase();
    return filteredApplications.filter(app => 
      app.applicant_name?.toLowerCase().includes(searchLower) ||
      app.applicant_id?.toLowerCase().includes(searchLower) ||
      app.applicant_mobile?.toLowerCase().includes(searchLower) ||
      app.applicant_address?.toLowerCase().includes(searchLower) ||
      app.dealer_name?.toLowerCase().includes(searchLower) ||
      app.lender_name?.toLowerCase().includes(searchLower) ||
      app.rm_name?.toLowerCase().includes(searchLower)
    );
  }, [filteredApplications, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplicationAdded = () => {
    refetch();
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleRowClick = (application: any) => {
    setSelectedApplicationId(application.id);
  };

  // Memoize status cards data
  const statusData = useMemo(() => {
    const total = searchedApplications.length;
    const paid = searchedApplications.filter(app => app.status === 'Paid').length;
    const unpaid = searchedApplications.filter(app => app.status === 'Unpaid').length;
    const partial = searchedApplications.filter(app => app.status === 'Partial').length;

    return { total, paid, unpaid, partial };
  }, [searchedApplications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader onExport={handleExport} onApplicationAdded={handleApplicationAdded} />
        <main className="container mx-auto px-4 py-6">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader onExport={handleExport} onApplicationAdded={handleApplicationAdded} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications Dashboard</h1>
            <p className="text-gray-600">
              Manage and track all loan applications
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <UploadApplicationDialog onApplicationAdded={handleApplicationAdded} />
            <SimpleBulkUserUpload />
            <UserManagementDialog />
          </div>
        </div>

        <StatusCards applications={searchedApplications} />

        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by applicant name, ID, mobile, or address..."
          />
          
          {isMobile ? (
            <MobileFilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              availableOptions={availableOptions}
            />
          ) : (
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              availableOptions={availableOptions}
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          {isMobile ? (
            <MobileOptimizedTable 
              applications={searchedApplications} 
              onRowClick={handleRowClick}
              selectedApplicationId={selectedApplicationId}
            />
          ) : (
            <ApplicationsTable 
              applications={searchedApplications} 
              onRowClick={handleRowClick}
              selectedApplicationId={selectedApplicationId}
              onApplicationDeleted={refetch}
            />
          )}
        </div>

        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalCount={totalCount}
            pageSize={pageSize}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
