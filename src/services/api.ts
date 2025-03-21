
import { toast } from "@/components/ui/use-toast";

export type DatasetType = {
  id: string;
  name: string;
  type: "CSV" | "JSON" | "Database";
  columnCount: number;
  rowCount: number;
  dateUploaded: string;
  // Add missing properties to fix type errors
  status: "Validated" | "Issues Found" | "Not Validated";
  size: string;
  lastUpdated: string;
};

export type ValidationResult = {
  id: string;
  datasetId: string;
  check: string;
  status: "Pass" | "Warning" | "Fail";
  details: string;
  timestamp: string;
};

export type ComparisonResultType = {
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

// Mock data - replace with actual API calls
const mockDatasets: DatasetType[] = [
  {
    id: "ds_1",
    name: "Sales Data CSV",
    type: "CSV",
    columnCount: 12,
    rowCount: 1500,
    dateUploaded: "2024-01-20",
    status: "Validated",
    size: "2.3 MB",
    lastUpdated: "2024-01-25",
  },
  {
    id: "ds_2",
    name: "Customer Data JSON",
    type: "JSON",
    columnCount: 8,
    rowCount: 800,
    dateUploaded: "2024-02-15",
    status: "Issues Found",
    size: "1.5 MB",
    lastUpdated: "2024-02-20",
  },
  {
    id: "ds_3",
    name: "Inventory Database",
    type: "Database",
    columnCount: 20,
    rowCount: 2500,
    dateUploaded: "2024-03-01",
    status: "Not Validated",
    size: "4.7 MB",
    lastUpdated: "2024-03-05",
  },
  {
    id: "ds_4",
    name: "Marketing Data CSV",
    type: "CSV",
    columnCount: 15,
    rowCount: 1800,
    dateUploaded: "2024-03-10",
    status: "Validated",
    size: "3.1 MB",
    lastUpdated: "2024-03-15",
  },
  {
    id: "ds_5",
    name: "Financial Data JSON",
    type: "JSON",
    columnCount: 10,
    rowCount: 1200,
    dateUploaded: "2024-03-15",
    status: "Issues Found",
    size: "2.8 MB",
    lastUpdated: "2024-03-20",
  },
];

// Local storage for datasets
const datasetsStore: { [key: string]: DatasetType } = (() => {
  const storedDatasets = localStorage.getItem("datasets");
  if (storedDatasets) {
    return JSON.parse(storedDatasets);
  }
  
  // Initialize with mock data if no stored data
  const store = mockDatasets.reduce(
    (acc, dataset) => {
      acc[dataset.id] = dataset;
      return acc;
    },
    {} as { [key: string]: DatasetType }
  );
  
  // Store in localStorage
  localStorage.setItem("datasets", JSON.stringify(store));
  return store;
})();

// Local storage for comparison results
const comparisonResultsStore: { [key: string]: ComparisonResultType } = (() => {
  const storedResults = localStorage.getItem("comparisonResults");
  return storedResults ? JSON.parse(storedResults) : {};
})();

// Local storage for validation results
const validationResultsStore: { [key: string]: ValidationResult[] } = (() => {
  const storedResults = localStorage.getItem("validationResults");
  if (storedResults) {
    return JSON.parse(storedResults);
  }
  
  // Create some sample validation results for demo purposes
  const results: { [key: string]: ValidationResult[] } = {};
  
  Object.keys(datasetsStore).forEach(datasetId => {
    // Only create sample results for some datasets
    if (Math.random() > 0.3) {
      results[datasetId] = generateSampleValidationResults(datasetId, 5 + Math.floor(Math.random() * 10));
    }
  });
  
  // Store in localStorage
  localStorage.setItem("validationResults", JSON.stringify(results));
  return results;
})();

// API functions (mocked for now)
export const getDatasets = (): Promise<DatasetType[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Object.values(datasetsStore));
    }, 500);
  });
};

export const getDatasetById = (id: string): Promise<DatasetType | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(datasetsStore[id]);
    }, 300);
  });
};

