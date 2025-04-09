
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  BarChart, 
  Loader2, 
  Search, 
  ArrowRight
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  getDatasets, 
  runValidation, 
  getAllValidationResults, 
  DatasetType, 
  ValidationResult 
} from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the status type to match what's expected in the UI
type ValidationStatus = "Validated" | "Issues Found" | "Not Validated";

const Validation: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [selectedDataset, setSelectedDataset] = useState<DatasetType | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch datasets
  const {
    data: datasetsData,
    isLoading: isLoadingDatasets,
    refetch: refetchDatasets
  } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      try {
        const data = await getDatasets();
        setDatasets(data);
        return data;
      } catch (error) {
        console.error("Error fetching datasets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch datasets",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Fetch validation results
  const {
    data: validationResultsData,
    isLoading: isLoadingValidationResults,
    refetch: refetchValidationResults
  } = useQuery({
    queryKey: ["validationResults"],
    queryFn: async () => {
      try {
        const data = await getAllValidationResults();
        setValidationResults(data);
        return data;
      } catch (error) {
        console.error("Error fetching validation results:", error);
        toast({
          title: "Error",
          description: "Failed to fetch validation results",
          variant: "destructive"
        });
        return {};
      }
    },
    enabled: datasets.length > 0
  });

  // Handle dataset selection
  useEffect(() => {
    if (selectedDatasetId && datasets.length > 0) {
      const dataset = datasets.find(ds => ds.id === selectedDatasetId);
      setSelectedDataset(dataset || null);
    } else {
      setSelectedDataset(null);
    }
  }, [selectedDatasetId, datasets]);

  // Run validation
  const handleRunValidation = async () => {
    if (!selectedDataset) return;

    setIsValidating(true);
    try {
      await runValidation(selectedDataset.id, 'advanced');
      await refetchValidationResults();
      toast({
        title: "Validation Completed",
        description: `Dataset "${selectedDataset.name}" has been validated`,
      });
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "An error occurred during validation",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Get validation result for a dataset
  const getValidationResult = (datasetId: string): ValidationResult[] | undefined => {
    return validationResults[datasetId];
  };

  // Get validation status for UI display
  const getValidationStatus = (datasetId: string): ValidationStatus => {
    const results = getValidationResult(datasetId);
    if (!results || results.length === 0) return "Not Validated";
    if (results.some(r => r.status === "Fail")) return "Issues Found";
    if (results.some(r => r.status === "Warning")) return "Issues Found";
    return "Validated";
  };

  // Get status badge
  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case "Validated":
        return <Badge className="flex items-center bg-green-500 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Validated</Badge>;
      case "Issues Found":
        return <Badge className="flex items-center bg-yellow-500 text-white"><AlertTriangle className="mr-1 h-3 w-3" />Issues Found</Badge>;
      case "Not Validated":
        return <Badge variant="outline" className="flex items-center"><XCircle className="mr-1 h-3 w-3" />Not Validated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Render stats for a dataset's validation
  const renderDatasetValidationStats = () => {
    if (!selectedDataset) {
      return (
        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium">No Dataset Selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select a dataset to view validation statistics</p>
        </div>
      );
    }

    const results = getValidationResult(selectedDataset.id);
    const status = getValidationStatus(selectedDataset.id);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">{selectedDataset.name}</h3>
            <p className="text-sm text-gray-500">
              {selectedDataset.rowCount} rows × {selectedDataset.columnCount} columns
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(status)}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRunValidation}
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {status === "Not Validated" ? "Validate" : "Re-validate"}
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {results && results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-500">Data Quality Score</div>
                  <div className="mt-1 flex items-center">
                    <div className="text-2xl font-bold">{calculateQualityScore(results).toFixed(1)}</div>
                    <div className="text-sm text-gray-500 ml-1">/10</div>
                  </div>
                  <Progress value={calculateQualityScore(results) * 10} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-500">Issues Found</div>
                  <div className="mt-1 text-2xl font-bold">
                    {countIssues(results)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-500">Last Validated</div>
                  <div className="mt-1 text-2xl font-bold">
                    {new Date(results[0].timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(results[0].timestamp).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="issues">Issues ({countIssues(results)})</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Validation Summary</h4>
                    {countIssues(results) === 0 ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>No Issues Found</AlertTitle>
                        <AlertDescription>
                          This dataset has passed all validation checks.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm">
                          {countIssues(results)} issues were found during validation:
                        </p>
                        <ul className="list-disc list-inside text-sm">
                          {results.filter(r => r.status !== "Pass").map((issue, idx) => (
                            <li key={idx}>{issue.check}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="issues" className="mt-4">
                {countIssues(results) === 0 ? (
                  <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                    <h3 className="mt-2 text-sm font-medium">No Issues Found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This dataset has passed all validation checks.
                    </p>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Check</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.map((validation, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{validation.check}</TableCell>
                                <TableCell>
                                  {validation.status === 'Pass' ? (
                                    <Badge className="bg-green-500 text-white">Pass</Badge>
                                  ) : validation.status === 'Warning' ? (
                                    <Badge className="bg-yellow-500 text-white">Warning</Badge>
                                  ) : (
                                    <Badge variant="destructive">Fail</Badge>
                                  )}
                                </TableCell>
                                <TableCell>{validation.details}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <h3 className="mt-2 text-sm font-medium">Not Validated</h3>
            <p className="mt-1 text-sm text-gray-500">
              Click "Validate" to run validation on this dataset.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Helper functions for calculating validation metrics
  const calculateQualityScore = (results: ValidationResult[]): number => {
    if (!results || results.length === 0) return 0;
    
    // Calculate score based on pass/warning/fail ratio
    const total = results.length;
    const passes = results.filter(r => r.status === "Pass").length;
    const warnings = results.filter(r => r.status === "Warning").length;
    
    // Each pass is worth 1 point, each warning 0.5 points
    const score = (passes + warnings * 0.5) / total * 10;
    return Math.max(0, Math.min(10, score)); // Constrain between 0-10
  };

  const countIssues = (results: ValidationResult[]): number => {
    if (!results) return 0;
    return results.filter(r => r.status !== "Pass").length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Validation</h1>
          <p className="text-gray-500">
            Validate your datasets to ensure data quality and integrity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Datasets</CardTitle>
            <CardDescription>
              Select a dataset to validate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDatasets ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-center p-4">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No Datasets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a dataset to begin validation
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{dataset.name}</span>
                          {getStatusBadge(getValidationStatus(dataset.id))}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="rounded-md bg-gray-50 p-3">
                  <h4 className="text-sm font-medium">Validation Status</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <span className="flex items-center justify-center w-4 h-4 bg-green-500 text-white rounded-full mr-2">
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                        <span>Validated</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {Object.values(validationResults).filter(results => 
                          results.every(r => r.status === "Pass")
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <span className="flex items-center justify-center w-4 h-4 bg-yellow-500 text-white rounded-full mr-2">
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                        <span>Issues Found</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {Object.values(validationResults).filter(results => 
                          results.some(r => r.status !== "Pass")
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <span className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded-full mr-2">
                          <XCircle className="h-3 w-3 text-gray-500" />
                        </span>
                        <span>Not Validated</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {datasets.length - Object.keys(validationResults).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              View detailed validation results and quality metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingValidationResults ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              renderDatasetValidationStats()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Validation;
