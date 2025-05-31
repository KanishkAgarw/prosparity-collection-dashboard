
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [totalCounts, setTotalCounts] = useState<StatusCounts>({
    total: 0,
    paid: 0,
    unpaid: 0,
    partiallyPaid: 0
  });

  useEffect(() => {
    const fetchTotalCounts = async () => {
      if (!user) return;

      try {
        // Get total count
        const { count: totalCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true });

        // Get counts by status
        const { data: statusData } = await supabase
          .from('applications')
          .select('status');

        if (statusData) {
          const counts = statusData.reduce((acc, app) => {
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
          }, { paid: 0, unpaid: 0, partiallyPaid: 0 });

          setTotalCounts({
            total: totalCount || 0,
            ...counts
          });
        }
      } catch (error) {
        console.error('Error fetching total counts:', error);
      }
    };

    fetchTotalCounts();
  }, [user, applications.length]);

  // Updated card order: Total → Paid → Unpaid → Partially Paid
  const cards = [
    {
      title: "Total",
      value: totalCounts.total,
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "Paid",
      value: totalCounts.paid,
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Unpaid",
      value: totalCounts.unpaid,
      className: "bg-red-50 border-red-200"
    },
    {
      title: "Partially Paid",
      value: totalCounts.partiallyPaid,
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
