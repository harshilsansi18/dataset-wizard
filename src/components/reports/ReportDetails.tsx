
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
import { FileText, Download, FilePdf, FileExcel, ChartBar } from "lucide-react";
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

type ReportDetailsProps = {
  report: ValidationReport;
  onDownloadCSV: () => void;
  onDownloadPDF: () => void;
};

const ReportDetails = ({ report, onDownloadCSV, onDownloadPDF }: ReportDetailsProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
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
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{report.datasetName}</CardTitle>
            <CardDescription>
              Generated on {format(new Date(report.timestamp), 'MMMM d, yyyy h:mm a')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDownloadCSV}>
              <FileExcel className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadPDF}>
              <FilePdf className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{report.summary.pass}</p>
                    <p className="text-sm text-muted-foreground">Pass</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{report.summary.fail}</p>
                    <p className="text-sm text-muted-foreground">Fail</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{report.summary.warning}</p>
                    <p className="text-sm text-muted-foreground">Warning</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{report.summary.info}</p>
                    <p className="text-sm text-muted-foreground">Info</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Result Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Check</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.results.map((result, index) => {
                    // Determine status style
                    let statusClass = "";
                    if (result.status === "Pass") statusClass = "bg-green-100 text-green-700";
                    else if (result.status === "Fail") statusClass = "bg-red-100 text-red-700";
                    else if (result.status === "Warning") statusClass = "bg-amber-100 text-amber-700";
                    else if (result.status === "Info") statusClass = "bg-blue-100 text-blue-700";
                    
                    return (
                      <tr key={result.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-medium">{result.check}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
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
          </TabsContent>
          
          <TabsContent value="charts">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Validation Results by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" name="Validations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportDetails;
