
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { useMemo } from "react";

interface StatusCardsProps {
  applications: Application[];
}

interface StatusCounts {
  total: number;
  paid: number;
  unpaid: number;
  partiallyPaid: number;
}

const StatusCards = ({ applications }: StatusCardsProps) => {
  // Calculate counts from the filtered applications passed as props
  const statusCounts = useMemo(() => {
    const counts = applications.reduce((acc, app) => {
      acc.total++;
      switch (app.status) {
        case 'Paid':
          acc.paid++;
          break;
        case 'Unpaid':
          acc.unpaid++;
          break;
        case 'Partially Paid':
          acc.partiallyPaid++;
          break;
      }
      return acc;
    }, { total: 0, paid: 0, unpaid: 0, partiallyPaid: 0 });

    return counts;
  }, [applications]);

  // Updated card order: Total → Paid → Unpaid → Partially Paid
  const cards = [
    {
      title: "Total",
      value: statusCounts.total,
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "Paid",
      value: statusCounts.paid,
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Unpaid",
      value: statusCounts.unpaid,
      className: "bg-red-50 border-red-200"
    },
    {
      title: "Partially Paid",
      value: statusCounts.partiallyPaid,
      className: "bg-yellow-50 border-yellow-200"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
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
