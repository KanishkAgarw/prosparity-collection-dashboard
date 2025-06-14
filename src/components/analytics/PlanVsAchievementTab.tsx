
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Clock, Download, Play } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePlanVsAchievementData } from '@/hooks/exports/usePlanVsAchievementData';
import { usePlanVsAchievementReport } from '@/hooks/exports/usePlanVsAchievementReport';
import { formatPtpDate } from '@/utils/formatters';

interface PlanVsAchievementApplication {
  applicant_id: string;
  branch_name: string;
  rm_name: string;
  collection_rm: string;
  dealer_name: string;
  applicant_name: string;
  previous_ptp_date: string | null;
  previous_status: string | null;
  updated_ptp_date: string | null;
  updated_status: string | null;
  comment_trail: string;
}

const PlanVsAchievementTab = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('10:30');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [reportData, setReportData] = useState<PlanVsAchievementApplication[]>([]);
  const [hasRunReport, setHasRunReport] = useState(false);

  const { fetchPlanVsAchievementData, loading } = usePlanVsAchievementData();
  const { exportPlanVsAchievementReport } = usePlanVsAchievementReport();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
  };

  const getSelectedDateTime = (): Date | null => {
    if (!selectedDate) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  const handleRunReport = async () => {
    const dateTime = getSelectedDateTime();
    if (!dateTime) return;

    const data = await fetchPlanVsAchievementData(dateTime);
    setReportData(data);
    setHasRunReport(true);
  };

  const handleExportReport = async () => {
    const dateTime = getSelectedDateTime();
    if (!dateTime) return;

    await exportPlanVsAchievementReport(dateTime, 'plan-vs-achievement-report');
  };

  const canRunReport = selectedDate !== undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan vs Achievement Analysis</CardTitle>
          <CardDescription>
            Compare planned follow-ups (PTP dates set for a specific date/time) vs actual achievements including status and comment changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Planned Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Planned Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {getSelectedDateTime() && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Selected:</strong> {format(getSelectedDateTime()!, "PPP 'at' HH:mm")}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                This will show applications that had PTP dates set for this date/time and compare their status changes
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleRunReport} 
              disabled={!canRunReport || loading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {loading ? 'Running Report...' : 'Run Report'}
            </Button>

            {hasRunReport && reportData.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleExportReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasRunReport && (
        <Card>
          <CardHeader>
            <CardTitle>
              Report Results ({reportData.length} applications)
            </CardTitle>
            <CardDescription>
              Applications that had PTP set for {selectedDate && format(selectedDate, "PPP")} as of {format(getSelectedDateTime()!, "PPP 'at' HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications found matching the criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>RM</TableHead>
                      <TableHead>Collection RM</TableHead>
                      <TableHead>Dealer</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Previous PTP</TableHead>
                      <TableHead>Previous Status</TableHead>
                      <TableHead>Updated PTP</TableHead>
                      <TableHead>Updated Status</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((app) => (
                      <TableRow key={app.applicant_id}>
                        <TableCell className="font-medium">{app.branch_name}</TableCell>
                        <TableCell>{app.rm_name}</TableCell>
                        <TableCell>{app.collection_rm || '-'}</TableCell>
                        <TableCell>{app.dealer_name}</TableCell>
                        <TableCell>{app.applicant_name}</TableCell>
                        <TableCell>{formatPtpDate(app.previous_ptp_date)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            app.previous_status === 'Paid' ? "bg-green-100 text-green-800" :
                            app.previous_status === 'Unpaid' ? "bg-red-100 text-red-800" :
                            app.previous_status === 'Partially Paid' ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {app.previous_status}
                          </span>
                        </TableCell>
                        <TableCell>{formatPtpDate(app.updated_ptp_date)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            app.updated_status === 'Paid' ? "bg-green-100 text-green-800" :
                            app.updated_status === 'Unpaid' ? "bg-red-100 text-red-800" :
                            app.updated_status === 'Partially Paid' ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {app.updated_status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={app.comment_trail}>
                          {app.comment_trail}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlanVsAchievementTab;
