import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const TemplateDownloadSection = () => {
  const downloadTemplate = () => {
    const applicationTemplateData = [
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Branch Name': 'Mumbai Branch',
        'RM Name': 'RM Name',
        'Dealer Name': 'Dealer Name',
        'Applicant Name': 'John Doe',
        'Applicant Mobile Number': '9876543210',
        'Applicant Current Address': 'Sample Address',
        'House Ownership': 'Own',
        'Co-Applicant Name': 'Co-Applicant Name',
        'Coapplicant Mobile Number': '9876543211',
        'Coapplicant Current Address': 'Co-Applicant Address',
        'Guarantor Name': 'Guarantor Name',
        'Guarantor Mobile Number': '9876543212',
        'Guarantor Current Address': 'Guarantor Address',
        'Reference Name': 'Reference Name',
        'Reference Mobile Number': '9876543213',
        'Reference Address': 'Reference Address',
        'FI Submission Location': 'Field Investigation Location',
        'Demand Date': '2024-01-15',
        'Disbursement Date': '2024-01-10',
        'Loan Amount': 500000,
        'Vehicle Status': 'Risky',
        'Repayment': 'Monthly',
        'Principle Due': 45000,
        'Interest Due': 2500,
        'EMI': 5000,
        'Last Month Bounce': 0,
        'Lender Name': 'Lender Name',
        'Team Lead': 'Team Lead Name',
        'Collection RM': 'Collection RM Name',
        'Status': 'Unpaid'
      }
    ];

    const repaymentHistoryTemplateData = [
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Repayment Number': 1,
        'Delay in Days': 4
      },
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Repayment Number': 2,
        'Delay in Days': 0
      },
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Repayment Number': 3,
        'Delay in Days': 20
      }
    ];

    const workbook = XLSX.utils.book_new();
    
    // Add Applications sheet
    const applicationsWorksheet = XLSX.utils.json_to_sheet(applicationTemplateData);
    const applicationColWidths = [
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    applicationsWorksheet['!cols'] = applicationColWidths;
    XLSX.utils.book_append_sheet(workbook, applicationsWorksheet, 'Applications');

    // Add Repayment History sheet
    const repaymentWorksheet = XLSX.utils.json_to_sheet(repaymentHistoryTemplateData);
    const repaymentColWidths = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }
    ];
    repaymentWorksheet['!cols'] = repaymentColWidths;
    XLSX.utils.book_append_sheet(workbook, repaymentWorksheet, 'Repayment History');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `applications-bulk-upload-template-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast.success('Template downloaded successfully!');
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">Step 1: Download Template</h4>
          <p className="text-sm text-blue-700 mt-1">
            Download the Excel template with Applications sheet (31 columns + Status) and Repayment History sheet (3 columns)
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadTemplate}
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
    </div>
  );
};

export default TemplateDownloadSection;
