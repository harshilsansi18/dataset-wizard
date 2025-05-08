
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidationReport } from "@/services/api";

type ValidationSummaryCardProps = {
  reports: ValidationReport[];
};

const ValidationSummaryCard = ({ reports }: ValidationSummaryCardProps) => {
  // Calculate overall statistics
  const totalReports = reports.length;
  const totalChecks = reports.reduce((sum, report) => sum + report.summary.total, 0);
  const passRate = totalChecks ? 
    Math.round((reports.reduce((sum, report) => sum + report.summary.pass, 0) / totalChecks) * 100) : 
    0;
  
  // Get datasets covered
  const uniqueDatasets = new Set(reports.map(report => report.datasetId));
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
            <p className="text-2xl font-bold">{totalReports}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Datasets Covered</p>
            <p className="text-2xl font-bold">{uniqueDatasets.size}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Checks Performed</p>
            <p className="text-2xl font-bold">{totalChecks}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overall Pass Rate</p>
            <p className="text-2xl font-bold">{passRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationSummaryCard;
