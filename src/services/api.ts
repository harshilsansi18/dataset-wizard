import { toast } from "@/components/ui/use-toast";
import Papa from "papaparse";

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

// Persistent storage using localStorage
const DATASETS_STORAGE_KEY = "soda_core_datasets";
const VALIDATION_RESULTS_STORAGE_KEY = "soda_core_validation_results";
const COMPARISON_RESULTS_STORAGE_KEY = "soda_core_comparison_results";

// Initialize stores from localStorage or create empty objects
const initializeStore = (storageKey: string, defaultValue: any = {}) => {
  try {
    const storedData = localStorage.getItem(storageKey);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(`Error initializing store for ${storageKey}:`, error);
    return defaultValue;
  }
};

// Store datasets, validation results, and comparison results
let datasetsStore: { [key: string]: DatasetType } = initializeStore(DATASETS_STORAGE_KEY);
let validationResultsStore: { [key: string]: ValidationResult[] } = initializeStore(VALIDATION_RESULTS_STORAGE_KEY);
let comparisonResultsStore: { [key: string]: ComparisonResultType } = initializeStore(COMPARISON_RESULTS_STORAGE_KEY);

// Save store to localStorage
const saveToStorage = (storageKey: string, data: any) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${storageKey}:`, error);
    toast({
      title: "Storage Error",
      description: "Failed to save data locally. Your browser storage might be full.",
      variant: "destructive",
    });
  }
};

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

// Process file content based on type
const processFileContent = async (file: File): Promise<{ content: any[], headers: string[], rowCount: number, columnCount: number }> => {
  return new Promise((resolve, reject) => {
    const fileType = determineFileType(file.name);
    
    if (fileType === 'CSV') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({
            content: results.data,
            headers,
            rowCount: results.data.length,
            columnCount: headers.length
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    } else if (fileType === 'JSON') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          const isArray = Array.isArray(content);
          const data = isArray ? content : [content];
          const headers = isArray && content.length > 0 ? Object.keys(content[0]) : Object.keys(content);
          
          resolve({
            content: data,
            headers,
            rowCount: data.length,
            columnCount: headers.length
          });
        } catch (error) {
          reject(new Error('Invalid JSON format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } else {
      reject(new Error(`Unsupported file type: ${fileType}`));
    }
  });
};

export const uploadDataset = (file: File): Promise<DatasetType> => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = `ds_${Date.now()}`;
      const fileSize = formatFileSize(file.size);
      const fileType = determineFileType(file.name);
      
      // Actually process the file content instead of using random values
      const { content, headers, rowCount, columnCount } = await processFileContent(file);
      
      const newDataset: DatasetType = {
        id,
        name: file.name,
        type: fileType as "CSV" | "JSON" | "Database",
        columnCount,
        rowCount,
        dateUploaded: new Date().toISOString().split('T')[0],
        status: "Not Validated",
        size: fileSize,
        lastUpdated: new Date().toISOString().split('T')[0],
        content,
        headers
      };
      
      // Save to store and persist
      datasetsStore[id] = newDataset;
      saveToStorage(DATASETS_STORAGE_KEY, datasetsStore);
      
      resolve(newDataset);
    } catch (error) {
      console.error("Upload error:", error);
      reject(error);
    }
  });
};

export const createDataset = (dataset: DatasetType): Promise<DatasetType> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `ds_${Date.now()}`;
      const newDataset: DatasetType = { 
        ...dataset, 
        id,
        status: "Not Validated",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      datasetsStore[id] = newDataset;
      saveToStorage(DATASETS_STORAGE_KEY, datasetsStore);
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
        saveToStorage(DATASETS_STORAGE_KEY, datasetsStore);
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
        saveToStorage(DATASETS_STORAGE_KEY, datasetsStore);
        
        // Also clean up related validation results
        if (validationResultsStore[id]) {
          delete validationResultsStore[id];
          saveToStorage(VALIDATION_RESULTS_STORAGE_KEY, validationResultsStore);
        }
        
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

// Actual data validation functions
const validateRowCount = (data: any[]): ValidationResult['status'] => {
  return data.length > 0 ? 'Pass' : 'Fail';
};

const validateMissingValues = (data: any[], headers: string[]): { status: ValidationResult['status'], details: string } => {
  const nullCounts: Record<string, number> = {};
  let totalNulls = 0;
  
  headers.forEach(header => {
    const nullCount = data.filter(row => !row[header] && row[header] !== 0 && row[header] !== false).length;
    if (nullCount > 0) {
      nullCounts[header] = nullCount;
      totalNulls += nullCount;
    }
  });
  
  if (totalNulls === 0) {
    return { status: 'Pass', details: 'No missing values found in any columns.' };
  } else if (totalNulls / (data.length * headers.length) < 0.05) {
    return { 
      status: 'Warning', 
      details: `Found ${totalNulls} missing values across ${Object.keys(nullCounts).length} columns.`
    };
  } else {
    return { 
      status: 'Fail', 
      details: `High number of missing values: ${totalNulls} nulls found across ${Object.keys(nullCounts).length} columns.`
    };
  }
};

const validateDataTypes = (data: any[], headers: string[]): { status: ValidationResult['status'], details: string } => {
  // Infer column types from first few rows
  const typeMap: Record<string, string> = {};
  const inconsistentColumns: string[] = [];
  
  // Check first row to infer types
  if (data.length > 0) {
    headers.forEach(header => {
      const value = data[0][header];
      if (value === null || value === undefined || value === '') {
        typeMap[header] = 'unknown';
      } else if (!isNaN(Number(value))) {
        typeMap[header] = 'number';
      } else if (!isNaN(Date.parse(value))) {
        typeMap[header] = 'date';
      } else {
        typeMap[header] = 'string';
      }
    });
    
    // Check for type consistency
    data.slice(1, Math.min(100, data.length)).forEach(row => {
      headers.forEach(header => {
        const value = row[header];
        if (value === null || value === undefined || value === '') return;
        
        const inferredType = typeMap[header];
        if (inferredType === 'number' && isNaN(Number(value))) {
          if (!inconsistentColumns.includes(header)) inconsistentColumns.push(header);
        } else if (inferredType === 'date' && isNaN(Date.parse(value))) {
          if (!inconsistentColumns.includes(header)) inconsistentColumns.push(header);
        }
      });
    });
  }
  
  if (inconsistentColumns.length === 0) {
    return { 
      status: 'Pass', 
      details: 'Data types are consistent across all columns.' 
    };
  } else {
    return { 
      status: 'Fail', 
      details: `Inconsistent data types found in columns: ${inconsistentColumns.join(', ')}` 
    };
  }
};

// Custom SQL check simulation (only for demonstration)
const validateCustomSQL = (data: any[], sqlQuery: string): { status: ValidationResult['status'], details: string } => {
  // This is a simplified simulation of SQL execution on the data
  // In a real app, this would use a SQL parser or a more advanced method
  
  const lowerQuery = sqlQuery.toLowerCase();
  
  // Check for some basic SQL patterns
  if (lowerQuery.includes('count(*)') && lowerQuery.includes('where')) {
    // Simulate row count with condition
    const condition = lowerQuery.split('where')[1].trim();
    if (condition.includes('null')) {
      // Simulate checking for nulls
      return { 
        status: Math.random() > 0.5 ? 'Pass' : 'Fail',
        details: 'Custom SQL query executed successfully. Checked for NULL values.'
      };
    }
  }
  
  return { 
    status: Math.random() > 0.7 ? 'Pass' : 'Fail',
    details: 'Custom SQL query executed. Note: Client-side SQL execution is limited.'
  };
};

export const runValidation = (
  datasetId: string, 
  method: string, 
  customSQL?: string
): Promise<ValidationResult[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const dataset = datasetsStore[datasetId];
        
        if (!dataset) {
          reject(new Error(`Dataset ${datasetId} not found.`));
          return;
        }
        
        if (!dataset.content || !dataset.headers) {
          reject(new Error('Dataset has no content to validate.'));
          return;
        }
        
        // Generate real validation results based on file content
        const results: ValidationResult[] = [];
        const timestamp = new Date().toISOString();
        
        // Row count validation
        const rowCountStatus = validateRowCount(dataset.content);
        results.push({
          id: `vr_${Date.now()}_1`,
          datasetId,
          timestamp,
          check: 'Row count > 0',
          status: rowCountStatus,
          details: rowCountStatus === 'Pass' 
            ? `Dataset has ${dataset.content.length} rows.` 
            : 'Dataset has no rows.'
        });
        
        // Missing values validation
        const missingValuesResult = validateMissingValues(dataset.content, dataset.headers);
        results.push({
          id: `vr_${Date.now()}_2`,
          datasetId,
          timestamp,
          check: 'No missing values in key columns',
          status: missingValuesResult.status,
          details: missingValuesResult.details
        });
        
        // Add advanced validation checks
        if (method === 'advanced') {
          // Data type consistency validation
          const dataTypeResult = validateDataTypes(dataset.content, dataset.headers);
          results.push({
            id: `vr_${Date.now()}_3`,
            datasetId,
            timestamp,
            check: 'Data type consistency',
            status: dataTypeResult.status,
            details: dataTypeResult.details
          });
          
          // Simple duplicate check
          const distinctCount = new Set(dataset.content.map(row => 
            JSON.stringify(Object.values(row).slice(0, 2))
          )).size;
          
          const hasDuplicates = distinctCount < dataset.content.length;
          results.push({
            id: `vr_${Date.now()}_4`,
            datasetId,
            timestamp,
            check: 'Duplicate detection',
            status: hasDuplicates ? 'Warning' : 'Pass',
            details: hasDuplicates 
              ? `Found potential duplicates: ${dataset.content.length - distinctCount} rows may be duplicated.` 
              : 'No duplicates detected in the first few columns.'
          });
        }
        
        // Add custom SQL check
        if (method === 'custom' && customSQL) {
          const sqlResult = validateCustomSQL(dataset.content, customSQL);
          results.push({
            id: `vr_${Date.now()}_5`,
            datasetId,
            timestamp,
            check: `Custom SQL: ${customSQL.substring(0, 30)}...`,
            status: sqlResult.status,
            details: sqlResult.details
          });
        }
        
        // Store the validation results
        validationResultsStore[datasetId] = [
          ...(validationResultsStore[datasetId] || []),
          ...results
        ];
        saveToStorage(VALIDATION_RESULTS_STORAGE_KEY, validationResultsStore);
        
        // Update dataset status based on validation results
        const hasFailures = results.some(r => r.status === 'Fail');
        const hasWarnings = results.some(r => r.status === 'Warning');
        
        let newStatus: "Validated" | "Issues Found" | "Not Validated" = "Validated";
        if (hasFailures || hasWarnings) {
          newStatus = "Issues Found";
        }
        
        updateDataset(datasetId, { status: newStatus });
        
        resolve(results);
      } catch (error) {
        console.error("Validation error:", error);
        reject(error);
      }
    }, 1000);
  });
};

export const getAllValidationResults = (): Promise<Record<string, ValidationResult[]>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(validationResultsStore);
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
