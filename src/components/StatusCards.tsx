
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCardsProps {
  applications: any[];
}

const StatusCards = ({ applications }: StatusCardsProps) => {
  const data = {
    totalEMIs: applications.length,
    fullyPaid: applications.filter(app => app.status === "Paid").length,
    partiallyPaid: applications.filter(app => app.status === "Partially Paid").length,
    unpaid: applications.filter(app => app.status === "Unpaid").length
  };

  const cards = [
    {
      title: "Total Applications",
      value: data.totalEMIs,
      color: "text-blue-600"
    },
    {
      title: "Fully Paid",
      value: data.fullyPaid,
      color: "text-green-600"
    },
    {
      title: "Partially Paid",
      value: data.partiallyPaid,
      color: "text-yellow-600"
    },
    {
      title: "Unpaid",
      value: data.unpaid,
      color: "text-red-600"
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600">{card.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatusCards;
