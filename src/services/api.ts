
import { toast } from "@/components/ui/use-toast";

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

// Store user uploaded datasets
const datasetsStore: { [key: string]: DatasetType } = {};

// Store validation results
const validationResultsStore: { [key: string]: ValidationResult[] } = {};

// Store comparison results
const comparisonResultsStore: { [key: string]: ComparisonResultType } = {};

// API functions
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

export const uploadDataset = (file: File): Promise<DatasetType> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const id = `ds_${Date.now()}`;
        const fileSize = formatFileSize(file.size);
        const fileType = determineFileType(file.name);
        
        // This would normally parse the file to determine rows and columns
        // For now, we'll create placeholder values
        const newDataset: DatasetType = {
          id,
          name: file.name,
          type: fileType as "CSV" | "JSON" | "Database",
          columnCount: Math.floor(Math.random() * 20) + 5, // Placeholder
          rowCount: Math.floor(Math.random() * 5000) + 100, // Placeholder
          dateUploaded: new Date().toISOString().split('T')[0],
          status: "Not Validated",
          size: fileSize,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        datasetsStore[id] = newDataset;
        resolve(newDataset);
      } catch (error) {
        reject(error);
      }
    }, 1000);
  });
};

export const createDataset = (dataset: DatasetType): Promise<DatasetType> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `ds_${Date.now()}`;
      const newDataset = { 
        ...dataset, 
        id,
        status: "Not Validated",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      datasetsStore[id] = newDataset;
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
        datasetsStore[id] = { 
          ...datasetsStore[id], 
          ...updates,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
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
        resolve(true);
      } else {
        resolve(false);
      }
    }, 500);
  });
};

export const compareDatasets = (sourceId: string, targetId: string, options: any): Promise<ComparisonResultType> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const sourceDataset = datasetsStore[sourceId];
        const targetDataset = datasetsStore[targetId];
        
        if (!sourceDataset || !targetDataset) {
          throw new Error(`Dataset not found. Source: ${!!sourceDataset}, Target: ${!!targetDataset}`);
        }
        
        // In a real implementation, this would compare the actual datasets
        // For now, we'll create a placeholder result
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
        
        // Store the result for future reference
        const comparisonId = `comp_${Date.now()}`;
        comparisonResultsStore[comparisonId] = result;
        
        resolve(result);
      } catch (error) {
        console.error("Comparison error:", error);
        reject(error);
      }
    }, 1500);
  });
};

// Function to validate a dataset (placeholder for Soda Core integration)
export const validateDataset = (datasetId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Here you would integrate with Soda Core for real validation
      const dataset = datasetsStore[datasetId];
      
      if (!dataset) {
        toast({
          title: "Error",
          description: `Dataset ${datasetId} not found.`,
          variant: "destructive",
        });
        reject(new Error(`Dataset ${datasetId} not found.`));
        return;
      }
      
      // Simulating validation success
      // In a real implementation, this would call Soda Core
      toast({
        title: "Validation Request Sent",
        description: `Dataset ${dataset.name} is being validated with Soda Core.`,
      });
      
      // Update dataset status
      updateDataset(datasetId, { status: "Validated" });
      
      resolve(true);
    }, 1000);
  });
};

// This function would integrate with Soda Core for validation
export const runValidation = (
  datasetId: string, 
  method: string, 
  customSQL?: string
): Promise<ValidationResult[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const dataset = datasetsStore[datasetId];
        
        if (!dataset) {
          reject(new Error(`Dataset ${datasetId} not found.`));
          return;
        }
        
        // Generate validation results based on the validation method
        // In a real implementation, this would use Soda Core
        const results: ValidationResult[] = [];
        const timestamp = new Date().toISOString();
        
        // Generate some basic validation results
        if (method === 'basic' || method === 'advanced') {
          results.push({
            id: `vr_${Date.now()}_1`,
            datasetId,
            timestamp,
            check: 'Row count > 0',
            status: 'Pass',
            details: `Dataset has ${dataset.rowCount} rows.`
          });
          
          results.push({
            id: `vr_${Date.now()}_2`,
            datasetId,
            timestamp,
            check: 'No missing values in key columns',
            status: Math.random() > 0.7 ? 'Pass' : 'Warning',
            details: Math.random() > 0.7 ? 'No missing values found.' : 'Some columns have missing values.'
          });
        }
        
        // Add advanced validation checks
        if (method === 'advanced') {
          results.push({
            id: `vr_${Date.now()}_3`,
            datasetId,
            timestamp,
            check: 'Valid data formats',
            status: Math.random() > 0.5 ? 'Pass' : 'Fail',
            details: Math.random() > 0.5 ? 'All data formats are valid.' : 'Some data has invalid format.'
          });
          
          results.push({
            id: `vr_${Date.now()}_4`,
            datasetId,
            timestamp,
            check: 'Referential integrity',
            status: Math.random() > 0.3 ? 'Pass' : 'Fail',
            details: Math.random() > 0.3 ? 'Referential integrity maintained.' : 'Referential integrity violated.'
          });
        }
        
        // Add custom SQL check
        if (method === 'custom' && customSQL) {
          results.push({
            id: `vr_${Date.now()}_5`,
            datasetId,
            timestamp,
            check: `Custom SQL: ${customSQL.substring(0, 30)}...`,
            status: Math.random() > 0.5 ? 'Pass' : 'Fail',
            details: Math.random() > 0.5 ? 'Custom SQL check passed.' : 'Custom SQL check failed.'
          });
        }
        
        // Store the validation results
        validationResultsStore[datasetId] = [
          ...(validationResultsStore[datasetId] || []),
          ...results
        ];
        
        // Update dataset status based on validation results
        const hasFailures = results.some(r => r.status === 'Fail');
        const hasWarnings = results.some(r => r.status === 'Warning');
        
        let newStatus: "Validated" | "Issues Found" | "Not Validated" = "Validated";
        if (hasFailures) {
          newStatus = "Issues Found";
        } else if (hasWarnings) {
          newStatus = "Issues Found";
        }
        
        updateDataset(datasetId, { status: newStatus });
        
        resolve(results);
      } catch (error) {
        console.error("Validation error:", error);
        reject(error);
      }
    }, 2000);
  });
};

export const getAllValidationResults = (): Promise<ValidationResult[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allResults = Object.values(validationResultsStore).flat();
      resolve(allResults);
    }, 500);
  });
};

// Helper functions for dataset management
function determineFileType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'CSV';
  if (extension === 'json') return 'JSON';
  if (['xlsx', 'xls'].includes(extension || '')) return 'Excel';
  return 'CSV'; // Default
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Helper functions for comparison
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
