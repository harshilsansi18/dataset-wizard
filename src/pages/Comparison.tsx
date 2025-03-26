import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GitCompare, 
  ArrowLeftRight, 
  Filter, 
  Download, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Database,
  Search,
  ArrowUp,
  ArrowDown,
  Loader2,
  Calendar,
  History
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { 
  getDatasets, 
  compareDatasets, 
  getComparisonResultById,
  getComparisonHistory,
  DatasetType, 
  ComparisonResultType 
} from "@/services/api";

const Comparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [sourceDataset, setSourceDataset] = useState<string | null>(null);
  const [targetDataset, setTargetDataset] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResultType | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonHistory, setComparisonHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchDatasets();
    fetchComparisonHistory();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch datasets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonHistory = async () => {
    try {
      const history = await getComparisonHistory();
      setComparisonHistory(history);
    } catch (error) {
      console.error("Error fetching comparison history:", error);
    }
  };

  const loadComparisonFromHistory = async (comparisonId: string) => {
    try {
      const result = await getComparisonResultById(comparisonId);
      if (result) {
        setComparisonResults(result);
        // Find the history entry to set source and target dataset IDs
        const historyEntry = comparisonHistory.find(h => h.id === comparisonId);
        if (historyEntry) {
          setSourceDataset(historyEntry.sourceId);
          setTargetDataset(historyEntry.targetId);
        }
        toast({
          title: "Comparison Loaded",
          description: "Successfully loaded comparison from history.",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not find the saved comparison results.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error loading comparison:", error);
      toast({
        title: "Error",
        description: "Failed to load comparison results.",
        variant: "destructive"
      });
    }
  };

  const handleCompare = async () => {
    if (!sourceDataset || !targetDataset) {
      toast({
        title: "Selection required",
        description: "Please select both source and target datasets",
        variant: "destructive"
      });
      return;
    }

    if (sourceDataset === targetDataset) {
      toast({
        title: "Invalid selection",
        description: "Source and target datasets must be different",
        variant: "destructive"
      });
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);

    try {
      const options = {
        ignoreCase: document.getElementById('ignore-case') instanceof HTMLInputElement && 
          (document.getElementById('ignore-case') as HTMLInputElement).checked,
        ignoreWhitespace: document.getElementById('ignore-whitespace') instanceof HTMLInputElement && 
          (document.getElementById('ignore-whitespace') as HTMLInputElement).checked,
        primaryKeyOnly: document.getElementById('primary-key-only') instanceof HTMLInputElement && 
          (document.getElementById('primary-key-only') as HTMLInputElement).checked,
      };

      const results = await compareDatasets(sourceDataset, targetDataset, options);
      setComparisonResults(results);
      
      // Refresh comparison history
      fetchComparisonHistory();
      
      toast({
        title: "Comparison complete",
        description: `Found ${results.summary.rowsDifferent} rows with differences and ${results.summary.rowsMissingSource + results.summary.rowsMissingTarget} missing rows.`,
      });
    } catch (error) {
      console.error("Comparison error:", error);
      toast({
        title: "Comparison Failed",
        description: error instanceof Error ? error.message : "There was an error comparing the datasets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsComparing(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortData = (data: any[], field: string) => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      if (a[field] < b[field]) return sortDirection === "asc" ? -1 : 1;
      if (a[field] > b[field]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? 
      <ArrowUp className="h-3 w-3" /> : 
      <ArrowDown className="h-3 w-3" />;
  };

  const comparisonDate = comparisonResults ? new Date() : null;

  const exportComparisonReport = () => {
    if (!comparisonResults) return;
    
    try {
      const sourceDatasetName = datasets.find(d => d.id === sourceDataset)?.name || "source";
      const targetDatasetName = datasets.find(d => d.id === targetDataset)?.name || "target";
      
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `comparison_${sourceDatasetName}_vs_${targetDatasetName}_${timestamp}.csv`;
      
      let csvContent = "";
      
      if (activeTab === "summary") {
        csvContent = "Metric,Value\n";
        Object.entries(comparisonResults.summary).forEach(([key, value]) => {
          csvContent += `"${key}","${value}"\n`;
        });
      } 
      else if (activeTab === "columns") {
        csvContent = "Column Name,Data Type,Match Status,Differences\n";
        comparisonResults.columns.forEach(col => {
          csvContent += `"${col.name}","${col.type}","${col.matches ? 'Matches' : 'Different'}",${col.differences}\n`;
        });
      }
      else if (activeTab === "differences") {
        csvContent = "Row Key,Column,Source Value,Target Value\n";
        comparisonResults.differences.forEach(diff => {
          csvContent += `"${diff.key}","${diff.column}","${diff.sourceValue}","${diff.targetValue}"\n`;
        });
      }
      else if (activeTab === "missing") {
        csvContent = "Row Key,Location,Data\n";
        comparisonResults.missing.forEach(row => {
          csvContent += `"${row.key}","${row.location}","${JSON.stringify(row.columns).replace(/"/g, '""')}"\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: `Comparison report has been downloaded as ${fileName}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the comparison results.",
        variant: "destructive"
      });
    }
  };

  const toggleHistoryView = () => {
    setShowHistory(!showHistory);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dataset Comparison</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Compare datasets to identify differences and inconsistencies
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GitCompare className="mr-2 h-5 w-5 text-blue-600" />
                Comparison Configuration
              </CardTitle>
              <CardDescription>
                Select datasets and comparison parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source-dataset">Source Dataset</Label>
                  <select
                    id="source-dataset"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={sourceDataset || ""}
                    onChange={(e) => setSourceDataset(e.target.value)}
                  >
                    <option value="">Select source dataset...</option>
                    {loading ? (
                      <option value="" disabled>Loading datasets...</option>
                    ) : (
                      datasets.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.type})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowLeftRight className="text-slate-400" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-dataset">Target Dataset</Label>
                  <select
                    id="target-dataset"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={targetDataset || ""}
                    onChange={(e) => setTargetDataset(e.target.value)}
                  >
                    <option value="">Select target dataset...</option>
                    {loading ? (
                      <option value="" disabled>Loading datasets...</option>
                    ) : (
                      datasets.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.type})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Comparison Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="ignore-case" 
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <Label htmlFor="ignore-case" className="cursor-pointer text-sm">
                        Ignore case for string comparison
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="ignore-whitespace" 
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <Label htmlFor="ignore-whitespace" className="cursor-pointer text-sm">
                        Ignore leading/trailing whitespace
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="primary-key-only" 
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="primary-key-only" className="cursor-pointer text-sm">
                        Compare primary key only
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleCompare}
                  disabled={isComparing || !sourceDataset || !targetDataset}
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Run Comparison
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <History className="mr-2 h-5 w-5 text-blue-600" />
                  Comparison History
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleHistoryView}
                >
                  {showHistory ? "Hide" : "Show"}
                </Button>
              </CardTitle>
              <CardDescription>
                View and load previous comparisons
              </CardDescription>
            </CardHeader>
            
            {showHistory && (
              <CardContent>
                {comparisonHistory.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    No comparison history yet
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {comparisonHistory.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-3 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          onClick={() => loadComparisonFromHistory(item.id)}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium">{item.sourceName} vs {item.targetName}</div>
                            <div className="text-xs text-slate-500">{formatDate(item.timestamp)}</div>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {item.summary.rowsDifferent} differences, {item.summary.rowsMissingSource + item.summary.rowsMissingTarget} missing rows
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  Comparison Results
                </span>
                <div className="flex items-center">
                  {sourceDataset && targetDataset && (
                    <span className="text-sm font-normal text-slate-500">
                      {datasets.find(d => d.id === sourceDataset)?.name} vs {datasets.find(d => d.id === targetDataset)?.name}
                    </span>
                  )}
                  {comparisonDate && (
                    <span className="ml-4 flex items-center text-sm text-slate-400">
                      <Calendar className="mr-1 h-4 w-4" />
                      {comparisonDate.toLocaleDateString() + ' ' + comparisonDate.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 px-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="columns">Columns</TabsTrigger>
                <TabsTrigger value="differences">Differences</TabsTrigger>
                <TabsTrigger value="missing">Missing Rows</TabsTrigger>
              </TabsList>
                  
              <CardContent>
                {isComparing ? (
                  <div className="flex h-64 flex-col items-center justify-center">
                    <GitCompare className="mb-4 h-12 w-12 animate-pulse text-blue-500" />
                    <p className="text-lg font-medium">Comparing datasets...</p>
                    <p className="text-sm text-slate-500">This may take a few moments</p>
                  </div>
                ) : !comparisonResults ? (
                  <div className="flex h-64 flex-col items-center justify-center">
                    <GitCompare className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium">No comparison results yet</p>
                    <p className="text-sm text-slate-500">
                      Select source and target datasets to compare
                    </p>
                  </div>
                ) : (
                  <>
                    <TabsContent value="summary">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="mb-2 text-sm font-medium text-slate-500">Rows Analyzed</h3>
                            <p className="text-2xl font-bold">{comparisonResults.summary.rowsAnalyzed}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="mb-2 text-sm font-medium text-slate-500">Execution Time</h3>
                            <p className="text-2xl font-bold">{comparisonResults.summary.executionTime}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                          <h3 className="mb-4 text-sm font-medium text-slate-500">Row Comparison Results</h3>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex flex-col items-center justify-center rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                              <Check className="mb-2 h-8 w-8 text-green-500" />
                              <p className="text-2xl font-bold">{comparisonResults.summary.rowsMatched}</p>
                              <p className="text-sm text-slate-500">Rows Matched</p>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20">
                              <ArrowLeftRight className="mb-2 h-8 w-8 text-amber-500" />
                              <p className="text-2xl font-bold">{comparisonResults.summary.rowsDifferent}</p>
                              <p className="text-sm text-slate-500">Rows Different</p>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                              <X className="mb-2 h-8 w-8 text-red-500" />
                              <p className="text-2xl font-bold">{comparisonResults.summary.rowsMissingSource + comparisonResults.summary.rowsMissingTarget}</p>
                              <p className="text-sm text-slate-500">Rows Missing</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-7
