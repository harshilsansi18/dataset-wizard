
import React, { useState } from 'react';
import { ValidationReport } from "@/services/api";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  FileDown, 
  FileText as FileDocument, 
  ChartBar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip 
} from "recharts";
import { toast } from "@/hooks/use-toast";

type ReportDetailsProps = {
  report: ValidationReport;
  onDownloadCSV: () => void;
  onDownloadPDF: () => void;
};

const ReportDetails = ({ report, onDownloadCSV, onDownloadPDF }: ReportDetailsProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Ensure report has a proper structure to avoid errors
  if (!report || !report.results || !report.summary) {
    console.error("Invalid report structure:", report);
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Error Loading Report
          </CardTitle>
          <CardDescription>
            This report appears to be invalid or incomplete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try selecting another report or generate a new validation.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Chart data
  const pieData = [
    { name: 'Pass', value: report.summary.pass, color: '#22c55e' },
    { name: 'Fail', value: report.summary.fail, color: '#ef4444' },
    { name: 'Warning', value: report.summary.warning, color: '#f59e0b' },
    { name: 'Info', value: report.summary.info, color: '#3b82f6' }
  ].filter(item => item.value > 0);
  
  // Group validation results by category
  const categoryCounts: Record<string, number> = {};
  report.results.forEach(result => {
    // Extract category from check name or use default
    const category = result.category || result.check.split(' ')[0] || 'Other';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count
  }));

  // Handle download notifications
  const handleDownloadWithToast = (type: string, callback: () => void) => {
    try {
      callback();
      toast({
        title: `${type} Downloaded Successfully`,
        description: `The report for "${report.datasetName}" has been downloaded.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${type} report. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  // Calculate overall status
  const getOverallStatus = () => {
    if (report.summary.fail > 0) return "fail";
    if (report.summary.warning > 0) return "warning";
    return "pass";
  };
  
  const overallStatus = getOverallStatus();
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{report.datasetName}</CardTitle>
              <Badge 
                variant="outline" 
                className={`
                  ${overallStatus === 'pass' ? 'bg-green-100 text-green-700 border-green-200' : 
                    overallStatus === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                    'bg-red-100 text-red-700 border-red-200'}
                `}
              >
                {overallStatus === 'pass' ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : overallStatus === 'warning' ? (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {overallStatus === 'pass' ? 'Passed' : 
                 overallStatus === 'warning' ? 'Warnings' : 'Failed'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(report.timestamp), 'MMMM d, yyyy h:mm a')}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadWithToast("CSV", onDownloadCSV)}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDownloadWithToast("PDF", onDownloadPDF)}
              className="flex items-center gap-1"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="p-0">
          <TabsList className="mb-0 w-full rounded-none border-b justify-start h-12">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Overview</TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Results</TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Charts</TabsTrigger>
          </TabsList>
          
          <div className="p-6">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className={`border-green-200 ${report.summary.pass === 0 ? 'opacity-70' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-1.5" />
                        <p className="text-lg font-bold text-green-600">{report.summary.pass}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Pass</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={`border-red-200 ${report.summary.fail === 0 ? 'opacity-70' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <XCircle className="h-5 w-5 text-red-600 mr-1.5" />
                        <p className="text-lg font-bold text-red-600">{report.summary.fail}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Fail</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={`border-amber-200 ${report.summary.warning === 0 ? 'opacity-70' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mr-1.5" />
                        <p className="text-lg font-bold text-amber-600">{report.summary.warning}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Warning</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className={`border-blue-200 ${report.summary.info === 0 ? 'opacity-70' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Info className="h-5 w-5 text-blue-600 mr-1.5" />
                        <p className="text-lg font-bold text-blue-600">{report.summary.info}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Info</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <ChartBar className="h-4 w-4" />
                    Result Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} checks`, '']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="results" className="mt-0">
              <Card className="border shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Check</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {report.results.map((result, index) => {
                          // Determine status style
                          let statusClass = "";
                          let StatusIcon = CheckCircle;
                          
                          if (result.status === "Pass") {
                            statusClass = "bg-green-100 text-green-700";
                            StatusIcon = CheckCircle;
                          }
                          else if (result.status === "Fail") {
                            statusClass = "bg-red-100 text-red-700";
                            StatusIcon = XCircle;
                          }
                          else if (result.status === "Warning") {
                            statusClass = "bg-amber-100 text-amber-700";
                            StatusIcon = AlertTriangle;
                          }
                          else if (result.status === "Info") {
                            statusClass = "bg-blue-100 text-blue-700";
                            StatusIcon = Info;
                          }
                          
                          return (
                            <tr key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-4 py-3 font-medium">{result.check}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusClass}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {result.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{result.details}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="charts" className="mt-0">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <ChartBar className="h-4 w-4" />
                    Validation Results by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          fill="#8884d8" 
                          name="Validations" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportDetails;
