
import React from 'react';
import { ValidationReport } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { FileText, RefreshCw, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

type ReportsListProps = {
  reports: ValidationReport[];
  isLoading: boolean;
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  onRefresh: () => void;
};

const ReportsList = ({ 
  reports, 
  isLoading, 
  selectedReportId, 
  onSelectReport, 
  onRefresh 
}: ReportsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 px-6">
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2" />
        <p>No validation reports available</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="px-1">
        {reports.map((report) => {
          // Calculate icon and color based on results
          const hasFailures = report.summary.fail > 0;
          const hasWarnings = report.summary.warning > 0;
          
          let StatusIcon = CheckCircle;
          let statusColorClass = "text-green-500";
          
          if (hasFailures) {
            StatusIcon = AlertCircle;
            statusColorClass = "text-red-500";
          } else if (hasWarnings) {
            StatusIcon = AlertTriangle;
            statusColorClass = "text-amber-500";
          }

          return (
            <button
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className={`w-full text-left px-4 py-3 rounded-md flex items-start gap-3 hover:bg-muted/30 transition-colors ${
                selectedReportId === report.id ? "bg-muted" : ""
              }`}
            >
              <StatusIcon className={`h-5 w-5 mt-1 ${statusColorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{report.datasetName}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>{format(new Date(report.timestamp), 'MMM d, yyyy h:mm a')}</span>
                  <span className="mx-1">•</span>
                  <span className="font-medium">{report.summary.total} checks</span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    {report.summary.pass} Pass
                  </span>
                  {report.summary.fail > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      {report.summary.fail} Fail
                    </span>
                  )}
                  {report.summary.warning > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      {report.summary.warning} Warning
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ReportsList;
