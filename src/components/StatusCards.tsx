
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { useMemo } from "react";

interface StatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  // LMS Status counts
  lmsUnpaid: number;
  lmsPartiallyPaid: number;
  lmsPaid: number;
  // Field Status counts
  fieldUnpaid: number;
  fieldPartiallyPaid: number;
  fieldCashCollected: number;
  fieldCustomerDeposited: number;
  fieldPaid: number;
}

const StatusCards = ({ applications }: StatusCardsProps) => {
  // Calculate counts from the filtered applications passed as props
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      
      // Count LMS status
      switch (app.lms_status) {
        case 'Unpaid':
          acc.lmsUnpaid++;
          break;
        case 'Partially Paid':
          acc.lmsPartiallyPaid++;
          break;
        case 'Paid':
          acc.lmsPaid++;
          break;
      }

      // Count field status
      switch (app.field_status) {
        case 'Unpaid':
          acc.fieldUnpaid++;
          break;
        case 'Partially Paid':
          acc.fieldPartiallyPaid++;
          break;
        case 'Cash Collected from Customer':
          acc.fieldCashCollected++;
          break;
        case 'Customer Deposited to Bank':
          acc.fieldCustomerDeposited++;
          break;
        case 'Paid':
          acc.fieldPaid++;
          break;
      }
      
      return acc;
    }, { 
      total: 0, 
      lmsUnpaid: 0,
      lmsPartiallyPaid: 0,
      lmsPaid: 0,
      fieldUnpaid: 0, 
      fieldPartiallyPaid: 0, 
      fieldCashCollected: 0, 
      fieldCustomerDeposited: 0, 
      fieldPaid: 0
    });

    return counts;
  }, [applications]);

  // Arrangement: Total → LMS Status (system) → Field Status (user-editable)
  const cards = [
    {
      title: "Total",
      value: statusCounts.total,
      className: "bg-blue-50 border-blue-200"
    },
    // LMS Status Cards
    {
      title: "LMS Unpaid",
      value: statusCounts.lmsUnpaid,
      className: "bg-red-100 border-red-300"
    },
    {
      title: "LMS Partially Paid",
      value: statusCounts.lmsPartiallyPaid,
      className: "bg-yellow-100 border-yellow-300"
    },
    {
      title: "LMS Paid",
      value: statusCounts.lmsPaid,
      className: "bg-green-100 border-green-300"
    },
    // Field Status Cards
    {
      title: "Field Unpaid",
      value: statusCounts.fieldUnpaid,
      className: "bg-red-50 border-red-200"
    },
    {
      title: "Field Partially Paid",
      value: statusCounts.fieldPartiallyPaid,
      className: "bg-yellow-50 border-yellow-200"
    },
    {
      title: "Field Cash Collected",
      value: statusCounts.fieldCashCollected,
      className: "bg-orange-50 border-orange-200"
    },
    {
      title: "Field Customer Deposited",
      value: statusCounts.fieldCustomerDeposited,
      className: "bg-indigo-50 border-indigo-200"
    },
    {
      title: "Field Paid",
      value: statusCounts.fieldPaid,
      className: "bg-green-50 border-green-200"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.className} border shadow-sm`}>
          <CardHeader className="pb-1 pt-2 px-2 md:pb-2 md:pt-3 md:px-3">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2 px-2 md:pb-3 md:px-3">
            <div className="text-lg md:text-2xl font-semibold text-gray-800">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusCards;