export const createDataset = (dataset: DatasetType): Promise<DatasetType> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `ds_${Date.now()}`;
      const newDataset = { ...dataset, id };
      datasetsStore[id] = newDataset;
      // Persist to localStorage
      localStorage.setItem("datasets", JSON.stringify(datasetsStore));
      resolve(newDataset);
    }, 500);
  });
};

export const updateDataset = (
  id: string,
  updates: Partial<DatasetType>
): Promise<DatasetType | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (datasetsStore[id]) {
        datasetsStore[id] = { ...datasetsStore[id], ...updates };
        // Persist to localStorage
        localStorage.setItem("datasets", JSON.stringify(datasetsStore));
        resolve(datasetsStore[id]);
      } else {
        resolve(undefined);
      }
    }, 500);
  });
};

export const deleteDataset = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (datasetsStore[id]) {
        delete datasetsStore[id];
        // Persist to localStorage
        localStorage.setItem("datasets", JSON.stringify(datasetsStore));
        resolve(true);
      } else {
        resolve(false);
      }
    }, 500);
  });
};

// Add the missing uploadDataset function
export const uploadDataset = (file: File): Promise<DatasetType> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Mock file upload process
        const fileType = file.name.endsWith('.csv') ? 'CSV' : 
                         file.name.endsWith('.json') ? 'JSON' : 'Database';
        
        const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0];
        
        const dataset: DatasetType = {
          id: `ds_${Date.now()}`,
          name: file.name.split('.')[0],
          type: fileType as "CSV" | "JSON" | "Database",
          columnCount: 5 + Math.floor(Math.random() * 15),
          rowCount: 100 + Math.floor(Math.random() * 3000),
          dateUploaded: formattedDate,
          status: "Not Validated",
          size: fileSize,
          lastUpdated: formattedDate,
        };
        
        // Add to datasetsStore
        datasetsStore[dataset.id] = dataset;
        
        // Persist to localStorage
        localStorage.setItem("datasets", JSON.stringify(datasetsStore));
        
        resolve(dataset);
      } catch (error) {
        reject(error);
      }
    }, 800);
  });
};

// Add the missing runValidation function
export const runValidation = (
  datasetId: string, 
  validationType: string, 
  customSQL?: string
): Promise<ValidationResult[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const dataset = datasetsStore[datasetId];
        
        if (!dataset) {
          throw new Error(`Dataset with ID ${datasetId} not found`);
        }
        
        // Generate validation results based on the dataset and validation type
        const results = generateValidationResults(dataset, validationType, customSQL);
        
        // Update dataset status based on results
        const failCount = results.filter(r => r.status === "Fail").length;
        const warningCount = results.filter(r => r.status === "Warning").length;
        
        let newStatus: "Validated" | "Issues Found" | "Not Validated" = "Validated";
        if (failCount > 0) {
          newStatus = "Issues Found";
        } else if (warningCount > 0) {
          newStatus = "Issues Found";
        }
        
        // Update dataset status
        dataset.status = newStatus;
        dataset.lastUpdated = new Date().toISOString().split('T')[0];
        
        // Store validation results
        validationResultsStore[datasetId] = results;
        
        // Persist to localStorage
        localStorage.setItem("validationResults", JSON.stringify(validationResultsStore));
        localStorage.setItem("datasets", JSON.stringify(datasetsStore));
        
        resolve(results);
      } catch (error) {
        console.error("Validation error:", error);
        reject(error);
      }
    }, 1500);
  });
};

// Add the missing getAllValidationResults function
export const getAllValidationResults = (): Promise<{ [key: string]: ValidationResult[] }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(validationResultsStore);
    }, 800);
  });
};

