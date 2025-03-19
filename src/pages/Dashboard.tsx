
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Gauge, 
  Clock, 
  BarChart3, 
  Database, 
  GitCompare 
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { getDatasets, getAllValidationResults, DatasetType, ValidationResult } from "@/services/api";

const Dashboard = () => {
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult[]>>({});
  const [stats, setStats] = useState({
    totalDatasets: 0,
    validationRuns: 0,
    comparisons: 0,
    passRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch real datasets
      const datasetsData = await getDatasets();
      setDatasets(datasetsData);
      
      // Fetch validation results
      const resultsData = await getAllValidationResults();
      setValidationResults(resultsData);
      
      // Calculate stats
      calculateStats(datasetsData, resultsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (datasets: DatasetType[], results: Record<string, ValidationResult[]>) => {
    const totalDatasets = datasets.length;
    const validationRuns = Object.keys(results).length;
    
    // Count all validation checks
    let totalChecks = 0;
    let passedChecks = 0;
    
    Object.values(results).forEach(resultSet => {
      resultSet.forEach(result => {
        totalChecks++;
        if (result.status === "Pass") {
          passedChecks++;
        }
      });
    });
    
    // Calculate pass rate
    const passRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    
    setStats({
      totalDatasets,
      validationRuns,
      comparisons: 0, // Not implemented yet
      passRate
    });
  };

  // Get recent validation runs from the results
  const getRecentRuns = (): { id: number, dataset: string, status: string, issues: number, timestamp: string }[] => {
    const recent: { id: number, dataset: string, status: string, issues: number, timestamp: string }[] = [];
    
    // Create a map of dataset IDs to names
    const datasetMap = new Map(datasets.map(d => [d.id, d.name]));
    
    // Process validation results into recent runs
    Object.entries(validationResults).forEach(([datasetId, results], index) => {
      if (results.length === 0) return;
      
      const datasetName = datasetMap.get(datasetId) || 'Unknown';
      const latestTimestamp = results[0].timestamp; // Assuming results are ordered by timestamp
      
      // Determine status based on validation results
      const hasFailure = results.some(r => r.status === 'Fail');
      const hasWarning = results.some(r => r.status === 'Warning');
      const status = hasFailure ? 'Fail' : (hasWarning ? 'Warning' : 'Pass');
      
      // Count issues
      const issues = results.filter(r => r.status !== 'Pass').length;
      
      recent.push({
        id: index + 1,
        dataset: datasetName,
        status,
        issues,
        timestamp: new Date(latestTimestamp).toLocaleString()
      });
    });
    
    // Sort by timestamp (most recent first) and take top 4
    return recent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 4);
  };

  // Calculate data quality by category based on validation results
  const calculateQualityData = () => {
    // Initialize categories
    const categories = {
      Completeness: { passed: 0, total: 0 },
      Accuracy: { passed: 0, total: 0 },
      Consistency: { passed: 0, total: 0 },
      Timeliness: { passed: 0, total: 0 },
      Validity: { passed: 0, total: 0 }
    };
    
    // Map validation checks to categories
    const checkToCategory: Record<string, keyof typeof categories> = {
      "Row Count Check": "Completeness",
      "Null Values Check": "Completeness",
      "Column Names Check": "Validity",
      "Data Type Validation": "Accuracy",
      "Duplicate Check": "Consistency",
      "Sheet Structure": "Validity"
    };
    
    // Process all validation results
    Object.values(validationResults).forEach(resultSet => {
      resultSet.forEach(result => {
        const category = checkToCategory[result.check] || "Validity";
        categories[category].total++;
        if (result.status === "Pass") {
          categories[category].passed++;
        }
      });
    });
    
    // Calculate scores (or return 0 if no checks)
    return Object.entries(categories).map(([category, { passed, total }]) => ({
      category,
      score: total > 0 ? Math.round((passed / total) * 100) : 0
    }));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "Pass":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "Fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const chartContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const chartBar = {
    hidden: { height: 0 },
    show: (height: number) => ({
      height: `${height}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    })
  };

  // Get recent runs and quality data
  const recentRuns = getRecentRuns();
  const qualityData = calculateQualityData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Overview of your data validation metrics and recent activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Datasets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
              <Database className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                ) : (
                  stats.totalDatasets
                )}
              </div>
              <p className="text-xs text-slate-500">
                {stats.totalDatasets > 0 ? `${stats.totalDatasets} datasets managed` : "No datasets available"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Validation Runs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Validation Runs</CardTitle>
              <Gauge className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                ) : (
                  stats.validationRuns
                )}
              </div>
              <p className="text-xs text-slate-500">
                {stats.validationRuns > 0 ? 
                  `${stats.validationRuns} total validations run` : 
                  "No validation runs yet"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comparisons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comparisons</CardTitle>
              <GitCompare className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                ) : (
                  stats.comparisons
                )}
              </div>
              <p className="text-xs text-slate-500">
                {stats.comparisons > 0 ? `${stats.comparisons} dataset comparisons` : "No comparisons available"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pass Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                ) : (
                  `${stats.passRate}%`
                )}
              </div>
              <Progress value={stats.passRate} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Validation Runs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Validation Runs</CardTitle>
              <CardDescription>
                Latest data quality validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700"></div>
                  ))}
                </div>
              ) : recentRuns.length === 0 ? (
                <div className="flex h-52 flex-col items-center justify-center text-center">
                  <Gauge className="mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-lg font-medium">No validation runs yet</p>
                  <p className="text-sm text-slate-500">
                    Run validation on your datasets to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <div className="flex items-center space-x-3">
                        {statusIcon(run.status)}
                        <div>
                          <div className="font-medium">{run.dataset}</div>
                          <div className="text-sm text-slate-500">
                            {run.issues === 0
                              ? "No issues found"
                              : `${run.issues} issue${run.issues > 1 ? "s" : ""} found`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="mr-1 h-3 w-3" />
                        {run.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Quality by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Data Quality by Category</CardTitle>
              <CardDescription>
                Breakdown of quality metrics by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[220px] animate-pulse items-end justify-between space-x-2 rounded bg-slate-200 dark:bg-slate-700"></div>
              ) : qualityData.every(item => item.score === 0) ? (
                <div className="flex h-52 flex-col items-center justify-center text-center">
                  <BarChart3 className="mb-2 h-10 w-10 text-slate-300" />
                  <p className="text-lg font-medium">No quality data available</p>
                  <p className="text-sm text-slate-500">
                    Run validation on your datasets to generate quality metrics
                  </p>
                </div>
              ) : (
                <div className="h-[220px]">
                  <motion.div
                    className="flex h-full items-end justify-between space-x-2"
                    variants={chartContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {qualityData.map((item) => (
                      <div key={item.category} className="flex h-full flex-col items-center justify-end">
                        <motion.div
                          className="w-12 rounded-t bg-blue-500"
                          custom={item.score}
                          variants={chartBar}
                        ></motion.div>
                        <div className="mt-2 text-xs">{item.category}</div>
                        <div className="font-medium">{item.score}%</div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
