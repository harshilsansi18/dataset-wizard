
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ChevronRight, 
  Terminal,
  Copy,
  Database
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const Validation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [validationMethod, setValidationMethod] = useState("basic");
  const [customSQL, setCustomSQL] = useState("");
  const [validationResults, setValidationResults] = useState<any[]>([]);

  // Mock datasets
  const datasets = [
    { id: "1", name: "Sales_Q2_2023", type: "CSV" },
    { id: "2", name: "Customer_Data_July", type: "Excel" },
    { id: "3", name: "Inventory_Database", type: "PostgreSQL" },
    { id: "4", name: "Marketing_Metrics", type: "CSV" },
    { id: "5", name: "Product_Catalog", type: "Excel" },
  ];

  const handleRunValidation = () => {
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

    // Simulate validation process
    setTimeout(() => {
      const mockResults = [
        { 
          id: 1, 
          check: "Column Completeness", 
          status: "Pass", 
          details: "All required columns are present",
          timestamp: new Date().toISOString()
        },
        { 
          id: 2, 
          check: "Data Type Validation", 
          status: "Pass", 
          details: "All data types match schema definition",
          timestamp: new Date().toISOString()
        },
        { 
          id: 3, 
          check: "Null Values Check", 
          status: "Warning", 
          details: "Found 15 null values in 'email' column",
          timestamp: new Date().toISOString()
        },
        { 
          id: 4, 
          check: "Unique Constraint", 
          status: "Fail", 
          details: "Found 3 duplicate entries in primary key 'id'",
          timestamp: new Date().toISOString()
        },
        { 
          id: 5, 
          check: "Value Range Check", 
          status: "Pass", 
          details: "All values are within expected ranges",
          timestamp: new Date().toISOString()
        },
      ];
      
      setValidationResults(mockResults);
      setIsRunning(false);
      
      toast({
        title: "Validation complete",
        description: `Completed with ${mockResults.filter(r => r.status === "Pass").length} passes, ${mockResults.filter(r => r.status === "Warning").length} warnings, and ${mockResults.filter(r => r.status === "Fail").length} failures.`,
      });
    }, 3000);
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

  const validationSnippet = `
# Example Soda Core validation YAML
profile: postgres
datasets:
  ${selectedDataset || 'your_dataset'}:
    checks:
      - row_count > 0
      - missing_count(customer_id) = 0
      - invalid_percent(email) < 5
      - duplicate_count(id) = 0
      - avg_length(description) > 10
`;

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
                    {datasets.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.type})
                      </option>
                    ))}
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
                      <Shield className="mr-2 h-4 w-4 animate-pulse" />
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
                {selectedDataset && datasets.find(d => d.id === selectedDataset) && (
                  <span className="text-base font-normal text-slate-500">
                    {datasets.find(d => d.id === selectedDataset)?.name}
                  </span>
                )}
              </CardTitle>
              {validationResults.length > 0 && (
                <div className="flex space-x-4 text-sm">
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
