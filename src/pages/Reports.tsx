
import { useState, useEffect } from "react";
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
  Filter
} from "lucide-react";
import { getAllValidationResults, getDatasets, DatasetType, ValidationResult } from "@/services/api";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
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
                    <Button variant="outline" size="sm">
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
                            <Button variant="ghost" size="sm">
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
    </div>
  );
};

export default Reports;
