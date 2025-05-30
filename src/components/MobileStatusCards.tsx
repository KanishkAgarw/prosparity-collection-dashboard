
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MobileStatusCardsProps {
  applications: any[];
}

const MobileStatusCards = ({ applications }: MobileStatusCardsProps) => {
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
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Fully Paid",
      value: data.fullyPaid,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Partially Paid",
      value: data.partiallyPaid,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Unpaid",
      value: data.unpaid,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className={`text-center ${card.bgColor} border-l-4 border-l-current`}>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className={`text-xl sm:text-2xl font-bold ${card.color}`}>
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">{card.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileStatusCards;
