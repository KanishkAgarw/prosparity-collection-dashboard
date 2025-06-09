
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application } from "@/types/application";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [totalCounts, setTotalCounts] = useState<StatusCounts>({
    total: 0,
    fieldPaid: 0,
    fieldUnpaid: 0,
    fieldPartiallyPaid: 0,
    lmsPaid: 0,
    lmsUnpaid: 0,
    lmsPartiallyPaid: 0
  });

  useEffect(() => {
    const fetchTotalCounts = async () => {
      if (!user) return;

      try {
        // Get total count
        const { count: totalCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true });

        // Get LMS status counts
        const { data: lmsStatusData } = await supabase
          .from('applications')
          .select('lms_status');

        // Get field status counts
        const { data: fieldStatusData } = await supabase
          .from('field_status')
          .select('status');

        if (lmsStatusData && fieldStatusData) {
          const lmsCounts = lmsStatusData.reduce((acc, app) => {
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
          }, { lmsPaid: 0, lmsUnpaid: 0, lmsPartiallyPaid: 0 });

          const fieldCounts = fieldStatusData.reduce((acc, status) => {
            switch (status.status) {
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
            return acc;
          }, { fieldPaid: 0, fieldUnpaid: 0, fieldPartiallyPaid: 0 });

          setTotalCounts({
            total: totalCount || 0,
            ...lmsCounts,
            ...fieldCounts
          });
        }
      } catch (error) {
        console.error('Error fetching total counts:', error);
      }
    };

    fetchTotalCounts();
  }, [user, applications.length]);

  const cards = [
    {
      title: "Total",
      value: totalCounts.total,
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "Field Paid",
      value: totalCounts.fieldPaid,
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Field Unpaid",
      value: totalCounts.fieldUnpaid,
      className: "bg-red-50 border-red-200"
    },
    {
      title: "LMS Paid",
      value: totalCounts.lmsPaid,
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
