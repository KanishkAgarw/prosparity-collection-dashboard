
import { Application } from "@/types/application";

export const mockApplications: Application[] = [
  {
    applicationId: "PROSAPP241017000004",
    applicantName: "Mrs Parveen Bi",
    branch: "Bhopal",
    teamLead: "Hemant Joshi",
    rm: "Manish Rajpoot",
    dealer: "VG Constructions",
    lender: "Vivrti",
    status: "Paid",
    emiDue: 8000,
    amountPaid: 8500,
    paidDate: "2024-05-15",
    ptpDate: "",
    demandMonth: "May 2024",
    auditLogs: []
  },
  {
    applicationId: "PROSAPP241023000014",
    applicantName: "Mr Sandeep Lodhi",
    branch: "Indore",
    teamLead: "Mrunal Desai",
    rm: "Imtiyaz Ali Pankaj",
    dealer: "Leeza Enterprises",
    lender: "Namdev",
    status: "Partially Paid",
    emiDue: 8000,
    amountPaid: 3000,
    paidDate: "",
    ptpDate: "2024-05-27",
    demandMonth: "May 2024",
    auditLogs: []
  },
  {
    applicationId: "PROSAPP241023000004",
    applicantName: "Mrs Anita Ahirwar",
    branch: "Jabalpur",
    teamLead: "Puran Mal",
    rm: "Namdev",
    dealer: "Mansion Enterprises",
    lender: "Mantika",
    status: "Unpaid",
    emiDue: 9500,
    amountPaid: 0,
    paidDate: "",
    ptpDate: "2024-05-30",
    demandMonth: "May 2024",
    auditLogs: []
  }
];

export const getFilterOptions = (applications: Application[]) => {
  return {
    branches: [...new Set(applications.map(app => app.branch))],
    teamLeads: [...new Set(applications.map(app => app.teamLead))],
    dealers: [...new Set(applications.map(app => app.dealer))],
    lenders: [...new Set(applications.map(app => app.lender))],
    statuses: ["Paid", "Unpaid", "Partially Paid", "Overdue"],
    emiMonths: [...new Set(applications.map(app => app.demandMonth))]
  };
};

export const getStatusCounts = (applications: Application[]) => {
  return {
    totalEMIs: applications.length,
    paidThisWeek: applications.filter(app => app.status === "Paid").length,
    unpaid: applications.filter(app => app.status === "Unpaid").length,
    partiallyPaid: applications.filter(app => app.status === "Partially Paid").length,
    overdue: applications.filter(app => app.status === "Overdue").length
  };
};