// Implement the compareDatasets function
export const compareDatasets = (sourceId: string, targetId: string, options: any): Promise<ComparisonResultType> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const sourceDataset = datasetsStore[sourceId];
        const targetDataset = datasetsStore[targetId];
        
        if (!sourceDataset || !targetDataset) {
          throw new Error(`Dataset not found. Source: ${!!sourceDataset}, Target: ${!!targetDataset}`);
        }
        
        // Generate a comparison result based on the actual datasets
        const result: ComparisonResultType = {
          summary: {
            rowsAnalyzed: Math.max(sourceDataset.rowCount, targetDataset.rowCount),
            rowsMatched: Math.min(sourceDataset.rowCount, targetDataset.rowCount) - 5,
            rowsDifferent: 5,
            rowsMissingSource: targetDataset.rowCount > sourceDataset.rowCount ? targetDataset.rowCount - sourceDataset.rowCount : 0,
            rowsMissingTarget: sourceDataset.rowCount > targetDataset.rowCount ? sourceDataset.rowCount - targetDataset.rowCount : 0,
            columnsCompared: Math.min(sourceDataset.columnCount, targetDataset.columnCount),
            columnsDifferent: Math.abs(sourceDataset.columnCount - targetDataset.columnCount) + 2,
            executionTime: `${(Math.random() * 2 + 0.5).toFixed(2)}s`,
          },
          columns: generateComparisonColumns(sourceDataset, targetDataset),
          differences: generateDifferences(sourceDataset, targetDataset),
          missing: generateMissingRows(sourceDataset, targetDataset),
        };
        
        // Store the result
        const comparisonId = `comp_${Date.now()}`;
        comparisonResultsStore[comparisonId] = result;
        
        // Save to localStorage
        localStorage.setItem('comparisonResults', JSON.stringify(comparisonResultsStore));
        
        resolve(result);
      } catch (error) {
        console.error("Comparison error:", error);
        reject(error);
      }
    }, 1500);
  });
};

// Helper function to generate validation results
function generateValidationResults(
  dataset: DatasetType, 
  validationType: string, 
  customSQL?: string
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const timestamp = new Date().toISOString();
  
  // Basic checks that all validations include
  results.push({
    id: `val_${Date.now()}_1`,
    datasetId: dataset.id,
    check: "Row Count Check",
    status: dataset.rowCount > 0 ? "Pass" : "Fail",
    details: `Dataset contains ${dataset.rowCount} rows.`,
    timestamp,
  });
  
  results.push({
    id: `val_${Date.now()}_2`,
    datasetId: dataset.id,
    check: "Null Values Check",
    status: Math.random() > 0.7 ? "Warning" : "Pass",
    details: Math.random() > 0.7 ? "Found 1 null values in first column." : "No null values in first column.",
    timestamp,
  });
  
  // Add more checks based on validation type
  if (validationType === "advanced" || validationType === "custom") {
    results.push({
      id: `val_${Date.now()}_3`,
      datasetId: dataset.id,
      check: "Schema Validation",
      status: Math.random() > 0.8 ? "Fail" : "Pass",
      details: Math.random() > 0.8 ? "Schema mismatch in column 'price'" : "Schema validation passed for all columns",
      timestamp,
    });
    
    results.push({
      id: `val_${Date.now()}_4`,
      datasetId: dataset.id,
      check: "Data Type Validation",
      status: Math.random() > 0.7 ? "Warning" : "Pass",
      details: Math.random() > 0.7 ? "Mixed data types in column 'quantity'" : "All values have consistent numeric data type",
      timestamp,
    });
    
    results.push({
      id: `val_${Date.now()}_5`,
      datasetId: dataset.id,
      check: "Duplicate Check",
      status: Math.random() > 0.9 ? "Fail" : "Pass",
      details: Math.random() > 0.9 ? "Found 3 duplicate records" : "No duplicate records found",
      timestamp,
    });
  }
  
  // Add custom SQL check result if provided
  if (validationType === "custom" && customSQL) {
    results.push({
      id: `val_${Date.now()}_6`,
      datasetId: dataset.id,
      check: "Custom SQL Check",
      status: Math.random() > 0.5 ? "Pass" : Math.random() > 0.5 ? "Warning" : "Fail",
      details: `Executed SQL: ${customSQL.substring(0, 50)}${customSQL.length > 50 ? '...' : ''}`,
      timestamp,
    });
  }
  
  return results;
}

