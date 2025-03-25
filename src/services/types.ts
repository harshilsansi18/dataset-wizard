
export type DatasetType = {
  id: string;
  name: string;
  type: "CSV" | "JSON" | "Database";
  columnCount: number;
  rowCount: number;
  dateUploaded: string;
  status?: "Validated" | "Issues Found" | "Not Validated";
  size?: string;
  lastUpdated?: string;
  content?: any[]; // Store actual file content
  headers?: string[]; // Store column headers
};

export type ValidationResult = {
  id: string;
  datasetId: string;
  timestamp: string;
  check: string;
  status: "Pass" | "Fail" | "Warning";
  details: string;
};

export type ComparisonResultType = {
  id?: string; // Added ID field
  summary: {
    rowsAnalyzed: number;
    rowsMatched: number;
    rowsDifferent: number;
    rowsMissingSource: number;
    rowsMissingTarget: number;
    columnsCompared: number;
    columnsDifferent: number;
    executionTime: string;
  };
  columns: {
    id: string;
    name: string;
    type: string;
    matches: boolean;
    differences: number;
  }[];
  differences: {
    id: string;
    key: string;
    column: string;
    sourceValue: string;
    targetValue: string;
  }[];
  missing: {
    id: string;
    key: string;
    location: "source" | "target";
    columns: any;
  }[];
};
