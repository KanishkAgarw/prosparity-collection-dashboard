
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Application } from '@/types/application';
import ApplicationDetails from '@/components/tables/ApplicationDetails';
import StatusBadge from '@/components/tables/StatusBadge';
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

interface PlanVsAchievementTableProps {
  loading: boolean;
  reportData: PlanVsAchievementApplication[];
  sortedReportData: PlanVsAchievementApplication[];
  applications: Application[];
  commentsByApp: Record<string, Array<{content: string; user_name: string}>>;
  selectedDate: Date | undefined;
  selectedApplication: Application | null;
  onExportReport: () => void;
  onApplicationSelect: (app: Application) => void;
  getChangeSummary: (item: PlanVsAchievementApplication) => string;
}

const CommentChangesDisplay = ({ comments }: { comments?: Array<{content: string; user_name: string}> }) => {
  if (!comments || comments.length === 0) {
    return <div className="text-xs text-gray-400 italic">No comment changes</div>;
  }

  return (
    <div className="space-y-1">
      {comments.map((comment, index) => (
        <div key={index} className="text-xs p-2 rounded bg-gray-50 border-l-2 border-blue-200">
          <div className="font-medium text-blue-700 mb-1">{comment.user_name}</div>
          <div className="text-gray-600 break-words">{comment.content}</div>
        </div>
      ))}
    </div>
  );
};

const PlanVsAchievementTable = ({
  loading,
  reportData,
  sortedReportData,
  applications,
  commentsByApp,
  selectedDate,
  selectedApplication,
  onExportReport,
  onApplicationSelect,
  getChangeSummary
}: PlanVsAchievementTableProps) => {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-600" />
              {loading ? 'Loading Analysis...' : `Analysis Results (${reportData.length} applications)`}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Plan vs achievement analysis for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
            </CardDescription>
          </div>
          {reportData.length > 0 && (
            <Button 
              onClick={onExportReport}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              size="lg"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-lg font-medium text-gray-600">Analyzing planned vs achievements...</p>
            </div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-xl font-medium text-gray-600">No Data Found</p>
                <p className="text-gray-500 mt-2">No applications found with PTP set for the selected date and time</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                  <TableHead className="font-bold text-gray-900 w-80 py-4">Application Details</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Previous PTP Date</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Previous Status</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Updated PTP Date</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Updated Status</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Change Summary</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4">Comment Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReportData.map((item, index) => {
                  const application = applications.find(app => app.applicant_id === item.applicant_id);
                  const changeSummary = getChangeSummary(item);
                  const comments = commentsByApp[item.applicant_id] || [];
                  return (
                    <TableRow 
                      key={item.applicant_id}
                      className={`
                        cursor-pointer transition-all duration-200 border-b border-gray-100
                        ${selectedApplication?.applicant_id === item.applicant_id 
                          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                          : 'hover:bg-gray-50'
                        }
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}
                      `}
                      onClick={() => application && onApplicationSelect(application)}
                    >
                      <TableCell className="py-4">
                        {application && <ApplicationDetails application={application} />}
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        <span className={`
                          font-medium whitespace-nowrap px-3 py-1 rounded-full text-sm
                          ${item.previous_ptp_date 
                            ? 'text-blue-700 bg-blue-100' 
                            : 'text-gray-500 bg-gray-100'
                          }
                        `}>
                          {item.previous_ptp_date ? formatPtpDate(item.previous_ptp_date) : 'Not Set'}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        {item.previous_status ? (
                          <StatusBadge status={item.previous_status} />
                        ) : (
                          <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        <span className={`
                          font-medium whitespace-nowrap px-3 py-1 rounded-full text-sm
                          ${item.updated_ptp_date 
                            ? 'text-blue-700 bg-blue-100' 
                            : 'text-gray-500 bg-gray-100'
                          }
                        `}>
                          {item.updated_ptp_date ? formatPtpDate(item.updated_ptp_date) : 'Not Set'}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        {item.updated_status ? (
                          <StatusBadge status={item.updated_status} />
                        ) : (
                          <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center py-4">
                        <span className={`
                          px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                          ${changeSummary === 'No Change' 
                            ? 'bg-gray-100 text-gray-600'
                            : changeSummary.includes('Status Changed') && changeSummary.includes('PTP')
                            ? 'bg-purple-100 text-purple-700'
                            : changeSummary.includes('Status Changed')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                          }
                        `}>
                          {changeSummary}
                        </span>
                      </TableCell>
                      
                      <TableCell className="max-w-[300px] py-4">
                        <CommentChangesDisplay comments={comments} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanVsAchievementTable;
