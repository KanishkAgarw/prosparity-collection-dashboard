
import { Application } from "@/types/application";
import { FilterOptions } from "@/types/application";

export function calculateAvailableOptions(applications: Application[]): FilterOptions {
  // Extract unique values for each filter option
  const branches = [...new Set(applications.map(app => app.branch_name))].filter(Boolean).sort();
  const teamLeads = [...new Set(applications.map(app => app.team_lead))].filter(Boolean).sort();
  const dealers = [...new Set(applications.map(app => app.dealer_name))].filter(Boolean).sort();
  const lenders = [...new Set(applications.map(app => app.lender_name))].filter(Boolean).sort();
  const statuses = [...new Set(applications.map(app => app.field_status || 'Unpaid'))].filter(Boolean).sort();
  const repayments = [...new Set(applications.map(app => app.repayment))].filter(Boolean).sort();
  const collectionRMs = [...new Set(applications.map(app => app.collection_rm))].filter(Boolean).sort();

  // Generate EMI month options based on EMI amounts
  const emiAmounts = applications.map(app => app.emi_amount).filter(amount => amount > 0);
  const minEmi = Math.min(...emiAmounts);
  const maxEmi = Math.max(...emiAmounts);
  
  const emiMonths: string[] = [];
  if (emiAmounts.length > 0) {
    const step = Math.max(1000, Math.floor((maxEmi - minEmi) / 10));
    for (let i = minEmi; i <= maxEmi; i += step) {
      emiMonths.push(`${i.toLocaleString()} - ${(i + step - 1).toLocaleString()}`);
    }
  }

  // Generate last month bounce options
  const bounceValues = [...new Set(applications.map(app => app.last_month_bounce || 0))].sort((a, b) => a - b);
  const lastMonthBounce = bounceValues.map(value => value.toString());

  return {
    branches,
    teamLeads,
    dealers,
    lenders,
    statuses,
    emiMonths,
    repayments,
    lastMonthBounce,
    collectionRMs
  };
}
