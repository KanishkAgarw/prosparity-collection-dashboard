
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { useMemo } from "react";

interface MobileStatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  statusPaid: number;
}

const MobileStatusCards = ({ applications }: MobileStatusCardsProps) => {
  // Calculate counts from the applications data passed as props
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      
      // Count status - only Paid for mobile simplified view
      switch (app.field_status) {
        case 'Paid':
          acc.statusPaid++;
          break;
        // All other statuses are not counted in mobile simplified view
      }
      
      return acc;
    }, {
      total: 0,
      statusPaid: 0
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
      title: "Paid",
      value: statusCounts.statusPaid,
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
