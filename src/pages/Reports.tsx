
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileText, 
  Download, 
  Calendar,
  Database,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { getAllValidationResults, getDatasets, DatasetType, ValidationResult } from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ValidationResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [datasetsData, resultsData] = await Promise.all([
        getDatasets(),
        getAllValidationResults()
      ]);
      
      setDatasets(datasetsData);
      setValidationResults(resultsData);
      
      // Auto-select the first dataset with validation results
      if (Object.keys(resultsData).length > 0 && !selectedDataset) {
        setSelectedDataset(Object.keys(resultsData)[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch validation reports.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getResultClass = (status: string) => {
    switch (status) {
      case "Pass":
        return "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20";
      case "Fail":
        return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20";
      case "Warning":
        return "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20";
      default:
        return "";
    }
  };

  const filteredResults = selectedDataset && validationResults[selectedDataset] 
    ? validationResults[selectedDataset].filter(result => {
        const matchesSearch = searchTerm === "" || 
          result.check.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.details.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === null || result.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);
  const validationDate = selectedDataset && validationResults[selectedDataset] && 
    validationResults[selectedDataset].length > 0 
      ? new Date(validationResults[selectedDataset][0].timestamp) 
      : null;

  // Export report functionality
  const exportReport = () => {
    if (!selectedDataset || !filteredResults.length) {
      toast({
        title: "Export Failed",
        description: "No results to export",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format the data for export
      const datasetName = selectedDatasetInfo?.name || "report";
      const date = new Date().toISOString().split('T')[0];
      const reportTitle = `Validation Report: ${datasetName} (${date})`;
      
      // Create CSV content
      let csvContent = "Check,Status,Details,Timestamp\n";
      
      filteredResults.forEach(result => {
        const formattedRow = [
          `"${result.check}"`,
          `"${result.status}"`,
          `"${result.details.replace(/"/g, '""')}"`,
          `"${new Date(result.timestamp).toLocaleString()}"`
        ].join(',');
        
        csvContent += formattedRow + '\n';
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${datasetName.replace(/\s+/g, '_')}_validation_report_${date}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report Exported",
        description: "The validation report has been downloaded",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export validation report",
        variant: "destructive"
      });
    }
  };

  // View result details
  const viewResultDetails = (result: ValidationResult) => {
    setSelectedResult(result);
    setIsDetailOpen(true);
  };

  // Close detail dialog
  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Validation Reports</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Detailed validation results and error reports
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/validation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Validation
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left sidebar - Dataset selection */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Database className="mr-2 h-5 w-5 text-blue-600" />
                Datasets
              </CardTitle>
              <CardDescription>
                Select a dataset to view reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search datasets..."
                      className="h-9 w-full rounded-md border border-input pl-8 pr-3 text-sm"
                    />
                  </div>
                  
                  <div className="mt-4 max-h-[500px] overflow-y-auto">
                    {datasets.map(dataset => {
                      const hasResults = validationResults[dataset.id] && validationResults[dataset.id].length > 0;
                      return (
                        <div
                          key={dataset.id}
                          className={`mb-2 cursor-pointer rounded-md border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            selectedDataset === dataset.id ? 'border-blue-500 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20' : ''
                          } ${!hasResults ? 'opacity-50' : ''}`}
                          onClick={() => hasResults && setSelectedDataset(dataset.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{dataset.name}</p>
                              <p className="text-xs text-slate-500">{dataset.type} · {dataset.size}</p>
                            </div>
                            <div className={`rounded-full px-2 py-0.5 text-xs ${
                              dataset.status === 'Validated' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : dataset.status === 'Issues Found'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {dataset.status}
                            </div>
                          </div>
                          {validationResults[dataset.id] && validationResults[dataset.id].length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              <Calendar className="mr-1 inline-block h-3 w-3" />
                              {new Date(validationResults[dataset.id][0].timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content - Report details */}
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  Validation Report
                </span>
                {selectedDatasetInfo && (
                  <span className="text-base font-normal text-slate-500">
                    {selectedDatasetInfo.name}
                    {validationDate && (
                      <span className="ml-2 flex items-center text-sm text-slate-400">
                        <Calendar className="mr-1 h-4 w-4" />
                        {validationDate.toLocaleDateString() + ' ' + validationDate.toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                )}
              </CardTitle>
              
              {selectedDataset && validationResults[selectedDataset] && (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search validations..."
                      className="h-9 rounded-md border border-input pl-8 pr-3 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant={statusFilter === null ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => setStatusFilter(null)}
                    >
                      All
                    </Button>
                    <Button 
                      variant={statusFilter === "Pass" ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => setStatusFilter("Pass")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                      Pass
                    </Button>
                    <Button 
                      variant={statusFilter === "Warning" ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => setStatusFilter("Warning")}
                    >
                      <AlertTriangle className="mr-1 h-4 w-4 text-amber-500" />
                      Warning
                    </Button>
                    <Button 
                      variant={statusFilter === "Fail" ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => setStatusFilter("Fail")}
                    >
                      <XCircle className="mr-1 h-4 w-4 text-red-500" />
                      Fail
                    </Button>
                  </div>
                  
                  <div className="ml-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportReport}
                      disabled={!filteredResults.length}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </div>
              )}
              <Separator />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                </div>
              ) : !selectedDataset ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <FileText className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium">No dataset selected</p>
                  <p className="text-sm text-slate-500">
                    Select a dataset to view validation reports
                  </p>
                </div>
              ) : !validationResults[selectedDataset] || validationResults[selectedDataset].length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <Shield className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium">No validation results available</p>
                  <p className="text-sm text-slate-500">
                    Run validation on this dataset to see results
                  </p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <Search className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium">No matching results</p>
                  <p className="text-sm text-slate-500">
                    Try changing your search or filter criteria
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {filteredResults.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`rounded-lg border p-4 ${getResultClass(result.status)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className="mr-3 mt-0.5">
                              {getResultIcon(result.status)}
                            </div>
                            <div>
                              <h3 className="font-medium">{result.check}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                {result.details}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {new Date(result.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => viewResultDetails(result)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail view dialog */}
      <Dialog open={isDetailOpen} onOpenChange={closeDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedResult && getResultIcon(selectedResult.status)}
              <span className="ml-2">{selectedResult?.check}</span>
            </DialogTitle>
            <DialogDescription>
              Validation executed on {selectedResult && new Date(selectedResult.timestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className={`mt-4 rounded-lg border p-4 ${selectedResult ? getResultClass(selectedResult.status) : ''}`}>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500">Status</h4>
                <p className="font-medium">
                  {selectedResult?.status}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500">Details</h4>
                <p>{selectedResult?.details}</p>
              </div>
              
              {selectedResult?.check === "Row Count Check" && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Row Information</h4>
                  <p>
                    {selectedResult.details.includes("rows") 
                      ? `The dataset contains ${selectedResult.details.match(/\d+/)?.[0] || "unknown"} rows.`
                      : "Row count information is not available."}
                  </p>
                </div>
              )}
              
              {selectedResult?.check === "Null Values Check" && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Null Values</h4>
                  <p>
                    {selectedResult.details.includes("null values") 
                      ? `Found ${selectedResult.details.match(/\d+/)?.[0] || "0"} null values in the first column.`
                      : "No null values were found in the first column."}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Null values can indicate missing data or data quality issues that may need to be addressed.
                  </p>
                </div>
              )}
              
              {selectedResult?.check === "Data Type Validation" && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Data Types</h4>
                  <p>
                    {selectedResult.details.includes("consistent numeric") 
                      ? "All values in this column are consistent and have a numeric data type."
                      : "This column contains mixed data types which may cause issues in data processing."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
