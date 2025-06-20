
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { useMemo } from "react";

interface StatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  // Status counts (renamed from field status)
  statusUnpaid: number;
  statusPartiallyPaid: number;
  statusCashCollected: number;
  statusCustomerDeposited: number;
  statusPaid: number;
  statusPendingApproval: number;
}

const StatusCards = ({ applications }: StatusCardsProps) => {
  // Calculate counts from the filtered applications passed as props
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      
      // Count status (renamed from field status)
      switch (app.field_status) {
        case 'Unpaid':
          acc.statusUnpaid++;
          break;
        case 'Partially Paid':
          acc.statusPartiallyPaid++;
          break;
        case 'Cash Collected from Customer':
          acc.statusCashCollected++;
          break;
        case 'Customer Deposited to Bank':
          acc.statusCustomerDeposited++;
          break;
        case 'Paid':
          acc.statusPaid++;
          break;
        case 'Paid (Pending Approval)':
          acc.statusPendingApproval++;
          break;
      }
      
      return acc;
    }, { 
      total: 0, 
      statusUnpaid: 0, 
      statusPartiallyPaid: 0, 
      statusCashCollected: 0, 
      statusCustomerDeposited: 0, 
      statusPaid: 0,
      statusPendingApproval: 0
    });

    return counts;
  }, [applications]);

  // Arrangement: Total → Status (user-editable)
  const cards = [
    {
      title: "Total",
      value: statusCounts.total,
      className: "bg-blue-50 border-blue-200"
    },
    // Status Cards (renamed from Field Status)
    {
      title: "Unpaid",
      value: statusCounts.statusUnpaid,
      className: "bg-red-50 border-red-200"
    },
    {
      title: "Partially Paid",
      value: statusCounts.statusPartiallyPaid,
      className: "bg-yellow-50 border-yellow-200"
    },
    {
      title: "Cash Collected",
      value: statusCounts.statusCashCollected,
      className: "bg-orange-50 border-orange-200"
    },
    {
      title: "Customer Deposited",
      value: statusCounts.statusCustomerDeposited,
      className: "bg-indigo-50 border-indigo-200"
    },
    {
      title: "Paid",
      value: statusCounts.statusPaid,
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Paid (Pending Approval)",
      value: statusCounts.statusPendingApproval,
      className: "bg-purple-50 border-purple-200"
    }
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1 sm:gap-2 md:gap-3">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.className} border shadow-sm`}>
          <CardHeader className="pb-1 pt-1 px-1 sm:pb-2 sm:pt-2 sm:px-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 text-center leading-tight">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-1 px-1 sm:pb-2 sm:px-2">
            <div className="text-sm sm:text-lg md:text-xl font-semibold text-gray-800 text-center">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusCards;
