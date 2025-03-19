
import { useState } from "react";
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
  ArrowDown
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const Comparison = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [sourceDataset, setSourceDataset] = useState<string | null>(null);
  const [targetDataset, setTargetDataset] = useState<string | null>(null);
  const [comparisonResults, setComparisonResults] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Mock datasets
  const datasets = [
    { id: "1", name: "Sales_Q2_2023", type: "CSV" },
    { id: "2", name: "Sales_Q1_2023", type: "CSV" },
    { id: "3", name: "Customer_Data_July", type: "Excel" },
    { id: "4", name: "Customer_Data_June", type: "Excel" },
    { id: "5", name: "Inventory_Current", type: "PostgreSQL" },
    { id: "6", name: "Inventory_Previous", type: "PostgreSQL" },
  ];

  const handleCompare = () => {
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

    // Simulate comparison process
    setTimeout(() => {
      const mockSummary = {
        rowsAnalyzed: 1254,
        rowsMatched: 1201,
        rowsDifferent: 35,
        rowsMissingSource: 12,
        rowsMissingTarget: 6,
        columnsCompared: 8,
        columnsDifferent: 2,
        executionTime: "3.2 seconds"
      };

      const mockColumns = [
        { name: "id", type: "integer", matches: true, differences: 0 },
        { name: "name", type: "string", matches: true, differences: 0 },
        { name: "email", type: "string", matches: false, differences: 15 },
        { name: "phone", type: "string", matches: true, differences: 0 },
        { name: "address", type: "string", matches: false, differences: 20 },
        { name: "created_at", type: "timestamp", matches: true, differences: 0 },
        { name: "updated_at", type: "timestamp", matches: true, differences: 0 },
        { name: "status", type: "string", matches: true, differences: 0 },
      ];

      const mockDifferences = [
        { 
          id: 1, 
          key: "1001", 
          column: "email", 
          sourceValue: "john.smith@example.com", 
          targetValue: "john.s@example.com" 
        },
        { 
          id: 2, 
          key: "1005", 
          column: "email", 
          sourceValue: "sarah.johnson@example.com", 
          targetValue: "sarah.johnson@mail.com" 
        },
        { 
          id: 3, 
          key: "1012", 
          column: "address", 
          sourceValue: "123 Main St, Apt 4B", 
          targetValue: "123 Main Street, Apartment 4B" 
        },
        { 
          id: 4, 
          key: "1018", 
          column: "address", 
          sourceValue: "456 Oak Ave", 
          targetValue: "456 Oak Avenue" 
        },
        { 
          id: 5, 
          key: "1025", 
          column: "email", 
          sourceValue: "robert.williams@example.com", 
          targetValue: "rob.williams@example.com" 
        },
      ];

      const mockMissing = [
        { id: 1, key: "1030", location: "source", columns: { id: "1030", name: "Kevin Lee", email: "kevin.lee@example.com" } },
        { id: 2, key: "1042", location: "source", columns: { id: "1042", name: "Jennifer Adams", email: "jennifer.adams@example.com" } },
        { id: 3, key: "1056", location: "target", columns: { id: "1056", name: "Michael Chen", email: "michael.chen@example.com" } },
        { id: 4, key: "1063", location: "target", columns: { id: "1063", name: "Emily Taylor", email: "emily.taylor@example.com" } },
      ];

      setComparisonResults({
        summary: mockSummary,
        columns: mockColumns,
        differences: mockDifferences,
        missing: mockMissing
      });
      
      setIsComparing(false);
      toast({
        title: "Comparison complete",
        description: `Found ${mockSummary.rowsDifferent} rows with differences and ${mockSummary.rowsMissingSource + mockSummary.rowsMissingTarget} missing rows.`,
      });
    }, 3000);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dataset Comparison</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Compare datasets to identify differences and inconsistencies
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Configuration */}
        <div className="md:col-span-1">
          <Card>
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
                    {datasets.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.type})
                      </option>
                    ))}
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
                    {datasets.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.type})
                      </option>
                    ))}
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
                      <GitCompare className="mr-2 h-4 w-4 animate-pulse" />
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
        </div>

        {/* Right column - Results */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  Comparison Results
                </span>
                {sourceDataset && targetDataset && (
                  <span className="text-sm font-normal text-slate-500">
                    {datasets.find(d => d.id === sourceDataset)?.name} vs {datasets.find(d => d.id === targetDataset)?.name}
                  </span>
                )}
              </CardTitle>
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="columns">Columns</TabsTrigger>
                  <TabsTrigger value="differences">Differences</TabsTrigger>
                  <TabsTrigger value="missing">Missing Rows</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
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
                <TabsContent value={activeTab} className="mt-0">
                  {activeTab === "summary" && (
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
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                          <h3 className="mb-2 text-sm font-medium text-slate-500">Missing in Source</h3>
                          <div className="flex items-baseline justify-between">
                            <p className="text-2xl font-bold">{comparisonResults.summary.rowsMissingSource}</p>
                            <p className="text-sm text-slate-500">rows</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                          <h3 className="mb-2 text-sm font-medium text-slate-500">Missing in Target</h3>
                          <div className="flex items-baseline justify-between">
                            <p className="text-2xl font-bold">{comparisonResults.summary.rowsMissingTarget}</p>
                            <p className="text-sm text-slate-500">rows</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="mr-2">
                          <Filter className="mr-1 h-4 w-4" />
                          Filter
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-1 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "columns" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                        <p className="text-sm">
                          <span className="font-medium">Column Analysis:</span> {comparisonResults.summary.columnsCompared} columns compared, 
                          {comparisonResults.summary.columnsDifferent} columns with differences.
                        </p>
                      </div>
                      
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-4 gap-4 bg-slate-50 p-3 dark:bg-slate-800">
                          <div 
                            className="flex cursor-pointer items-center font-medium"
                            onClick={() => handleSort("name")}
                          >
                            Column Name {getSortIcon("name")}
                          </div>
                          <div 
                            className="flex cursor-pointer items-center font-medium"
                            onClick={() => handleSort("type")}
                          >
                            Data Type {getSortIcon("type")}
                          </div>
                          <div 
                            className="flex cursor-pointer items-center font-medium"
                            onClick={() => handleSort("matches")}
                          >
                            Match Status {getSortIcon("matches")}
                          </div>
                          <div 
                            className="flex cursor-pointer items-center font-medium"
                            onClick={() => handleSort("differences")}
                          >
                            Differences {getSortIcon("differences")}
                          </div>
                        </div>

                        <ScrollArea className="h-[300px]">
                          {sortData(comparisonResults.columns, sortField || "name").map((column, index) => (
                            <div 
                              key={column.name} 
                              className={`grid grid-cols-4 gap-4 p-3 ${
                                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"
                              }`}
                            >
                              <div>{column.name}</div>
                              <div>{column.type}</div>
                              <div className="flex items-center">
                                {column.matches ? (
                                  <span className="flex items-center text-green-600 dark:text-green-400">
                                    <Check className="mr-1 h-4 w-4" /> Matches
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-600 dark:text-red-400">
                                    <X className="mr-1 h-4 w-4" /> Different
                                  </span>
                                )}
                              </div>
                              <div>
                                {column.differences > 0 ? (
                                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    {column.differences} differences
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    No differences
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "differences" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {comparisonResults.differences.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center">
                          <Check className="mb-4 h-12 w-12 text-green-500" />
                          <p className="text-lg font-medium">No differences found</p>
                          <p className="text-sm text-slate-500">
                            All values in both datasets match
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                              Showing {comparisonResults.differences.length} differences
                            </p>
                            <div className="flex items-center">
                              <div className="relative mr-2">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search differences..."
                                  className="h-9 rounded-md border border-input pl-8 pr-3 text-sm"
                                />
                              </div>
                              <Button variant="outline" size="sm">
                                <Filter className="mr-1 h-4 w-4" />
                                Filter
                              </Button>
                            </div>
                          </div>
                          
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-3 dark:bg-slate-800">
                              <div className="font-medium">Row Key</div>
                              <div className="font-medium">Column</div>
                              <div className="font-medium">Source Value</div>
                              <div className="font-medium">Target Value</div>
                            </div>

                            <ScrollArea className="h-[300px]">
                              {comparisonResults.differences.map((diff, index) => (
                                <div 
                                  key={diff.id} 
                                  className={`grid grid-cols-4 gap-4 p-3 ${
                                    index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"
                                  }`}
                                >
                                  <div className="font-medium">{diff.key}</div>
                                  <div>{diff.column}</div>
                                  <div className="text-red-600 dark:text-red-400">{diff.sourceValue}</div>
                                  <div className="text-green-600 dark:text-green-400">{diff.targetValue}</div>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {activeTab === "missing" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {comparisonResults.missing.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center">
                          <Check className="mb-4 h-12 w-12 text-green-500" />
                          <p className="text-lg font-medium">No missing rows</p>
                          <p className="text-sm text-slate-500">
                            All rows are present in both datasets
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                              Found {comparisonResults.missing.length} missing rows
                            </p>
                            <div className="flex">
                              <Button variant="outline" size="sm" className="mr-2">
                                <Minus className="mr-1 h-4 w-4 text-red-500" />
                                Missing in Source: {comparisonResults.missing.filter(m => m.location === "source").length}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Plus className="mr-1 h-4 w-4 text-blue-500" />
                                Missing in Target: {comparisonResults.missing.filter(m => m.location === "target").length}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-3 dark:bg-slate-800">
                              <div className="font-medium">Row Key</div>
                              <div className="font-medium">Location</div>
                              <div className="col-span-2 font-medium">Row Data</div>
                            </div>

                            <ScrollArea className="h-[300px]">
                              {comparisonResults.missing.map((row, index) => (
                                <div 
                                  key={row.id} 
                                  className={`grid grid-cols-4 gap-4 p-3 ${
                                    index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"
                                  }`}
                                >
                                  <div className="font-medium">{row.key}</div>
                                  <div>
                                    {row.location === "source" ? (
                                      <span className="flex items-center text-red-600 dark:text-red-400">
                                        <Minus className="mr-1 h-4 w-4" /> Missing in Source
                                      </span>
                                    ) : (
                                      <span className="flex items-center text-blue-600 dark:text-blue-400">
                                        <Plus className="mr-1 h-4 w-4" /> Missing in Target
                                      </span>
                                    )}
                                  </div>
                                  <div className="col-span-2">
                                    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
                                      {JSON.stringify(row.columns)}
                                    </code>
                                  </div>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </TabsContent>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
