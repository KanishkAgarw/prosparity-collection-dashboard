
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCardsProps {
  data: {
    totalEMIs: number;
    unpaid: number;
    partiallyPaid: number;
  };
}

const StatusCards = ({ data }: StatusCardsProps) => {
  const cards = [
    {
      title: "Count of EMI",
      value: data.totalEMIs,
      color: "text-blue-600"
    },
    {
      title: "Unpaid",
      value: data.unpaid,
      color: "text-red-600"
    },
    {
      title: "Partially paid",
      value: data.partiallyPaid,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
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
