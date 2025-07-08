
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCounts {
  total: number;
  statusUnpaid: number;
  statusPartiallyPaid: number;
  statusCashCollected: number;
  statusCustomerDeposited: number;
  statusPaid: number;
  statusPendingApproval: number;
}

interface StatusCardsProps {
  statusCounts: StatusCounts;
}

const StatusCards = ({ statusCounts }: StatusCardsProps) => {
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((value / total) * 100)}%`;
  };

  // Arrangement: Total → Status (user-editable)
  const cards = [
    {
      title: "Total",
      value: statusCounts.total,
      percentage: null,
      className: "bg-blue-50 border-blue-200"
    },
    // Status Cards (renamed from Field Status)
    {
      title: "Unpaid",
      value: statusCounts.statusUnpaid,
      percentage: calculatePercentage(statusCounts.statusUnpaid, statusCounts.total),
      className: "bg-red-50 border-red-200"
    },
    {
      title: "Partially Paid",
      value: statusCounts.statusPartiallyPaid,
      percentage: calculatePercentage(statusCounts.statusPartiallyPaid, statusCounts.total),
      className: "bg-yellow-50 border-yellow-200"
    },
    {
      title: "Cash Collected",
      value: statusCounts.statusCashCollected,
      percentage: calculatePercentage(statusCounts.statusCashCollected, statusCounts.total),
      className: "bg-orange-50 border-orange-200"
    },
    {
      title: "Customer Deposited",
      value: statusCounts.statusCustomerDeposited,
      percentage: calculatePercentage(statusCounts.statusCustomerDeposited, statusCounts.total),
      className: "bg-indigo-50 border-indigo-200"
    },
    {
      title: "Paid",
      value: statusCounts.statusPaid,
      percentage: calculatePercentage(statusCounts.statusPaid, statusCounts.total),
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Paid (Pending Approval)",
      value: statusCounts.statusPendingApproval,
      percentage: calculatePercentage(statusCounts.statusPendingApproval, statusCounts.total),
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
            {card.percentage && (
              <div className="text-xs text-gray-500 text-center mt-1">{card.percentage}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusCards;