// Helper function to generate sample validation results for initial data
function generateSampleValidationResults(datasetId: string, count: number): ValidationResult[] {
  const results: ValidationResult[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - i * 3600000);
    const statuses: Array<"Pass" | "Warning" | "Fail"> = ["Pass", "Warning", "Fail"];
    const status = statuses[Math.floor(Math.random() * (i === 0 ? 3 : 2))]; // Make sure at least one failure exists
    
    results.push({
      id: `val_${date.getTime()}_${i}`,
      datasetId,
      check: ["Row Count Check", "Null Values Check", "Schema Validation", "Duplicate Check", "Custom Check"][i % 5],
      status,
      details: status === "Pass" 
        ? "Validation passed successfully"
        : status === "Warning"
        ? "Warning: potential data quality issue detected"
        : "Validation failed: data does not meet quality standards",
      timestamp: date.toISOString(),
    });
  }
  
  return results;
}

// Helper function to generate comparison columns
function generateComparisonColumns(sourceDataset: DatasetType, targetDataset: DatasetType) {
  const totalColumns = Math.max(sourceDataset.columnCount, targetDataset.columnCount);
  const columns = [];
  
  for (let i = 0; i < totalColumns; i++) {
    const hasInSource = i < sourceDataset.columnCount;
    const hasInTarget = i < targetDataset.columnCount;
    const matches = hasInSource && hasInTarget && Math.random() > 0.3;
    const differences = matches ? 0 : Math.floor(Math.random() * 20) + 1;
    
    columns.push({
      id: `col_${i}`,
      name: `Column ${i + 1}`,
      type: Math.random() > 0.5 ? 'string' : 'number',
      matches,
      differences
    });
  }
  
  return columns;
}

// Helper function to generate differences
function generateDifferences(sourceDataset: DatasetType, targetDataset: DatasetType) {
  const differences = [];
  const rowCount = Math.min(10, Math.min(sourceDataset.rowCount, targetDataset.rowCount));
  
  for (let i = 0; i < rowCount; i++) {
    differences.push({
      id: `diff_${i}`,
      key: `row_${i + 1}`,
      column: `Column ${Math.floor(Math.random() * sourceDataset.columnCount) + 1}`,
      sourceValue: `Value ${Math.floor(Math.random() * 100)}`,
      targetValue: `Value ${Math.floor(Math.random() * 100)}`
    });
  }
  
  return differences;
}

// Helper function to generate missing rows
function generateMissingRows(sourceDataset: DatasetType, targetDataset: DatasetType) {
  const missing = [];
  const sourceMissing = Math.max(0, targetDataset.rowCount - sourceDataset.rowCount);
  const targetMissing = Math.max(0, sourceDataset.rowCount - targetDataset.rowCount);
  
  for (let i = 0; i < sourceMissing; i++) {
    missing.push({
      id: `missing_src_${i}`,
      key: `row_${sourceDataset.rowCount + i + 1}`,
      location: "source",
      columns: { id: sourceDataset.rowCount + i + 1, data: "Sample data missing in source" }
    });
  }
  
  for (let i = 0; i < targetMissing; i++) {
    missing.push({
      id: `missing_tgt_${i}`,
      key: `row_${targetDataset.rowCount + i + 1}`,
      location: "target",
      columns: { id: targetDataset.rowCount + i + 1, data: "Sample data missing in target" }
    });
  }
  
  return missing;
}

export const validateDataset = (datasetId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock validation logic
      const isValid = Math.random() > 0.1; // 90% chance of being valid
      if (isValid) {
        toast({
          title: "Validation Successful",
          description: `Dataset ${datasetId} is valid.`,
        });
        resolve(true);
      } else {
        toast({
          title: "Validation Failed",
          description: `Dataset ${datasetId} is invalid.`,
          variant: "destructive",
        });
        resolve(false);
      }
    }, 1000);
  });
};
