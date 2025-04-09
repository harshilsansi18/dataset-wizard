import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Eye,
  Table,
  Hash
} from "lucide-react";
import { 
  getAllValidationResults, 
  getDatasets, 
  getImportedDatasets, 
  DatasetType, 
  ValidationResult 
} from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  const [datasetFilter, setDatasetFilter] = useState("");

  useEffect(() => {
    console.log("Reports page: Initial data load");
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Reports page: Fetching datasets and validation results");
      const [datasetsData, resultsData] = await Promise.all([
        getDatasets(),
        getAllValidationResults()
      ]);
      
      const importedDatasets = getImportedDatasets();
      const allDatasets = [...datasetsData];
      
      importedDatasets.forEach(dbDataset => {
        if (!allDatasets.some(ds => ds.id === dbDataset.id)) {
          allDatasets.push(dbDataset);
        }
      });
      
      console.log(`Reports page: Loaded ${allDatasets.length} datasets and results for ${Object.keys(resultsData).length} datasets`);
      setDatasets(allDatasets);
      setValidationResults(resultsData);
      
      if (Object.keys(resultsData).length > 0 && !selectedDataset) {
        setSelectedDataset(Object.keys(resultsData)[0]);
        console.log("Auto-selected dataset:", Object.keys(resultsData)[0]);
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

  const filteredDatasets = datasets.filter(dataset => {
    return datasetFilter === "" || 
      dataset.name.toLowerCase().includes(datasetFilter.toLowerCase());
  });

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);
  const validationDate = selectedDataset && validationResults[selectedDataset] && 
    validationResults[selectedDataset].length > 0 
      ? new Date(validationResults[selectedDataset][0].timestamp) 
      : null;

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
      console.log("Exporting validation report for dataset:", selectedDatasetInfo?.name);
      const datasetName = selectedDatasetInfo?.name || "report";
      const date = new Date().toISOString().split('T')[0];
      const reportTitle = `Validation Report: ${datasetName} (${date})`;
      
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
        description: "The validation report has been downloaded as CSV",
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

  const extractErrorDetails = (result: ValidationResult) => {
    let errorDetails = {
      columns: [] as string[],
      rows: [] as number[],
      description: result.details,
      hasStructuredInfo: false
    };

    if (!result || result.status === 'Pass') {
      return errorDetails;
    }

    try {
      const columnMatch = result.details.match(/columns?: ([^\.]+)/i);
      if (columnMatch && columnMatch[1]) {
        errorDetails.columns = columnMatch[1].split(/,\s*/).map(col => col.trim());
        errorDetails.hasStructuredInfo = true;
      }

      const rowMatches = result.details.match(/rows?: (\d+)|row (\d+)|rows? (\d+(-\d+)?(,\s*\d+(-\d+)?)*)/gi);
      if (rowMatches) {
        const rowNumbers: number[] = [];
        rowMatches.forEach(match => {
          const numbers = match.match(/\d+/g);
          if (numbers) {
            numbers.forEach(num => rowNumbers.push(parseInt(num, 10)));
          }
        });
        errorDetails.rows = [...new Set(rowNumbers)];
        errorDetails.hasStructuredInfo = true;
      }

      if (result.check.includes("missing value")) {
        const nullCounts = result.details.match(/(\d+) missing values/);
        if (nullCounts && nullCounts[1]) {
          errorDetails.description = `Found ${nullCounts[1]} missing values${errorDetails.columns.length > 0 ? ` in columns: ${errorDetails.columns.join(', ')}` : ''}`;
          errorDetails.hasStructuredInfo = true;
        }
      } else if (result.check.includes("Data type")) {
        if (errorDetails.columns.length > 0) {
          errorDetails.description = `Inconsistent data types detected in columns: ${errorDetails.columns.join(', ')}`;
          errorDetails.hasStructuredInfo = true;
        }
      } else if (result.check.includes("AI-powered")) {
        const outlierMatch = result.details.match(/(\w+): (\d+) outliers/);
        if (outlierMatch) {
          errorDetails.columns = [outlierMatch[1]];
          errorDetails.description = `${outlierMatch[2]} outliers detected in column ${outlierMatch[1]}`;
          errorDetails.hasStructuredInfo = true;
        }
        
        const emailMatch = result.details.match(/(\w+): May contain emails/);
        if (emailMatch) {
          errorDetails.columns = [emailMatch[1]];
          errorDetails.description = `Inconsistent email format in column ${emailMatch[1]}`;
          errorDetails.hasStructuredInfo = true;
        }
      }
    } catch (error) {
      console.error("Error parsing validation details:", error);
    }

    return errorDetails;
  };

  const viewResultDetails = (result: ValidationResult) => {
    setSelectedResult(result);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setSelectedResult(null);
  };

  const formatRowNumbers = (rows: number[]) => {
    if (rows.length === 0) return "None";
    if (rows.length <= 5) return rows.join(", ");
    return `${rows.slice(0, 5).join(", ")} and ${rows.length - 5} more`;
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
          >
            Refresh Reports
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/validation')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Validation
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
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
                      value={datasetFilter}
                      onChange={(e) => setDatasetFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="mt-4 max-h-[500px] overflow-y-auto">
                    {filteredDatasets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Database className="h-10 w-10 text-slate-300 mb-2" />
                        <p className="text-sm text-slate-500">No datasets found</p>
                      </div>
                    ) : (
                      filteredDatasets.map(dataset => {
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
                      })
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                      variant="secondary" 
                      size="sm"
                      onClick={exportReport}
                      disabled={!filteredResults.length}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
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
                    {filteredResults.map((result, index) => {
                      const errorDetails = extractErrorDetails(result);
                      
                      return (
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
                                
                                {(errorDetails.columns.length > 0 || errorDetails.rows.length > 0) && (
                                  <div className="mt-2 rounded-md bg-background p-2 text-xs">
                                    {errorDetails.columns.length > 0 && (
                                      <div className="mb-1 flex items-center">
                                        <span className="mr-1 font-medium">Affected columns:</span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {errorDetails.columns.join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {errorDetails.rows.length > 0 && (
                                      <div className="flex items-center">
                                        <span className="mr-1 font-medium flex items-center">
                                          <Hash className="h-3 w-3 mr-1" /> Row numbers:
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                          {formatRowNumbers(errorDetails.rows)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
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
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
          
          {selectedResult && (
            <div className={`mt-4 rounded-lg border p-4 ${getResultClass(selectedResult.status)}`}>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Status</h4>
                  <p className="font-medium">
                    {selectedResult.status}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Details</h4>
                  <p>{selectedResult.details}</p>
                </div>
                
                {(() => {
                  const errorDetails = extractErrorDetails(selectedResult);
                  
                  return (
                    <>
                      {errorDetails.columns.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Affected Columns</h4>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {errorDetails.columns.map((column, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-300"
                              >
                                {column}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {errorDetails.rows.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center text-slate-500">
                            <Hash className="h-4 w-4 mr-1" /> Affected Row Numbers
                          </h4>
                          <div className="mt-1 max-h-24 overflow-y-auto rounded-md border p-2">
                            <div className="flex flex-wrap gap-1">
                              {errorDetails.rows.map((row, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline"
                                  className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  {row}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedResult.check.includes("Data type") && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Suggested Fix</h4>
                          <p className="text-sm">
                            Ensure all values in the affected columns have consistent data types. 
                            Consider transforming or cleaning the data before importing.
                          </p>
                        </div>
                      )}
                      
                      {selectedResult.check.includes("missing value") && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Suggested Fix</h4>
                          <p className="text-sm">
                            Add missing values in the affected columns or set appropriate default values.
                            Consider using data imputation techniques for missing values.
                          </p>
                        </div>
                      )}
                      
                      {selectedResult.check.includes("AI-powered") && selectedResult.status !== "Pass" && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">AI Analysis</h4>
                          <p className="text-sm">
                            The AI detected potential anomalies in your data that may affect analysis quality.
                            Review the highlighted columns and rows for unexpected patterns or outliers.
                          </p>
                        </div>
                      )}
                      
                      {selectedResult.check.includes("Duplicate") && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Suggested Fix</h4>
                          <p className="text-sm">
                            Remove duplicate rows or ensure they represent valid repeated measurements.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
                
                {selectedResult?.check.includes("Row count") && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Row Information</h4>
                    <p>
                      {selectedResult.details.includes("rows") 
                        ? `The dataset contains ${selectedResult.details.match(/\d+/)?.[0] || "unknown"} rows.`
                        : "Row count information is not available."}
                    </p>
                  </div>
                )}
                
                {selectedDatasetInfo?.content && selectedResult && selectedResult.status !== "Pass" && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">Sample Data</h4>
                    <div className="mt-2 max-h-64 overflow-auto rounded border">
                      <UITable>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16 bg-slate-100 dark:bg-slate-800">
                              <Hash className="h-4 w-4" /><span className="ml-1">Row</span>
                            </TableHead>
                            {extractErrorDetails(selectedResult).columns.slice(0, 3).map((col, i) => (
                              <TableHead key={i} className="font-medium text-red-600 dark:text-red-400">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {extractErrorDetails(selectedResult).rows.slice(0, 5).map((rowNum, i) => {
                            const rowData = selectedDatasetInfo.content && rowNum <= selectedDatasetInfo.content.length 
                              ? selectedDatasetInfo.content[rowNum - 1] 
                              : null;
                            
                            return rowData ? (
                              <TableRow key={i}>
                                <TableCell className="font-medium bg-slate-50 dark:bg-slate-900">
                                  {rowNum}
                                </TableCell>
                                {extractErrorDetails(selectedResult).columns.slice(0, 3).map((col, j) => (
                                  <TableCell key={j} className="text-red-600 dark:text-red-400">
                                    {rowData[col] !== undefined ? String(rowData[col]) : 'N/A'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ) : null;
                          })}
                        </TableBody>
                      </UITable>
                    </div>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button 
                    onClick={closeDetails} 
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
