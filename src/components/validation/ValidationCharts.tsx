
import React from "react";
import { 
  BarChart, 
  Bar, 
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidationResult } from "@/services/types";

type ValidationChartProps = {
  results: ValidationResult[];
  datasetId: string;
};

const ValidationCharts = ({ results, datasetId }: ValidationChartProps) => {
  if (!results || results.length === 0) {
    return <div className="text-center text-gray-500 my-8">No validation results to display</div>;
  }

  // Prepare data for status distribution chart
  const statusCounts = results.reduce(
    (counts: Record<string, number>, result) => {
      counts[result.status] = (counts[result.status] || 0) + 1;
      return counts;
    },
    {}
  );

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Prepare data for check type distribution
  const checkTypes = results.reduce(
    (types: Record<string, number>, result) => {
      // Extract check type (text before first space or colon)
      const checkType = result.check.split(/[\s:]/)[0];
      types[checkType] = (types[checkType] || 0) + 1;
      return types;
    },
    {}
  );

  const checkTypeData = Object.entries(checkTypes)
    .map(([type, count]) => ({
      name: type,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Colors for status pie chart
  const COLORS = {
    Pass: "#10B981",
    Fail: "#EF4444",
    Warning: "#F59E0B",
    Info: "#3B82F6",
  };

  // Get pie chart colors based on status
  const getPieColor = (entry: any) => {
    return COLORS[entry.name as keyof typeof COLORS] || "#CBD5E1";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validation Results Summary</CardTitle>
          <CardDescription>
            Overview of validation results for dataset
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status distribution pie chart */}
            <div className="h-80">
              <h3 className="text-sm font-medium mb-2 text-center">Result Status Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPieColor(entry)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} checks`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Check type bar chart */}
            <div className="h-80">
              <h3 className="text-sm font-medium mb-2 text-center">Check Types Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={checkTypeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationCharts;
