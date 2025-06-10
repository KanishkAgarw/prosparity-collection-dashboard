
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, PieChart } from "lucide-react";

interface KPICardsProps {
  kpis: {
    totalApplications: number;
    totalPrincipleDue: number;
    totalInterestDue: number;
    collectionRate: number;
    totalOutstanding: number;
  };
}

const KPICards = ({ kpis }: KPICardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">Total Applications</CardTitle>
          <PieChart className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{kpis.totalApplications.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">Active portfolio</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Collection Rate</CardTitle>
          <Target className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{kpis.collectionRate.toFixed(1)}%</div>
          <p className="text-xs text-green-600 mt-1">Payment success rate</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-800">Total Outstanding</CardTitle>
          <DollarSign className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">{formatCurrency(kpis.totalOutstanding)}</div>
          <p className="text-xs text-orange-600 mt-1">Principal + Interest due</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800">Avg. EMI</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">
            {formatCurrency(kpis.totalApplications > 0 ? kpis.totalOutstanding / kpis.totalApplications : 0)}
          </div>
          <p className="text-xs text-purple-600 mt-1">Per application</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;
