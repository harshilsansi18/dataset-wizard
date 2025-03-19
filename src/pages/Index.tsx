
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Database, LineChart, Shield, GitCompare } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center lg:pt-32 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
            Dataset <span className="text-blue-600 dark:text-blue-400">Validation</span> and <span className="text-blue-600 dark:text-blue-400">Comparison</span>
          </h1>
          <p className="mb-10 text-xl text-slate-600 dark:text-slate-300">
            Validate, compare, and analyze your datasets with an intuitive interface. 
            Ensure data quality and identify discrepancies with ease.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-6 text-lg"
            >
              Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/datasets')}
              variant="outline"
              className="px-8 py-6 text-lg"
            >
              Upload Dataset
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          Key Features
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Dataset Management</h3>
            <p className="text-center text-slate-600 dark:text-slate-300">
              Upload CSV/Excel files or connect to databases like PostgreSQL and MySQL.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Validation Runs</h3>
            <p className="text-center text-slate-600 dark:text-slate-300">
              Run manual or automated checks using Soda Core to validate data quality.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <GitCompare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Dataset Comparison</h3>
            <p className="text-center text-slate-600 dark:text-slate-300">
              Compare datasets to identify differences in primary keys and highlight mismatched rows.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              <LineChart className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Dashboard & Insights</h3>
            <p className="text-center text-slate-600 dark:text-slate-300">
              Visualize validation trends with interactive graphs and historical logs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16 text-center lg:py-24">
        <div className="mx-auto max-w-3xl rounded-lg bg-blue-50 p-8 dark:bg-blue-900/30">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            Ready to improve your data quality?
          </h2>
          <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">
            Start validating and comparing your datasets today.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/datasets')}
            className="px-8 py-6 text-lg"
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
