
import { useState, useMemo } from "react";
import { Application } from "@/types/application";
import { Filters } from "@/types/filters";

interface UseCascadingFiltersProps {
  applications: Application[];
}

export const useCascadingFilters = ({ applications }: UseCascadingFiltersProps) => {
  const [filters, setFilters] = useState<Filters>({
    branch: "all",
    rm: "all",
    teamLead: "all",
    lender: "all",
    status: "all",
    ptpDate: "all"
  });

  // Generate available options based on current filters and all applications
  const availableOptions = useMemo(() => {
    // Start with all applications for the first filter
    let filteredForBranch = applications;

    // Generate branch options
    const branches = Array.from(new Set(filteredForBranch.map(app => app.branch_name)))
      .sort()
      .map(branch => ({ value: branch, label: branch }));

    // Filter applications based on selected branch for RM options
    let filteredForRM = applications;
    if (filters.branch !== "all") {
      filteredForRM = filteredForRM.filter(app => app.branch_name === filters.branch);
    }

    // Generate RM options (prioritize collection_rm over rm_name)
    const rms = Array.from(new Set(filteredForRM.map(app => app.collection_rm || app.rm_name)))
      .filter(Boolean)
      .sort()
      .map(rm => ({ value: rm, label: rm }));

    // Filter for team lead options
    let filteredForTeamLead = filteredForRM;
    if (filters.rm !== "all") {
      filteredForTeamLead = filteredForTeamLead.filter(app => 
        (app.collection_rm || app.rm_name) === filters.rm
      );
    }

    const teamLeads = Array.from(new Set(filteredForTeamLead.map(app => app.team_lead)))
      .filter(Boolean)
      .sort()
      .map(lead => ({ value: lead, label: lead }));

    // Filter for lender options
    let filteredForLender = filteredForTeamLead;
    if (filters.teamLead !== "all") {
      filteredForLender = filteredForLender.filter(app => app.team_lead === filters.teamLead);
    }

    const lenders = Array.from(new Set(filteredForLender.map(app => app.lender_name)))
      .filter(Boolean)
      .sort()
      .map(lender => ({ 
        value: lender, 
        label: lender === 'Vivriti Capital Limited' ? 'Vivriti' : lender 
      }));

    // Filter for status options
    let filteredForStatus = filteredForLender;
    if (filters.lender !== "all") {
      filteredForStatus = filteredForStatus.filter(app => app.lender_name === filters.lender);
    }

    const statuses = Array.from(new Set(filteredForStatus.map(app => app.field_status || 'Unpaid')))
      .sort()
      .map(status => ({ value: status, label: status }));

    // PTP Date options with updated labels
    const ptpDateOptions = [
      { value: "all", label: "All PTP Dates" },
      { value: "today", label: "Today's PTP" },
      { value: "tomorrow", label: "Tomorrow's PTP" },
      { value: "overdue", label: "Overdue PTP" },
      { value: "future", label: "Future PTP" },
      { value: "no_ptp", label: "No PTP Set" }
    ];

    return {
      branches,
      rms,
      teamLeads,
      lenders,
      statuses,
      ptpDateOptions
    };
  }, [applications, filters]);

  // Filter applications based on current filter values
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Branch filter
      if (filters.branch !== "all" && app.branch_name !== filters.branch) {
        return false;
      }

      // RM filter (prioritize collection_rm over rm_name)
      if (filters.rm !== "all" && (app.collection_rm || app.rm_name) !== filters.rm) {
        return false;
      }

      // Team Lead filter
      if (filters.teamLead !== "all" && app.team_lead !== filters.teamLead) {
        return false;
      }

      // Lender filter
      if (filters.lender !== "all" && app.lender_name !== filters.lender) {
        return false;
      }

      // Status filter
      if (filters.status !== "all" && (app.field_status || 'Unpaid') !== filters.status) {
        return false;
      }

      // PTP Date filter with updated logic
      if (filters.ptpDate !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (filters.ptpDate) {
          case "today":
            if (!app.ptp_date) return false;
            const ptpToday = new Date(app.ptp_date);
            ptpToday.setHours(0, 0, 0, 0);
            return ptpToday.getTime() === today.getTime();
          
          case "tomorrow":
            if (!app.ptp_date) return false;
            const ptpTomorrow = new Date(app.ptp_date);
            ptpTomorrow.setHours(0, 0, 0, 0);
            return ptpTomorrow.getTime() === tomorrow.getTime();
          
          case "overdue":
            if (!app.ptp_date) return false;
            const ptpOverdue = new Date(app.ptp_date);
            ptpOverdue.setHours(0, 0, 0, 0);
            return ptpOverdue.getTime() < today.getTime();
          
          case "future":
            if (!app.ptp_date) return false;
            const ptpFuture = new Date(app.ptp_date);
            ptpFuture.setHours(0, 0, 0, 0);
            return ptpFuture.getTime() > tomorrow.getTime();
          
          case "no_ptp":
            return !app.ptp_date;
          
          default:
            return true;
        }
      }

      return true;
    });
  }, [applications, filters]);

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterType]: value };
      
      // Reset dependent filters when parent filter changes
      if (filterType === "branch") {
        newFilters.rm = "all";
        newFilters.teamLead = "all";
        newFilters.lender = "all";
        newFilters.status = "all";
      } else if (filterType === "rm") {
        newFilters.teamLead = "all";
        newFilters.lender = "all";
        newFilters.status = "all";
      } else if (filterType === "teamLead") {
        newFilters.lender = "all";
        newFilters.status = "all";
      } else if (filterType === "lender") {
        newFilters.status = "all";
      }
      
      return newFilters;
    });
  };

  return {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  };
};
