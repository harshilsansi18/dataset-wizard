
import { ValidationReport } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertTriangle, Info, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ReportsListProps {
  reports: ValidationReport[];
  isLoading: boolean;
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  onRefresh: () => void;
  onDelete?: (id: string) => void;
}

const ReportsList = ({
  reports,
  isLoading,
  selectedReportId,
  onSelectReport,
  onRefresh,
  onDelete
}: ReportsListProps) => {
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const getStatusIcon = (report: ValidationReport) => {
    if (report.summary.fail > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (report.summary.warning > 0) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const handleDeleteConfirm = () => {
    if (reportToDelete && onDelete) {
      onDelete(reportToDelete);
      setReportToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center px-4 py-8">
        <p className="text-muted-foreground mb-4">No validation reports found</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Refresh Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {reports.map((report) => (
        <button
          key={report.id}
          className={`w-full px-4 py-2 flex justify-between items-center hover:bg-accent/50 focus:bg-accent/50 text-left ${
            selectedReportId === report.id ? "bg-accent" : ""
          }`}
          onClick={() => onSelectReport(report.id)}
        >
          <div className="flex items-center space-x-3 max-w-[85%]">
            <div 
              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                report.summary.fail > 0 
                  ? "bg-red-100 text-red-500" 
                  : report.summary.warning > 0 
                  ? "bg-amber-100 text-amber-500" 
                  : "bg-green-100 text-green-500"
              }`}
            >
              {getStatusIcon(report)}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-sm font-medium truncate">{report.datasetName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {format(new Date(report.timestamp), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          
          {onDelete && (
            <AlertDialog open={reportToDelete === report.id} onOpenChange={(isOpen) => {
              if (!isOpen) setReportToDelete(null);
            }}>
              <AlertDialogTrigger asChild onClick={(e) => {
                e.stopPropagation();
                setReportToDelete(report.id);
              }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full opacity-70 hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete validation report?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the validation report for "{report.datasetName}".
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                    onClick={handleDeleteConfirm}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </button>
      ))}
      
      {reports.length > 0 && (
        <div className="px-4 pt-2 pb-4">
          <Button variant="outline" size="sm" className="w-full" onClick={onRefresh}>
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh Reports
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportsList;
