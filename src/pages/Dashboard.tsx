
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

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDatasets: 0,
    validationRuns: 0,
    comparisons: 0,
    passRate: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        totalDatasets: 12,
        validationRuns: 48,
        comparisons: 8,
        passRate: 85
      });
      setIsLoading(false);
      toast({
        title: "Dashboard updated",
        description: "Latest validation metrics have been loaded",
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Recent validation runs data
  const recentRuns = [
    { id: 1, dataset: "Sales_2023_Q2", status: "Pass", issues: 0, timestamp: "2023-07-15 09:23" },
    { id: 2, dataset: "Customer_Data", status: "Fail", issues: 3, timestamp: "2023-07-14 16:42" },
    { id: 3, dataset: "Inventory_July", status: "Warning", issues: 1, timestamp: "2023-07-13 11:17" },
    { id: 4, dataset: "Marketing_Campaign", status: "Pass", issues: 0, timestamp: "2023-07-12 14:05" },
  ];

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

  // Data quality by category data
  const qualityData = [
    { category: "Completeness", score: 92 },
    { category: "Accuracy", score: 88 },
    { category: "Consistency", score: 95 },
    { category: "Timeliness", score: 78 },
    { category: "Validity", score: 91 }
  ];

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
                  `Last run ${Math.floor(Math.random() * 24)} hours ago` : 
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
