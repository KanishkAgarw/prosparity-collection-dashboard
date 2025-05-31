
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
import { useMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useMobile();
  const [currentPage, setCurrentPage] = useState(1);
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
    searchTerm,
    setSearchTerm,
    selectedFilters,
    setSelectedFilters,
    filteredApplications,
    filterOptions
  } = useCascadingFilters(applications, allApplications);

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

  // Memoize status cards data
  const statusData = useMemo(() => {
    const total = allApplications.length;
    const paid = allApplications.filter(app => app.status === 'Paid').length;
    const unpaid = allApplications.filter(app => app.status === 'Unpaid').length;
    const partial = allApplications.filter(app => app.status === 'Partial').length;

    return { total, paid, unpaid, partial };
  }, [allApplications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="container mx-auto px-4 py-6">
          <LoadingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
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

        <StatusCards data={statusData} />

        <div className="space-y-4">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by applicant name, ID, mobile, or address..."
          />
          
          {isMobile ? (
            <MobileFilterBar
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
              filterOptions={filterOptions}
            />
          ) : (
            <FilterBar
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
              filterOptions={filterOptions}
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          {isMobile ? (
            <MobileOptimizedTable applications={filteredApplications} />
          ) : (
            <ApplicationsTable applications={filteredApplications} />
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
