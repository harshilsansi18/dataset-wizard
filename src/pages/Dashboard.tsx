
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  BarChart3, 
  ArrowRight, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Plus,
  FileText,
  RefreshCw,
  Shield,
  PieChart as PieChartIcon,
  GitCompare
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getDatasets, getAllValidationResults, DatasetType, ValidationResult } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

// Function to count validation results by status
const getValidationStatusCounts = (validationResults: Record<string, ValidationResult[]>) => {
  let passCount = 0;
  let warningCount = 0;
  let failCount = 0;
  
  Object.values(validationResults).forEach(results => {
    passCount += results.filter(r => r.status === "Pass").length;
    warningCount += results.filter(r => r.status === "Warning").length;
    failCount += results.filter(r => r.status === "Fail").length;
  });
  
  return { passCount, warningCount, failCount };
};

// Function to get dataset validation stats
const getDatasetValidationStats = (datasets: DatasetType[]) => {
  return {
    validatedCount: datasets.filter(d => d.status === "Validated").length,
    issuesFoundCount: datasets.filter(d => d.status === "Issues Found").length,
    notValidatedCount: datasets.filter(d => d.status === "Not Validated").length,
    totalCount: datasets.length
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [datasetsData, validationResultsData] = await Promise.all([
        getDatasets(),
        getAllValidationResults()
      ]);
      
      setDatasets(datasetsData);
      setValidationResults(validationResultsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    
    toast({
      title: "Dashboard refreshed",
      description: "Latest data has been loaded.",
    });
  };

  // Prepare data for charts and stats
  const { passCount, warningCount, failCount } = getValidationStatusCounts(validationResults);
  const totalChecks = passCount + warningCount + failCount;
  
  const validationPieData = [
    { name: "Pass", value: passCount, color: "#22c55e" },
    { name: "Warning", value: warningCount, color: "#f59e0b" },
    { name: "Fail", value: failCount, color: "#ef4444" },
  ].filter(item => item.value > 0);

  const datasetStats = getDatasetValidationStats(datasets);
  
  const datasetsPieData = [
    { name: "Validated", value: datasetStats.validatedCount, color: "#22c55e" },
    { name: "Issues Found", value: datasetStats.issuesFoundCount, color: "#f59e0b" },
    { name: "Not Validated", value: datasetStats.notValidatedCount, color: "#94a3b8" },
  ].filter(item => item.value > 0);
  
  // Most recent validation activity
  const recentValidations: { datasetId: string, results: ValidationResult[] }[] = [];
  
  Object.entries(validationResults).forEach(([datasetId, results]) => {
    if (results.length > 0) {
      recentValidations.push({ datasetId, results });
    }
  });
  
  // Sort by most recent timestamp
  recentValidations.sort((a, b) => {
    const aDate = new Date(a.results[0].timestamp);
    const bDate = new Date(b.results[0].timestamp);
    return bDate.getTime() - aDate.getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Overview of your data quality status
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Datasets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{datasets.length}</div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/datasets')}>
                    <Database className="mr-1 h-4 w-4 text-slate-500" />
                    View
                  </Button>
                </div>
                <div className="mt-1 flex text-xs text-slate-500">
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {datasetStats.validatedCount} Validated
                  </span>
                  <span className="ml-2 flex items-center text-amber-600">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {datasetStats.issuesFoundCount} Issues
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Validation Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">{totalChecks}</div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/validation')}>
                    <Shield className="mr-1 h-4 w-4 text-slate-500" />
                    Run
                  </Button>
                </div>
                <div className="mt-1 flex text-xs text-slate-500">
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {passCount} Pass
                  </span>
                  <span className="ml-2 flex items-center text-amber-600">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {warningCount} Warning
                  </span>
                  <span className="ml-2 flex items-center text-red-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    {failCount} Fail
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold">
                    {totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 0}%
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                    <FileText className="mr-1 h-4 w-4 text-slate-500" />
                    Reports
                  </Button>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {totalChecks === 0 ? 'No validation data available' : 
                    `Based on ${totalChecks} validation checks`}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate('/datasets')}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Dataset
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/comparison')}>
                    <GitCompare className="mr-1 h-4 w-4" />
                    Compare
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts and Activity */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Datasets Status Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Datasets Status</CardTitle>
                  <PieChartIcon className="h-5 w-5 text-slate-400" />
                </div>
                <CardDescription>
                  Current validation status of all datasets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {datasetsPieData.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center">
                    <Database className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-center text-sm text-slate-500">
                      No datasets available. <br /> 
                      Upload datasets to view status.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={datasetsPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {datasetsPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} datasets`, name]}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              <CardFooter className="justify-center border-t bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
                <Button variant="ghost" size="sm" onClick={() => navigate('/datasets')}>
                  View All Datasets
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Validation Results Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Validation Results</CardTitle>
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
                <CardDescription>
                  Summary of all validation check results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {validationPieData.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center">
                    <CheckCircle className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-center text-sm text-slate-500">
                      No validation data available. <br />
                      Run validations to see results.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={validationPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {validationPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} checks`, name]}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '6px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              <CardFooter className="justify-center border-t bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
                <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                  View Validation Reports
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Activity */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <BarChart3 className="h-5 w-5 text-slate-400" />
                </div>
                <CardDescription>
                  Latest validation runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentValidations.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center">
                    <Clock className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-center text-sm text-slate-500">
                      No recent activity. <br />
                      Run validations to see activity here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentValidations.slice(0, 5).map(validation => {
                      const dataset = datasets.find(d => d.id === validation.datasetId);
                      if (!dataset) return null;
                      
                      const passCount = validation.results.filter(r => r.status === "Pass").length;
                      const warningCount = validation.results.filter(r => r.status === "Warning").length;
                      const failCount = validation.results.filter(r => r.status === "Fail").length;
                      const validationDate = new Date(validation.results[0].timestamp);
                      
                      return (
                        <div key={validation.datasetId} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{dataset.name}</h4>
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
                          <div className="flex items-center text-xs text-slate-500">
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {passCount} Pass
                            </span>
                            <span className="ml-2 flex items-center text-amber-600">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {warningCount} Warning
                            </span>
                            <span className="ml-2 flex items-center text-red-600">
                              <XCircle className="mr-1 h-3 w-3" />
                              {failCount} Fail
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {validationDate.toLocaleDateString()} {validationDate.toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-center border-t bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
                <Button variant="ghost" size="sm" onClick={() => navigate('/validation')}>
                  Run New Validation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
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
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default Dashboard;
