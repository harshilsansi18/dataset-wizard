
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Terminal,
  Copy,
  Database,
  Loader2,
  FileText,
  Calendar
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { getDatasets, runValidation, DatasetType, ValidationResult } from "@/services/api";

const Validation = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [validationMethod, setValidationMethod] = useState("basic");
  const [customSQL, setCustomSQL] = useState("SELECT COUNT(*) FROM table WHERE column IS NULL");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch datasets when component mounts
    fetchDatasets();
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

  const handleRunValidation = async () => {
    if (!selectedDataset) {
      toast({
        title: "No dataset selected",
        description: "Please select a dataset to validate",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setValidationResults([]);

    try {
      // Run validation through our API service with the selected method
      const results = await runValidation(
        selectedDataset, 
        validationMethod, 
        validationMethod === 'custom' ? customSQL : undefined
      );
      setValidationResults(results);
      
      const passCount = results.filter(r => r.status === "Pass").length;
      const warningCount = results.filter(r => r.status === "Warning").length;
      const failCount = results.filter(r => r.status === "Fail").length;
      
      toast({
        title: "Validation complete",
        description: `Completed with ${passCount} passes, ${warningCount} warnings, and ${failCount} failures.`,
      });
      
      // Refresh datasets to get updated status
      fetchDatasets();
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "There was an error running the validation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
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

  // Generate example Soda Core YAML configuration based on selected dataset and validation method
  const validationSnippet = `
# Example Soda Core validation YAML
profile: postgres
datasets:
  ${selectedDataset ? datasets.find(d => d.id === selectedDataset)?.name || 'your_dataset' : 'your_dataset'}:
    checks:
      - row_count > 0
      - missing_count(customer_id) = 0${validationMethod === 'advanced' ? `
      - invalid_percent(email) < 5
      - duplicate_count(id) = 0
      - avg_length(description) > 10
      - schema:
          name: string
          age: integer
          email: string` : ''}${validationMethod === 'custom' ? `
      - sql:
          query: ${customSQL.replace(/\n/g, '\n          ')}
          metrics:
            - row_count
          tests:
            - row_count > 0` : ''}
`;

  // Find the validation timestamp for display
  const validationDate = validationResults.length > 0 
    ? new Date(validationResults[0].timestamp)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Validation</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Configure and run data quality validations on your datasets
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Configuration */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-blue-600" />
                Validation Configuration
              </CardTitle>
              <CardDescription>
                Set up parameters for your validation run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset-select">Select Dataset</Label>
                  <select
                    id="dataset-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedDataset || ""}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                  >
                    <option value="">Select a dataset...</option>
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
                  <Label>Validation Method</Label>
                  <RadioGroup 
                    value={validationMethod} 
                    onValueChange={setValidationMethod}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="basic" id="basic" />
                      <Label htmlFor="basic" className="cursor-pointer">
                        Basic Checks (Missing values, Types)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced" className="cursor-pointer">
                        Advanced Checks (Schema, Constraints)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="cursor-pointer">
                        Custom SQL Checks
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {validationMethod === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-sql">Custom SQL Check</Label>
                    <Textarea
                      id="custom-sql"
                      placeholder="SELECT COUNT(*) FROM table WHERE condition..."
                      value={customSQL}
                      onChange={(e) => setCustomSQL(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={handleRunValidation}
                  disabled={isRunning || !selectedDataset}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Validation...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Validation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Terminal className="mr-2 h-5 w-5 text-blue-600" />
                Soda Core Configuration
              </CardTitle>
              <CardDescription>
                Example YAML configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-md bg-slate-950 p-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2"
                  onClick={() => {
                    navigator.clipboard.writeText(validationSnippet.trim());
                    toast({
                      title: "Copied to clipboard",
                      description: "YAML configuration copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 text-slate-400 hover:text-slate-100" />
                </Button>
                <pre className="overflow-x-auto text-xs text-slate-100">
                  <code>{validationSnippet}</code>
                </pre>
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
                  Validation Results
                </span>
                <div className="flex items-center">
                  {selectedDataset && datasets.find(d => d.id === selectedDataset) && (
                    <span className="mr-4 text-base font-normal text-slate-500">
                      {datasets.find(d => d.id === selectedDataset)?.name}
                    </span>
                  )}
                  {validationDate && (
                    <span className="flex items-center text-sm text-slate-400">
                      <Calendar className="mr-1 h-4 w-4" />
                      {validationDate.toLocaleDateString() + ' ' + validationDate.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </CardTitle>
              {validationResults.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                      <span>{validationResults.filter(r => r.status === "Pass").length} Passed</span>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="mr-1 h-4 w-4 text-amber-500" />
                      <span>{validationResults.filter(r => r.status === "Warning").length} Warnings</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="mr-1 h-4 w-4 text-red-500" />
                      <span>{validationResults.filter(r => r.status === "Fail").length} Failed</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/reports')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Detailed Report
                  </Button>
                </div>
              )}
              <Separator />
            </CardHeader>
            <CardContent>
              {isRunning ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <Shield className="mb-4 h-12 w-12 animate-pulse text-blue-500" />
                  <p className="text-lg font-medium">Running validation checks...</p>
                  <p className="text-sm text-slate-500">This may take a few moments</p>
                </div>
              ) : validationResults.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center">
                  <Shield className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg font-medium">No validation results yet</p>
                  <p className="text-sm text-slate-500">
                    Select a dataset and run validation to see results
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {validationResults.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
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
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          <Clock className="mr-1 inline-block h-3 w-3" />
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Validation;
