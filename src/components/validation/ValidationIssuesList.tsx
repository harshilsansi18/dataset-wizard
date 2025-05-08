
import React from "react";
import { ValidationResult } from "@/services/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Info } from "lucide-react";

interface ValidationIssuesListProps {
  results: ValidationResult[];
  filterStatus?: "Pass" | "Fail" | "Warning" | "Info";
}

const ValidationIssuesList: React.FC<ValidationIssuesListProps> = ({ results, filterStatus }) => {
  // Apply filter if specified
  const filteredResults = filterStatus 
    ? results.filter(result => result.status === filterStatus)
    : results;
  
  if (filteredResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No validation results to display.</p>
      </div>
    );
  }
  
  // Get status icon and badge based on status
  const getStatusDetails = (status: ValidationResult["status"]) => {
    switch (status) {
      case "Pass":
        return {
          icon: <Check className="h-4 w-4 text-green-500" />,
          badge: <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Pass</Badge>
        };
      case "Fail":
        return {
          icon: <X className="h-4 w-4 text-red-500" />,
          badge: <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Fail</Badge>
        };
      case "Warning":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
          badge: <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200">Warning</Badge>
        };
      case "Info":
        return {
          icon: <Info className="h-4 w-4 text-blue-500" />,
          badge: <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">Info</Badge>
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-gray-500" />,
          badge: <Badge variant="outline">Unknown</Badge>
        };
    }
  };
  
  return (
    <div className="space-y-4">
      {filteredResults.map(result => {
        const { icon, badge } = getStatusDetails(result.status);
        return (
          <Card key={result.id} className="overflow-hidden border-l-4" 
            style={{ 
              borderLeftColor: 
                result.status === "Pass" ? "#10B981" : 
                result.status === "Fail" ? "#EF4444" : 
                result.status === "Warning" ? "#F59E0B" : 
                result.status === "Info" ? "#3B82F6" : "#94A3B8" 
            }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium leading-none mb-1">{result.check}</h3>
                    <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                  </div>
                </div>
                <div className="ml-2">
                  {badge}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ValidationIssuesList;
