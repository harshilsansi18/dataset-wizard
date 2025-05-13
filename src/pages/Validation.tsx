import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  Calendar,
  Table as TableIcon,
  Check,
  ListFilter,
  User,
  Mail,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { getDatasets, runValidation, DatasetType, ValidationResult, refreshImportedDatasets, API_URL } from "@/services/api";
import { generateValidationReport } from "@/services/reportService";

const Validation = () => {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [validationMethod, setValidationMethod] = useState("basic");
  const [customSQL, setCustomSQL] = useState("SELECT * FROM table WHERE column IS NULL");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [sqlPreview, setSqlPreview] = useState<{valid: boolean, message: string, rows_affected?: string} | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    fetchDatasets();
    
    const storedDatasetId = sessionStorage.getItem('selectedDatasetId');
    if (storedDatasetId) {
      setSelectedDataset(storedDatasetId);
      sessionStorage.removeItem('selectedDatasetId');
    }
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const fileDatasets = await getDatasets();
      const dbDatasets = await refreshImportedDatasets();
      
      console.log("File datasets:", fileDatasets.length);
      console.log("Database datasets:", dbDatasets.length);
      
      const allDatasetIds = new Set();
      const allDatasets = [];
      
      for (const dataset of fileDatasets) {
        if (!allDatasetIds.has(dataset.id)) {
          allDatasetIds.add(dataset.id);
          allDatasets.push(dataset);
        }
      }
      
      for (const dataset of dbDatasets) {
        if (!allDatasetIds.has(dataset.id)) {
          allDatasetIds.add(dataset.id);
          allDatasets.push(dataset);
        }
      }
      
      setDatasets(allDatasets);
      
      console.log("Validation page loaded datasets:", allDatasets.length);
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

  const validateSqlQuery = async () => {
    if (!customSQL) return;
    
    try {
      // Use the selected dataset's name for a more accurate preview
      const selectedDs = datasets.find(d => d.id === selectedDataset);
      const tableName = selectedDs?.name.replace('.csv', '') || 'table';
      
      // Replace generic table references with the actual dataset name
      const formattedQuery = customSQL.replace(/\bfrom\s+table\b/i, `FROM ${tableName}`);
      
      const response = await fetch(`${API_URL}/validate-sql?query=${encodeURIComponent(formattedQuery)}`);
      if (response.ok) {
        const result = await response.json();
        setSqlPreview(result);
      } else {
        setSqlPreview({
          valid: false,
          message: "Error connecting to validation service"
        });
      }
    } catch (error) {
      console.error("Error validating SQL:", error);
      setSqlPreview({
        valid: false,
        message: "Failed to validate SQL query. Backend service might be unavailable."
      });
    }
  };

  useEffect(() => {
    if (validationMethod === 'custom' && customSQL) {
      const debounce = setTimeout(() => {
        validateSqlQuery();
      }, 800);
      
      return () => clearTimeout(debounce);
    } else {
      setSqlPreview(null);
    }
  }, [customSQL, validationMethod, selectedDataset]);

  // This function performs real validation on the dataset
  const performRealValidation = (dataset: DatasetType): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    // Get current timestamp for all validation results
    const timestamp = new Date().toISOString();
    
    // Only process if we have content
    if (!dataset.content || !Array.isArray(dataset.content) || dataset.content.length === 0) {
      results.push({
        id: `val_${Date.now()}_0`,
        datasetId: dataset.id,
        timestamp,
        check: "Dataset content",
        status: "Fail",
        details: "Dataset has no content to validate",
        category: "Content"
      });
      return results;
    }
    
    // Extract headers if available
    const headers = dataset.headers || Object.keys(dataset.content[0]);
    
    // Row count check
    results.push({
      id: `val_${Date.now()}_1`,
      datasetId: dataset.id,
      timestamp,
      check: "Row count",
      status: dataset.content.length > 0 ? "Pass" : "Fail",
      details: `Expected > 0, actual: ${dataset.content.length}`,
      category: "Count"
    });
    
    // Column count check
    results.push({
      id: `val_${Date.now()}_2`,
      datasetId: dataset.id,
      timestamp,
      check: "Column count",
      status: headers.length > 0 ? "Pass" : "Fail",
      details: `Expected > 0, actual: ${headers.length}`,
      category: "Schema"
    });
    
    // Check for missing values in each column
    headers.forEach((header, idx) => {
      const missingCount = dataset.content.filter(row => row[header] === null || row[header] === undefined || row[header] === "").length;
      const missingPercentage = (missingCount / dataset.content.length) * 100;
      
      let status: "Pass" | "Fail" | "Warning" | "Info";
      if (missingCount === 0) {
        status = "Pass";
      } else if (missingPercentage > 20) {
        status = "Fail";
      } else if (missingPercentage > 5) {
        status = "Warning";
      } else {
        status = "Info";
      }
      
      results.push({
        id: `val_${Date.now()}_${3 + idx}`,
        datasetId: dataset.id,
        timestamp,
        check: `Missing values in '${header}'`,
        status,
        details: `Found ${missingCount} missing values (${missingPercentage.toFixed(1)}%)`,
        category: "Completeness",
        affectedColumns: [header]
      });
    });
    
    // Additional validations for specific dataset types
    const fileName = dataset.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');
    
    // Perform format-specific validations
    if (validationMethod === "format_checks" || validationMethod === "advanced") {
      // Check email format in any column that might contain emails
      const emailColumns = headers.filter(h => 
        h.toLowerCase().includes('email') || 
        h.toLowerCase().includes('mail') || 
        h.toLowerCase() === 'e-mail'
      );
      
      emailColumns.forEach(emailCol => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const invalidEmails = dataset.content.filter(row => 
          row[emailCol] && 
          typeof row[emailCol] === 'string' && 
          !emailRegex.test(row[emailCol])
        );
        
        if (invalidEmails.length > 0) {
          results.push({
            id: `val_${Date.now()}_email_${emailCol}`,
            datasetId: dataset.id,
            timestamp,
            check: `Email format in '${emailCol}'`,
            status: invalidEmails.length > 5 ? "Fail" : "Warning",
            details: `Found ${invalidEmails.length} invalid email addresses`,
            category: "Format",
            affectedColumns: [emailCol]
          });
        } else if (emailColumns.length > 0) {
          results.push({
            id: `val_${Date.now()}_email_valid`,
            datasetId: dataset.id,
            timestamp,
            check: `Email format in '${emailCol}'`,
            status: "Pass",
            details: "All email addresses have valid format",
            category: "Format",
            affectedColumns: [emailCol]
          });
        }
      });
      
      // Check date formats in date columns
      const dateColumns = headers.filter(h => 
        h.toLowerCase().includes('date') || 
        h.toLowerCase().includes('time') ||
        h.toLowerCase().includes('birth') ||
        h.toLowerCase().includes('created') ||
        h.toLowerCase().includes('updated')
      );
      
      dateColumns.forEach(dateCol => {
        let invalidDates = 0;
        let validDateFormat = "";
        
        // Check for common date formats
        dataset.content.forEach(row => {
          if (row[dateCol]) {
            const value = String(row[dateCol]);
            // Check if it's a valid date in any format
            const dateObj = new Date(value);
            if (isNaN(dateObj.getTime())) {
              invalidDates++;
            } else if (!validDateFormat) {
              // Store the first valid format we find
              validDateFormat = value.includes('-') ? 'YYYY-MM-DD' : 
                                value.includes('/') ? 'MM/DD/YYYY' : 
                                'Unknown';
            }
          }
        });
        
        if (invalidDates > 0) {
          results.push({
            id: `val_${Date.now()}_date_${dateCol}`,
            datasetId: dataset.id,
            timestamp,
            check: `Date format in '${dateCol}'`,
            status: invalidDates > 5 ? "Fail" : "Warning",
            details: `Found ${invalidDates} invalid date values${validDateFormat ? `. Expected format: ${validDateFormat}` : ''}`,
            category: "Format",
            affectedColumns: [dateCol]
          });
        } else if (dateColumns.length > 0) {
          results.push({
            id: `val_${Date.now()}_date_valid`,
            datasetId: dataset.id,
            timestamp,
            check: `Date format in '${dateCol}'`,
            status: "Pass",
            details: `All date values have valid format${validDateFormat ? ` (${validDateFormat})` : ''}`,
            category: "Format",
            affectedColumns: [dateCol]
          });
        }
      });
    }
    
    // Add checks for numeric fields if doing advanced validation
    if (validationMethod === "data_quality" || validationMethod === "advanced") {
      // Identify numeric columns by sampling data
      const numericColumns = headers.filter(header => {
        const sampleSize = Math.min(10, dataset.content.length);
        let numericCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
          const value = dataset.content[i][header];
          if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
            numericCount++;
          }
        }
        
        // If more than 70% of samples are numeric, consider it a numeric column
        return numericCount / sampleSize > 0.7;
      });
      
      numericColumns.forEach(numCol => {
        const values = dataset.content
          .map(row => typeof row[numCol] === 'number' ? row[numCol] : Number(row[numCol]))
          .filter(val => !isNaN(val));
        
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          
          // Check for outliers (simple method: values more than 3 standard deviations from mean)
          const stdDev = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
          );
          
          const outliers = values.filter(val => Math.abs(val - avg) > 3 * stdDev);
          
          if (outliers.length > 0) {
            results.push({
              id: `val_${Date.now()}_outlier_${numCol}`,
              datasetId: dataset.id,
              timestamp,
              check: `Outlier detection in '${numCol}'`,
              status: outliers.length > 5 ? "Warning" : "Info",
              details: `Found ${outliers.length} outliers. Range: ${min} to ${max}, Avg: ${avg.toFixed(2)}`,
              category: "Outliers",
              affectedColumns: [numCol]
            });
          } else {
            results.push({
              id: `val_${Date.now()}_range_${numCol}`,
              datasetId: dataset.id,
              timestamp,
              check: `Numeric range in '${numCol}'`,
              status: "Pass",
              details: `All values within expected range. Min: ${min}, Max: ${max}, Avg: ${avg.toFixed(2)}`,
              category: "Range",
              affectedColumns: [numCol]
            });
          }
        }
      });
    }
    
    // FBDI specific validations for Excel/CSV files
    if ((isExcel || isCSV) && (validationMethod === "basic" || validationMethod === "advanced")) {
      // Check for duplicate headers
      const headerSet = new Set<string>();
      const duplicateHeaders: string[] = [];
      
      headers.forEach(header => {
        if (headerSet.has(header)) {
          duplicateHeaders.push(header);
        } else {
          headerSet.add(header);
        }
      });
      
      if (duplicateHeaders.length > 0) {
        results.push({
          id: `val_${Date.now()}_dup_headers`,
          datasetId: dataset.id,
          timestamp,
          check: "Duplicate column headers",
          status: "Fail",
          details: `Found duplicate headers: ${duplicateHeaders.join(", ")}`,
          category: "Schema",
          affectedColumns: duplicateHeaders
        });
      } else {
        results.push({
          id: `val_${Date.now()}_unique_headers`,
          datasetId: dataset.id,
          timestamp,
          check: "Unique column headers",
          status: "Pass",
          details: "All column headers are unique",
          category: "Schema"
        });
      }
      
      // Check for required FBDI columns if format_checks or data_completeness is selected
      if (validationMethod === "format_checks" || validationMethod === "data_completeness") {
        // Common FBDI column patterns
        const requiredPatterns = [
          'SOURCE_SYSTEM',
          'BATCH_ID',
          'BUSINESS_UNIT',
          'ID',
          'NAME',
          'CODE',
          'STATUS'
        ];
        
        const missingPatterns = requiredPatterns.filter(pattern => 
          !headers.some(h => h.toUpperCase().includes(pattern))
        );
        
        if (missingPatterns.length > 0) {
          results.push({
            id: `val_${Date.now()}_fbdi_cols`,
            datasetId: dataset.id,
            timestamp,
            check: "FBDI required columns",
            status: "Warning",
            details: `Missing recommended columns containing: ${missingPatterns.join(", ")}`,
            category: "FBDI"
          });
        } else {
          results.push({
            id: `val_${Date.now()}_fbdi_cols_ok`,
            datasetId: dataset.id,
            timestamp,
            check: "FBDI required columns",
            status: "Pass",
            details: "All recommended FBDI columns present",
            category: "FBDI"
          });
        }
      }
    }
    
    return results;
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
    setReportGenerated(false);
    setProgress(0);
    setLogs([]);
    
    // Add initial log
    setLogs(prev => [...prev, "Starting real dataset validation..."]);
    
    try {
      setProgress(10);
      setLogs(prev => [...prev, "Loading dataset content..."]);
      
      // Find the selected dataset
      const selectedDs = datasets.find(d => d.id === selectedDataset);
      if (!selectedDs) {
        throw new Error("Selected dataset not found");
      }
      
      setProgress(30);
      setLogs(prev => [...prev, `Analyzing ${selectedDs.name}...`]);
      
      // Perform real validation based on the dataset
      const realResults = performRealValidation(selectedDs);
      
      setProgress(70);
      setLogs(prev => [...prev, `Found ${realResults.length} validation results`]);
      
      setValidationResults(realResults);
      setProgress(90);
      
      if (selectedDs && realResults.length > 0) {
        try {
          setLogs(prev => [...prev, "Generating validation report..."]);
          
          // Generate the report
          const report = await generateValidationReport(
            selectedDataset,
            selectedDs.name,
            realResults
          );
          
          // Add report ID to session storage to highlight it on reports page
          sessionStorage.setItem('highlightReportId', report.id);
          setReportGenerated(true);
          
          console.log("Generated validation report:", report);
          
          setLogs(prev => [...prev, "Validation report generated successfully"]);
          setProgress(100);
          
          toast({
            title: "Validation complete",
            description: `Validated ${selectedDs.name} with ${realResults.filter(r => r.status === "Pass").length} passes, ${realResults.filter(r => r.status === "Warning").length} warnings, and ${realResults.filter(r => r.status === "Fail").length} failures.`,
          });
        } catch (error) {
          console.error("Error generating report:", error);
          setProgress(100);
          setLogs(prev => [...prev, "Error generating report"]);
          
          toast({
            title: "Report Generation Failed",
            description: "The validation ran successfully but there was an issue creating the report.",
            variant: "destructive"
          });
        }
      } else {
        setProgress(100);
        setLogs(prev => [...prev, "Validation complete"]);
        
        toast({
          title: "Validation complete",
          description: realResults.length > 0 
            ? `Completed with ${realResults.filter(r => r.status === "Pass").length} passes, ${realResults.filter(r => r.status === "Warning").length} warnings, and ${realResults.filter(r => r.status === "Fail").length} failures.`
            : "No validation results were generated. Dataset may be empty.",
        });
      }
      
      fetchDatasets();
    } catch (error) {
      console.error("Validation error:", error);
      setProgress(100);
      setLogs(prev => [...prev, "Validation failed with error"]);
      
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
            - row_count > 0` : ''}${validationMethod === 'format_checks' ? `
      - values in [name, first_name, last_name] match regex "[A-Z].*"
      - values in [email] match regex "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
      - values in [birth_date] match regex "^\\d{4}[/\\-]\\d{1,2}[/\\-]\\d{1,2}$"` : ''}${validationMethod === 'value_lookup' ? `
      - values in [gender] in ("F", "M")
      - values in [civil_status] in ("S", "M")` : ''}${validationMethod === 'data_completeness' ? `
      - row_count > 0
      - missing_count(id) = 0
      - missing_percent(name) < 1
      - duplicate_count(id) = 0` : ''}${validationMethod === 'data_quality' ? `
      - min(birth_date) > date("1900-01-01")
      - max(birth_date) < today()
      - avg(age) between 18 and 100
      - stddev(salary) < 50000` : ''}
`;

  const validationDate = validationResults.length > 0 
    ? new Date(validationResults[0].timestamp)
    : null;

  useEffect(() => {
    if (selectedDataset && datasets.length > 0 && !isRunning && validationResults.length === 0) {
      const fromChatbot = sessionStorage.getItem('fromChatbot');
      if (fromChatbot) {
        sessionStorage.removeItem('fromChatbot');
        handleRunValidation();
      }
    }
  }, [selectedDataset, datasets]);

  const getSelectedDatasetName = () => {
    if (!selectedDataset) return null;
    const dataset = datasets.find(d => d.id === selectedDataset);
    return dataset?.name;
  };

  // Get validation method icon
  const getValidationMethodIcon = () => {
    switch (validationMethod) {
      case "format_checks":
        return <Check className="mr-2 h-5 w-5" />;
      case "value_lookup":
        return <ListFilter className="mr-2 h-5 w-5" />;
      case "data_completeness":
        return <TableIcon className="mr-2 h-5 w-5" />;
      case "data_quality":
        return <CheckCircle className="mr-2 h-5 w-5" />;
      case "custom":
        return <Terminal className="mr-2 h-5 w-5" />;
      default:
        return <Shield className="mr-2 h-5 w-5" />;
    }
  };

  const renderValidationResults = () => {
    if (isRunning) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Validation in progress...</span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            {logs.map((log, i) => (
              <div key={i} className="py-1 pl-2 font-mono text-xs">
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (validationResults.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center">
          <Shield className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium">No validation results yet</p>
          <p className="text-sm text-slate-500">
            Select a dataset and run validation to see results
          </p>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead className="w-[250px]">Check</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validationResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="flex justify-center">
                      {getResultIcon(result.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {result.check}
                  </TableCell>
                  <TableCell>{result.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {reportGenerated && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => navigate('/reports')}>
                <FileText className="mr-2 h-4 w-4" />
                View Full Report
              </Button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Validation</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Configure and run data quality validations on your datasets
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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

                <Tabs defaultValue="basic" onValueChange={(value) => setValidationMethod(value)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Options</TabsTrigger>
                    <TabsTrigger value="extended">Extended Options</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 pt-2">
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
                  </TabsContent>
                  
                  <TabsContent value="extended" className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>FBDI File Validation</Label>
                      <RadioGroup 
                        value={validationMethod} 
                        onValueChange={setValidationMethod}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="format_checks" id="format_checks" />
                          <Label htmlFor="format_checks" className="cursor-pointer flex items-start">
                            <span className="flex items-center">
                              <Check className="mr-2 h-4 w-4 text-blue-600" />
                              Format Checks
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">(Name, Email, Date, Phone)</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="value_lookup" id="value_lookup" />
                          <Label htmlFor="value_lookup" className="cursor-pointer flex items-start">
                            <span className="flex items-center">
                              <ListFilter className="mr-2 h-4 w-4 text-blue-600" />
                              Value Lookup Checks
                            </span>
                            <span className="ml-1
