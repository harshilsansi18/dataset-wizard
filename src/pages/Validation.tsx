
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
  validateDataset,
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
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
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
        return [];
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
      await validateDataset(selectedDataset.id);
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
  const getValidationResult = (datasetId: string): ValidationResult | undefined => {
    return validationResults.find(result => result.dataset_id === datasetId);
  };

  // Get validation status for UI display
  const getValidationStatus = (datasetId: string): ValidationStatus => {
    const result = getValidationResult(datasetId);
    if (!result) return "Not Validated";
    if (result.issues.length === 0) return "Validated";
    return "Issues Found";
  };

  // Get status badge
  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case "Validated":
        return <Badge variant="success" className="flex items-center"><CheckCircle2 className="mr-1 h-3 w-3" />Validated</Badge>;
      case "Issues Found":
        return <Badge variant="warning" className="flex items-center"><AlertTriangle className="mr-1 h-3 w-3" />Issues Found</Badge>;
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

    const result = getValidationResult(selectedDataset.id);
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

        {result ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-500">Data Quality Score</div>
                  <div className="mt-1 flex items-center">
                    <div className="text-2xl font-bold">{result.quality_score.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 ml-1">/10</div>
                  </div>
                  <Progress value={result.quality_score * 10} className="mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-500">Issues Found</div>
                  <div className="mt-1 text-2xl font-bold">{result.issues.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-gray-500">Last Validated</div>
                  <div className="mt-1 text-2xl font-bold">
                    {new Date(result.validation_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(result.validation_date).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="issues">Issues ({result.issues.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Validation Summary</h4>
                    {result.issues.length === 0 ? (
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
                          {result.issues.length} issues were found during validation:
                        </p>
                        <ul className="list-disc list-inside text-sm">
                          {Array.from(new Set(result.issues.map(issue => issue.issue_type))).map(issueType => (
                            <li key={issueType}>{issueType}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="issues" className="mt-4">
                {result.issues.length === 0 ? (
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
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Column</TableHead>
                              <TableHead>Row</TableHead>
                              <TableHead>Severity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.issues.map((issue, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{issue.issue_type}</TableCell>
                                <TableCell>{issue.description}</TableCell>
                                <TableCell>{issue.column || 'N/A'}</TableCell>
                                <TableCell>{issue.row_number !== undefined ? issue.row_number : 'N/A'}</TableCell>
                                <TableCell>
                                  {issue.severity === 'high' ? (
                                    <Badge variant="destructive">High</Badge>
                                  ) : issue.severity === 'medium' ? (
                                    <Badge variant="warning">Medium</Badge>
                                  ) : (
                                    <Badge variant="default">Low</Badge>
                                  )}
                                </TableCell>
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
                        <Badge variant="success" className="mr-2">
                          <CheckCircle2 className="h-3 w-3" />
                        </Badge>
                        <span>Validated</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {validationResults.filter(r => r.issues.length === 0).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Badge variant="warning" className="mr-2">
                          <AlertTriangle className="h-3 w-3" />
                        </Badge>
                        <span>Issues Found</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {validationResults.filter(r => r.issues.length > 0).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Badge variant="outline" className="mr-2">
                          <XCircle className="h-3 w-3" />
                        </Badge>
                        <span>Not Validated</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {datasets.length - validationResults.length}
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
