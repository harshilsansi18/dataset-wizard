
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  getValidationReports, 
  downloadReportAsCSV, 
  downloadReportAsPDF,
  ValidationReport,
  deleteValidationReport
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, FileText, FileDown, FileText as FileDocument, ChartBar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import ValidationSummaryCard from "@/components/reports/ValidationSummaryCard";
import ReportsList from "@/components/reports/ReportsList";
import ReportDetails from "@/components/reports/ReportDetails";
import ReportTemplates from "@/components/reports/ReportTemplates";

const Reports = () => {
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("reports");
  
  // Fetch all validation reports
  const { 
    data: reports = [], 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: ['validationReports'],
    queryFn: async () => {
      console.log("Fetching validation reports");
      const reports = await getValidationReports();
      console.log(`Found ${reports.length} reports`);
      return reports;
    }
  });

  // Get selected report
  const selectedReport = selectedReportId 
    ? reports.find(report => report.id === selectedReportId)
    : null;

  // Handle download as CSV
  const handleDownloadCSV = (report: ValidationReport) => {
    try {
      downloadReportAsCSV(report);
      toast({
        title: "Report Downloaded",
        description: "CSV report has been downloaded successfully."
      });
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the report as CSV.",
        variant: "destructive"
      });
    }
  };

  // Handle download as PDF
  const handleDownloadPDF = async (report: ValidationReport) => {
    try {
      await downloadReportAsPDF(report);
      toast({
        title: "Report Downloaded",
        description: "PDF report has been downloaded successfully."
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the report as PDF.",
        variant: "destructive"
      });
    }
  };
  
  // Handle report deletion
  const handleDeleteReport = async (reportId: string) => {
    try {
      const success = await deleteValidationReport(reportId);
      if (success) {
        if (selectedReportId === reportId) {
          setSelectedReportId(null);
        }
        refetch();
        toast({
          title: "Report Deleted",
          description: "The validation report has been deleted successfully."
        });
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the report.",
        variant: "destructive"
      });
    }
  };
  
  // Effect to handle case where selected report is deleted
  useEffect(() => {
    if (selectedReportId && !reports.some(r => r.id === selectedReportId)) {
      setSelectedReportId(null);
    }
  }, [reports, selectedReportId]);
  
  // Check for highlighted report from validation page
  useEffect(() => {
    const highlightReportId = sessionStorage.getItem('highlightReportId');
    if (highlightReportId) {
      setSelectedReportId(highlightReportId);
      sessionStorage.removeItem('highlightReportId');
    }
  }, [reports]);

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validation Reports</h1>
          <p className="text-muted-foreground">
            View validation reports, create templates, and export results
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Validations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports list sidebar */}
            <div className="space-y-4">
              <ValidationSummaryCard reports={reports} />
              
              <Card className={isLoading ? "opacity-70 pointer-events-none" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Recent Reports</CardTitle>
                  <CardDescription>
                    Select a report to view details
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <ReportsList 
                    reports={reports} 
                    isLoading={isLoading}
                    selectedReportId={selectedReportId}
                    onSelectReport={(id) => setSelectedReportId(id)}
                    onRefresh={refetch}
                    onDelete={handleDeleteReport}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Report details */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <ReportDetails 
                  report={selectedReport} 
                  onDownloadCSV={() => handleDownloadCSV(selectedReport)}
                  onDownloadPDF={() => handleDownloadPDF(selectedReport)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Report Selected</CardTitle>
                    <CardDescription>
                      Select a report from the list to view its details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 opacity-50 mb-2" />
                      <p>Select a validation report to view results</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <ReportTemplates onRefresh={() => {}} />
        </TabsContent>
        
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Validations</CardTitle>
              <CardDescription>
                Set up automatic scheduled validations for datasets
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="mb-6">No scheduled validations configured</p>
              <Button>Schedule New Validation</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
