
import React from "react";
import { 
  Check, 
  AlertCircle, 
  X, 
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ValidationResult } from "@/services/types";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ValidationIssuesListProps = {
  results: ValidationResult[];
  filterStatus?: string;
};

const ValidationIssuesList = ({ results, filterStatus }: ValidationIssuesListProps) => {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  // Filter results based on status if provided
  const filteredResults = filterStatus
    ? results.filter((result) => result.status === filterStatus)
    : results;

  // Sort results by status (Fail > Warning > Info > Pass)
  const sortedResults = [...filteredResults].sort((a, b) => {
    const statusOrder = { Fail: 0, Warning: 1, Info: 2, Pass: 3 };
    return (
      (statusOrder[a.status as keyof typeof statusOrder] || 4) - 
      (statusOrder[b.status as keyof typeof statusOrder] || 4)
    );
  });

  const handleToggleAll = () => {
    if (expanded.length > 0) {
      setExpanded([]);
    } else {
      setExpanded(sortedResults.map((result) => result.id));
    }
  };

  // Group results by check type
  const groupedResults: Record<string, ValidationResult[]> = {};
  sortedResults.forEach(result => {
    const checkType = result.check.split(/[\s:]/)[0];
    if (!groupedResults[checkType]) {
      groupedResults[checkType] = [];
    }
    groupedResults[checkType].push(result);
  });

  // Render status icon based on validation status
  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case "Pass":
        return <Check className="h-4 w-4 text-green-500" />;
      case "Fail":
        return <X className="h-4 w-4 text-red-500" />;
      case "Warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "Info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Get status color class
  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case "Pass":
        return "bg-green-100 text-green-800 border-green-300";
      case "Fail":
        return "bg-red-100 text-red-800 border-red-300";
      case "Warning":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Info":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (sortedResults.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 border rounded-md">
        {filterStatus 
          ? `No ${filterStatus} validation results found.` 
          : "No validation results found."
        }
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Validation Results {filterStatus ? `(${filterStatus})` : ""}
        </h3>
        <button
          onClick={handleToggleAll}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          {expanded.length > 0 ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Expand All
            </>
          )}
        </button>
      </div>

      {Object.entries(groupedResults).map(([checkType, typeResults]) => (
        <div key={checkType} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h4 className="font-medium">{checkType} Checks</h4>
          </div>
          <Accordion
            type="multiple"
            value={expanded}
            onValueChange={setExpanded}
            className="border-0"
          >
            {typeResults.map((result) => (
              <AccordionItem key={result.id} value={result.id} className="border-b last:border-0">
                <AccordionTrigger className="hover:no-underline py-3 px-4">
                  <div className="flex items-center gap-2 text-left">
                    {getStatusIcon(result.status)}
                    <span className="font-normal">{result.check}</span>
                    <Badge variant="outline" className={cn("ml-2", getStatusColor(result.status))}>
                      {result.status}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3 pt-0">
                  <div className="text-gray-700">{result.details}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
};

export default ValidationIssuesList;
