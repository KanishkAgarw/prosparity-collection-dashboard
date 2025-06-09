
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { useMemo } from "react";

interface MobileStatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  fieldPaid: number;
  fieldUnpaid: number;
  fieldPartiallyPaid: number;
  lmsPaid: number;
  lmsUnpaid: number;
  lmsPartiallyPaid: number;
}

const MobileStatusCards = ({ applications }: MobileStatusCardsProps) => {
  // Calculate counts from the applications data passed as props
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      
      // Count field status
      switch (app.field_status) {
        case 'Paid':
          acc.fieldPaid++;
          break;
        case 'Unpaid':
          acc.fieldUnpaid++;
          break;
        case 'Partially Paid':
          acc.fieldPartiallyPaid++;
          break;
      }

      // Count LMS status
      switch (app.lms_status) {
        case 'Paid':
          acc.lmsPaid++;
          break;
        case 'Unpaid':
          acc.lmsUnpaid++;
          break;
        case 'Partially Paid':
          acc.lmsPartiallyPaid++;
          break;
      }
      
      return acc;
    }, {
      total: 0,
      fieldPaid: 0,
      fieldUnpaid: 0,
      fieldPartiallyPaid: 0,
      lmsPaid: 0,
      lmsUnpaid: 0,
      lmsPartiallyPaid: 0
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
      title: "Field Paid",
      value: statusCounts.fieldPaid,
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Field Unpaid",
      value: statusCounts.fieldUnpaid,
      className: "bg-red-50 border-red-200"
    },
    {
      title: "LMS Paid",
      value: statusCounts.lmsPaid,
      className: "bg-emerald-50 border-emerald-200"
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
