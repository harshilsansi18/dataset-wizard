
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, X, Info, BarChart, FileText, Database, Search, FileSpreadsheet, FileCheck, CheckCircle } from "lucide-react";
import { ValidationResult, DatasetType } from "@/services/types";
import ValidationCharts from "./ValidationCharts";
import ValidationIssuesList from "./ValidationIssuesList";
import { ValidationMethods } from "@/services/api";
import { generateValidationReport } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ValidationDashboardProps {
  dataset: DatasetType;
  validationResults: ValidationResult[];
  onRunValidation: (method: string) => void;
  isValidating: boolean;
}

const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  dataset,
  validationResults,
  onRunValidation,
  isValidating
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [reportGenerated, setReportGenerated] = useState(false);

  // Count results by status
  const resultCounts = {
    pass: validationResults.filter(r => r.status === "Pass").length,
    fail: validationResults.filter(r => r.status === "Fail").length,
    warning: validationResults.filter(r => r.status === "Warning").length,
    info: validationResults.filter(r => r.status === "Info").length,
    total: validationResults.length
  };

  // Generate report when results are available
  useEffect(() => {
    const generateReport = async () => {
      if (validationResults.length > 0 && dataset) {
        try {
          console.log("Generating validation report for:", dataset.name, "with", validationResults.length, "results");
          
          // Ensure all validation results have datasetId
          const resultsWithDatasetId = validationResults.map(result => {
            if (!result.datasetId) {
              return { ...result, datasetId: dataset.id };
            }
            return result;
          });
          
          const report = await generateValidationReport(
            dataset.id, 
            dataset.name, 
            resultsWithDatasetId
          );
          
          console.log("Generated validation report:", report);
          setReportGenerated(true);
          
          // Store report ID in session storage to highlight it on reports page
          sessionStorage.setItem('highlightReportId', report.id);
          
          toast({
            title: "Report Generated",
            description: `Validation report for "${dataset.name}" has been created.`,
          });
        } catch (error) {
          console.error("Error generating report:", error);
          toast({
            title: "Report Generation Failed",
            description: "Could not generate the validation report. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    generateReport();
  }, [validationResults, dataset, toast]);

  // Determine dataset type for specialized validation methods
  const isExcel = dataset?.name?.toLowerCase().endsWith('.xlsx') || 
                 dataset?.name?.toLowerCase().endsWith('.xls');
  const isCSV = dataset?.name?.toLowerCase().endsWith('.csv');
  const isJSON = dataset?.name?.toLowerCase().endsWith('.json');

  // Create validation method cards
  const validationMethods = [
    {
      id: ValidationMethods.BASIC,
      title: "Basic Validation",
      description: "Checks row count, column types, and data presence",
      icon: <Check className="h-5 w-5" />,
      color: "bg-green-50 text-green-700",
      recommended: true
    },
    {
      id: ValidationMethods.SCHEMA_VALIDATION,
      title: "Schema Validation",
      description: "Validates file structure, headers, and column formats",
      icon: <FileCheck className="h-5 w-5" />,
      color: "bg-blue-50 text-blue-700",
      recommended: isExcel || isCSV
    },
    {
      id: ValidationMethods.ADVANCED,
      title: "Advanced Validation",
      description: "Checks for data consistency, patterns, and quality issues",
      icon: <AlertCircle className="h-5 w-5" />,
      color: "bg-blue-50 text-blue-700",
      recommended: isExcel || isCSV
    },
    {
      id: ValidationMethods.FORMAT_CHECKS,
      title: "Format Checks",
      description: "Validates formatting of dates, emails, names, and more",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-purple-50 text-purple-700",
      recommended: isExcel || isCSV
    },
    {
      id: ValidationMethods.VALUE_LOOKUP,
      title: "Value Lookup",
      description: "Validates against standard value sets (e.g., gender, status)",
      icon: <Search className="h-5 w-5" />,
      color: "bg-amber-50 text-amber-700"
    },
    {
      id: ValidationMethods.DATA_COMPLETENESS,
      title: "Data Completeness",
      description: "Checks for missing values and data gaps",
      icon: <Database className="h-5 w-5" />,
      color: "bg-indigo-50 text-indigo-700",
      recommended: isExcel || isCSV
    },
    {
      id: ValidationMethods.DATA_QUALITY,
      title: "Data Quality",
      description: "Advanced quality checks for potential issues",
      icon: <AlertCircle className="h-5 w-5" />,
      color: "bg-rose-50 text-rose-700"
    },
    {
      id: ValidationMethods.STATISTICAL_ANALYSIS,
      title: "Statistical Analysis",
      description: "Statistical checks for data distribution and outliers",
      icon: <BarChart className="h-5 w-5" />,
      color: "bg-cyan-50 text-cyan-700"
    },
    {
      id: ValidationMethods.TEXT_ANALYSIS,
      title: "Text Analysis",
      description: "Analyze text patterns, formats, and consistency",
      icon: <FileText className="h-5 w-5" />,
      color: "bg-teal-50 text-teal-700"
    }
  ];

  // Add Excel/CSV specific validations
  if (isExcel || isCSV) {
    validationMethods.push({
      id: ValidationMethods.CROSS_COLUMN,
      title: "Cross-Column Analysis",
      description: "Validates relationships between columns and detects inconsistencies",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: "bg-indigo-50 text-indigo-700",
      recommended: true
    });
  }

  const handleRunValidation = (method: string) => {
    console.log("Running validation method:", method);
    
    // Clear any previous report info
    setReportGenerated(false);
    sessionStorage.removeItem('highlightReportId');
    
    // Actually run the validation
    onRunValidation(method);
  };

  // Function to determine alert variant based on result counts
  const getAlertVariant = () => {
    if (resultCounts.fail > 0) {
      return "destructive";
    } else if (resultCounts.warning > 0) {
      return "default";
    } else {
      return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dataset Type Indicator */}
      {dataset && (
        <div className="flex items-center">
          {isExcel && (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel Spreadsheet
            </Badge>
          )}
          {isCSV && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
              <FileText className="h-4 w-4 mr-1" />
              CSV File
            </Badge>
          )}
          {isJSON && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
              <FileText className="h-4 w-4 mr-1" />
              JSON Data
            </Badge>
          )}
          {(isExcel || isCSV) && (
            <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">
              <CheckCircle className="h-4 w-4 mr-1" />
              FBDI Compatible
            </Badge>
          )}
        </div>
      )}
    
      {/* Summary Alert */}
      {validationResults.length > 0 && (
        <Alert variant={getAlertVariant()}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Summary</AlertTitle>
          <AlertDescription>
            Found {resultCounts.total} validation results: 
            <span className="font-medium text-green-600 mx-1">{resultCounts.pass} Pass</span> |
            <span className="font-medium text-red-600 mx-1">{resultCounts.fail} Fail</span> |
            <span className="font-medium text-amber-600 mx-1">{resultCounts.warning} Warning</span> |
            <span className="font-medium text-blue-600 mx-1">{resultCounts.info} Info</span>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="methods">Validation Methods</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 pt-3">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Validation Summary</CardTitle>
              <CardDescription>
                Validation results for {dataset.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationResults.length > 0 ? (
                <ValidationCharts 
                  results={validationResults} 
                  datasetId={dataset.id}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DatabaseIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No validation results available yet.</p>
                  <p className="text-sm mt-1">Run a validation check to see results.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("methods")}
              >
                Run Validation
              </Button>
            </CardFooter>
          </Card>
          
          {validationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Validation Issues</CardTitle>
                <CardDescription>
                  Issues found during validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show only fails and warnings in overview */}
                  <ValidationIssuesList 
                    results={validationResults.filter(r => r.status === "Fail" || r.status === "Warning")}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("results")}
                >
                  View All Results
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="methods" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validationMethods.map((method) => (
              <Card key={method.id} className={`overflow-hidden ${method.recommended ? 'ring-2 ring-blue-400' : ''}`}>
                <CardHeader className={method.color}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {method.icon}
                      <CardTitle className="text-base">{method.title}</CardTitle>
                    </div>
                    {method.recommended && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardDescription className="text-gray-600">
                    {method.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-2">
                  <Button 
                    onClick={() => handleRunValidation(method.id)} 
                    disabled={isValidating} 
                    variant={method.recommended ? "default" : "secondary"}
                    className="w-full"
                  >
                    {isValidating ? "Running..." : "Run Validation"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6 pt-3">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="fail" className="text-red-600">Fail</TabsTrigger>
              <TabsTrigger value="warning" className="text-amber-600">Warning</TabsTrigger>
              <TabsTrigger value="pass" className="text-green-600">Pass</TabsTrigger>
              <TabsTrigger value="info" className="text-blue-600">Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="pt-4">
              <ValidationIssuesList results={validationResults} />
            </TabsContent>
            
            <TabsContent value="fail" className="pt-4">
              <ValidationIssuesList results={validationResults} filterStatus="Fail" />
            </TabsContent>
            
            <TabsContent value="warning" className="pt-4">
              <ValidationIssuesList results={validationResults} filterStatus="Warning" />
            </TabsContent>
            
            <TabsContent value="pass" className="pt-4">
              <ValidationIssuesList results={validationResults} filterStatus="Pass" />
            </TabsContent>
            
            <TabsContent value="info" className="pt-4">
              <ValidationIssuesList results={validationResults} filterStatus="Info" />
            </TabsContent>
          </Tabs>
          
          {reportGenerated && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => window.location.href = '/reports'}>
                <FileText className="mr-2 h-4 w-4" />
                View Complete Report
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Database icon component
const DatabaseIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
};

export default ValidationDashboard;
