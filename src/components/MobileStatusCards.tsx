
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { useMemo } from "react";

interface MobileStatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  lmsPaid: number;
  lmsBounced: number;
  lmsPaidAfterDue: number;
  fieldPaid: number;
}

const MobileStatusCards = ({ applications }: MobileStatusCardsProps) => {
  // Calculate counts from the applications data passed as props
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      
      // Count LMS status - only Paid, Bounced, and Paid after due date for mobile view
      switch (app.lms_status) {
        case 'Paid':
          acc.lmsPaid++;
          break;
        case 'Bounced':
          acc.lmsBounced++;
          break;
        case 'Paid after due date':
          acc.lmsPaidAfterDue++;
          break;
        // All other LMS statuses are not counted in mobile simplified view
      }

      // Count field status - only Paid for mobile simplified view
      switch (app.field_status) {
        case 'Paid':
          acc.fieldPaid++;
          break;
        // All other field statuses are not counted in mobile simplified view
      }
      
      return acc;
    }, {
      total: 0,
      lmsPaid: 0,
      lmsBounced: 0,
      lmsPaidAfterDue: 0,
      fieldPaid: 0
    });

    return counts;
  }, [applications]);

  const cards = [
    {
      title: "Total",
      value: statusCounts.total,
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "LMS Paid",
      value: statusCounts.lmsPaid,
      className: "bg-green-100 border-green-300"
    },
    {
      title: "LMS Paid after due date",
      value: statusCounts.lmsPaidAfterDue,
      className: "bg-amber-100 border-amber-300"
    },
    {
      title: "LMS Bounced",
      value: statusCounts.lmsBounced,
      className: "bg-red-100 border-red-300"
    },
    {
      title: "Field Paid",
      value: statusCounts.fieldPaid,
      className: "bg-green-50 border-green-200"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.className} border`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileStatusCards;
