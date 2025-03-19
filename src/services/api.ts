// API service for handling file uploads and data validation

export type DatasetType = {
  id: string;
  name: string;
  type: string;
  size: string;
  lastUpdated: string;
  status: 'Validated' | 'Not Validated' | 'Issues Found';
  path?: string;
};

export type ValidationResult = {
  id: number;
  check: string;
  status: 'Pass' | 'Fail' | 'Warning';
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
    name: string;
    type: string;
    matches: boolean;
    differences: number;
  }[];
  differences: {
    id: number;
    key: string;
    column: string;
    sourceValue: string;
    targetValue: string;
  }[];
  missing: {
    id: number;
    key: string;
    location: 'source' | 'target';
    columns: Record<string, string>;
  }[];
};

// Mock datasets storage (in a real app, this would be in a database)
let datasetsStore: DatasetType[] = [];
let validationResultsStore: Record<string, ValidationResult[]> = {};
let comparisonResultsStore: Record<string, Record<string, ComparisonResultType>> = {};
let nextId = 1;

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Get file type from extension
const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return 'Unknown';
  
  switch (extension) {
    case 'csv':
      return 'CSV';
    case 'xls':
    case 'xlsx':
      return 'Excel';
    case 'json':
      return 'JSON';
    case 'txt':
      return 'Text';
    default:
      return extension.toUpperCase();
  }
};

// Helper to read file content for validation
const readFileContent = async (file: File): Promise<string[][]> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        resolve([]);
        return;
      }
      
      const content = event.target.result as string;
      // Basic CSV parsing (in a real app, use a proper CSV parser)
      const rows = content.split('\n').map(row => row.split(','));
      resolve(rows);
    };
    reader.readAsText(file);
  });
};

// Upload file API
export const uploadDataset = async (file: File): Promise<DatasetType> => {
  console.log('Uploading file:', file.name);
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(async () => {
      // Create a new dataset object
      const newDataset: DatasetType = {
        id: String(nextId++),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'Not Validated',
        path: URL.createObjectURL(file) // Create a blob URL for the file
      };
      
      // Add to store
      datasetsStore.push(newDataset);
      
      resolve(newDataset);
    }, 1000); // Simulate network delay
  });
};

// Get all datasets API
export const getDatasets = async (): Promise<DatasetType[]> => {
  console.log('Fetching datasets');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...datasetsStore]);
    }, 500);
  });
};

// Get validation results for all datasets
export const getAllValidationResults = async (): Promise<Record<string, ValidationResult[]>> => {
  console.log('Fetching all validation results');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({...validationResultsStore});
    }, 500);
  });
};

// Run Soda Core validation API with support for different validation methods
export const runValidation = async (datasetId: string, method: string = 'basic', customSQL?: string): Promise<ValidationResult[]> => {
  console.log('Running validation for dataset ID:', datasetId, 'Method:', method);
  
  // Find the dataset
  const dataset = datasetsStore.find(ds => ds.id === datasetId);
  
  if (!dataset) {
    throw new Error('Dataset not found');
  }
  
  if (!dataset.path) {
    throw new Error('Dataset file not found');
  }
  
  // Fetch the file for validation
  return new Promise(async (resolve) => {
    try {
      // In a real app, you would call the Soda Core API here
      // For this demo, we'll do some basic file-based validation
      
      const response = await fetch(dataset.path);
      const fileBlob = await response.blob();
      const file = new File([fileBlob], dataset.name, { type: fileBlob.type });
      
      // Perform "validation" on the file content
      let rows: string[][] = [];
      
      if (dataset.type === 'CSV' || dataset.type === 'Text') {
        rows = await readFileContent(file);
      }
      
      // Generate validation results based on actual file content
      const results: ValidationResult[] = [];
      const timestamp = new Date().toISOString();
      
      // Basic validations (for any validation type)
      results.push({
        id: 1,
        check: "Row Count Check",
        status: "Pass",
        details: rows.length > 1 ? `Table has ${rows.length} rows` : `File size: ${dataset.size}`,
        timestamp
      });
      
      if (rows.length > 0) {
        // Headers check (for CSV/text files)
        const headers = rows[0];
        results.push({
          id: 2,
          check: "Column Names Check",
          status: "Pass",
          details: `Found ${headers.length} columns: ${headers.slice(0, 3).join(', ')}${headers.length > 3 ? '...' : ''}`,
          timestamp
        });
        
        // Check for null values in the first column
        const nullValues = rows.slice(1).filter(row => !row[0] || row[0].trim() === '').length;
        results.push({
          id: 3,
          check: "Null Values Check",
          status: nullValues > 0 ? "Warning" : "Pass",
          details: nullValues > 0 
            ? `Found ${nullValues} null values in first column` 
            : "No null values found in first column",
          timestamp
        });
        
        // Data type consistency in the second column (if it exists)
        if (headers.length > 1) {
          const secondColValues = rows.slice(1).map(row => row[1]);
          const allNumbers = secondColValues.every(val => !isNaN(Number(val)));
          
          results.push({
            id: 4,
            check: "Data Type Validation",
            status: allNumbers ? "Pass" : "Warning",
            details: allNumbers 
              ? `Column '${headers[1]}' contains consistent numeric values` 
              : `Column '${headers[1]}' contains mixed data types`,
            timestamp
          });
        }
        
        // Duplicate check in the first column
        const uniqueValues = new Set(rows.slice(1).map(row => row[0]));
        const duplicates = rows.length - 1 - uniqueValues.size;
        
        results.push({
          id: 5,
          check: "Duplicate Check",
          status: duplicates > 0 ? "Fail" : "Pass",
          details: duplicates > 0 
            ? `Found ${duplicates} duplicate values in first column` 
            : "No duplicates found in first column",
          timestamp
        });
        
        // Add advanced validation checks if requested
        if (method === 'advanced') {
          // Schema validation - check if all rows have the same number of columns
          const rowLengths = rows.map(row => row.length);
          const allSameLength = rowLengths.every(len => len === rowLengths[0]);
          
          results.push({
            id: 6,
            check: "Schema Consistency Check",
            status: allSameLength ? "Pass" : "Fail",
            details: allSameLength 
              ? "All rows have consistent column count" 
              : "Inconsistent column counts detected across rows",
            timestamp
          });
          
          // Check for patterns in string columns (e.g., email format)
          if (headers.includes("email") || headers.some(h => h.toLowerCase().includes("email"))) {
            const emailColIndex = headers.findIndex(h => h.toLowerCase().includes("email"));
            if (emailColIndex >= 0) {
              const emailValues = rows.slice(1).map(row => row[emailColIndex]);
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              const invalidEmails = emailValues.filter(email => email && !emailRegex.test(email)).length;
              
              results.push({
                id: 7,
                check: "Email Format Validation",
                status: invalidEmails > 0 ? "Warning" : "Pass",
                details: invalidEmails > 0 
                  ? `Found ${invalidEmails} invalid email formats` 
                  : "All email addresses have valid format",
                timestamp
              });
            }
          }
          
          // Value range check for numeric columns
          const numericColumns = headers.map((header, index) => {
            const values = rows.slice(1).map(row => row[index]);
            const allNumeric = values.every(val => !isNaN(Number(val)));
            return { header, index, allNumeric };
          }).filter(col => col.allNumeric);
          
          if (numericColumns.length > 0) {
            const numericCol = numericColumns[0];
            const values = rows.slice(1).map(row => Number(row[numericCol.index]));
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            results.push({
              id: 8,
              check: "Numeric Range Analysis",
              status: "Pass",
              details: `Column '${numericCol.header}' has values ranging from ${min} to ${max}`,
              timestamp
            });
          }
        }
        
        // Custom SQL validation if requested
        if (method === 'custom' && customSQL) {
          try {
            // In a real app, this would execute the SQL against the data
            // Here we'll simulate a SQL result
            results.push({
              id: 9,
              check: "Custom SQL Check",
              status: "Pass",
              details: `SQL query executed: "${customSQL.substring(0, 30)}${customSQL.length > 30 ? '...' : ''}"`,
              timestamp
            });
            
            // Add a random validation result to simulate SQL execution
            const randomStatus = Math.random() > 0.7 ? "Fail" : (Math.random() > 0.5 ? "Warning" : "Pass");
            results.push({
              id: 10,
              check: "SQL Result Validation",
              status: randomStatus,
              details: randomStatus === "Pass" 
                ? "Query results match expected values" 
                : "Query results do not match expected values",
              timestamp
            });
          } catch (error) {
            results.push({
              id: 9,
              check: "Custom SQL Check",
              status: "Fail",
              details: `Failed to execute SQL: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp
            });
          }
        }
      }
      
      // Update dataset status based on validation results
      const hasFailure = results.some(r => r.status === 'Fail');
      const hasWarning = results.some(r => r.status === 'Warning');
      
      dataset.status = hasFailure 
        ? 'Issues Found' 
        : (hasWarning ? 'Issues Found' : 'Validated');
      
      // Update last validated date
      dataset.lastUpdated = new Date().toISOString().split('T')[0];
      
      // Store validation results
      validationResultsStore[datasetId] = results;
      
      resolve(results);
    } catch (error) {
      console.error('Error during validation:', error);
      const errorResult: ValidationResult[] = [{
        id: 1,
        check: "Validation Error",
        status: "Fail",
        details: `Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }];
      
      // Update dataset status
      dataset.status = 'Issues Found';
      
      // Store validation results
      validationResultsStore[datasetId] = errorResult;
      
      resolve(errorResult);
    }
  });
};

// Compare two datasets
export const compareDatasets = async (sourceId: string, targetId: string, options: any = {}): Promise<ComparisonResultType> => {
  console.log('Comparing datasets:', sourceId, 'and', targetId);
  
  // Find the datasets
  const sourceDataset = datasetsStore.find(ds => ds.id === sourceId);
  const targetDataset = datasetsStore.find(ds => ds.id === targetId);
  
  if (!sourceDataset || !targetDataset) {
    throw new Error('One or both datasets not found');
  }
  
  if (!sourceDataset.path || !targetDataset.path) {
    throw new Error('Dataset file not found');
  }
  
  // Check if we already have a cached comparison result
  const cachedKey = `${sourceId}-${targetId}`;
  if (comparisonResultsStore[cachedKey]) {
    return comparisonResultsStore[cachedKey];
  }
  
  return new Promise(async (resolve) => {
    try {
      // Fetch both files
      const [sourceResponse, targetResponse] = await Promise.all([
        fetch(sourceDataset.path),
        fetch(targetDataset.path)
      ]);
      
      const [sourceBlob, targetBlob] = await Promise.all([
        sourceResponse.blob(),
        targetResponse.blob()
      ]);
      
      const sourceFile = new File([sourceBlob], sourceDataset.name, { type: sourceBlob.type });
      const targetFile = new File([targetBlob], targetDataset.name, { type: targetBlob.type });
      
      // Read file contents for comparison
      const [sourceRows, targetRows] = await Promise.all([
        readFileContent(sourceFile),
        readFileContent(targetFile)
      ]);
      
      // Process the actual comparison
      // This is a simplified comparison for demonstration purposes
      
      // Analyze headers
      const sourceHeaders = sourceRows[0] || [];
      const targetHeaders = targetRows[0] || [];
      
      // Find column differences
      const allHeaders = [...new Set([...sourceHeaders, ...targetHeaders])];
      const columnComparisons = allHeaders.map(header => {
        const sourceIndex = sourceHeaders.indexOf(header);
        const targetIndex = targetHeaders.indexOf(header);
        
        const inBoth = sourceIndex >= 0 && targetIndex >= 0;
        
        // If the column exists in both, compare values
        let differences = 0;
        
        if (inBoth) {
          // Compare values for this column across all rows
          const sourceValues = sourceRows.slice(1).map(row => row[sourceIndex]);
          const targetValues = targetRows.slice(1).map(row => row[targetIndex]);
          
          // Use the shorter length for comparison
          const minLength = Math.min(sourceValues.length, targetValues.length);
          
          for (let i = 0; i < minLength; i++) {
            if (sourceValues[i] !== targetValues[i]) {
              differences++;
            }
          }
        }
        
        return {
          name: header,
          type: sourceIndex >= 0 ? 'string' : 'string', // We'd detect actual types in a real implementation
          matches: inBoth && differences === 0,
          differences: differences
        };
      });
      
      // For row comparison, we'll use the first column as a key
      // In a real implementation, we'd use a primary key or defined key columns
      const keyColumnIndex = 0;
      
      // Extract keys from both datasets
      const sourceKeys = sourceRows.slice(1).map(row => row[keyColumnIndex]);
      const targetKeys = targetRows.slice(1).map(row => row[keyColumnIndex]);
      
      // Find common keys
      const commonKeys = sourceKeys.filter(key => targetKeys.includes(key));
      const missingInSource = targetKeys.filter(key => !sourceKeys.includes(key));
      const missingInTarget = sourceKeys.filter(key => !targetKeys.includes(key));
      
      // Compare rows with common keys
      const differences = [];
      let diffId = 1;
      
      for (const key of commonKeys) {
        const sourceRowIndex = sourceKeys.indexOf(key) + 1; // +1 because we skipped headers
        const targetRowIndex = targetKeys.indexOf(key) + 1;
        
        const sourceRow = sourceRows[sourceRowIndex];
        const targetRow = targetRows[targetRowIndex];
        
        // Compare all columns in this row
        for (let i = 0; i < Math.min(sourceRow.length, targetRow.length); i++) {
          if (sourceRow[i] !== targetRow[i] && i !== keyColumnIndex) {
            differences.push({
              id: diffId++,
              key,
              column: sourceHeaders[i] || `Column ${i}`,
              sourceValue: sourceRow[i],
              targetValue: targetRow[i]
            });
          }
        }
      }
      
      // Create missing rows entries
      const missing = [];
      let missingId = 1;
      
      for (const key of missingInSource) {
        const targetRowIndex = targetKeys.indexOf(key) + 1;
        const targetRow = targetRows[targetRowIndex];
        
        const rowData: Record<string, string> = {};
        targetHeaders.forEach((header, i) => {
          rowData[header] = targetRow[i];
        });
        
        missing.push({
          id: missingId++,
          key,
          location: 'source',
          columns: rowData
        });
      }
      
      for (const key of missingInTarget) {
        const sourceRowIndex = sourceKeys.indexOf(key) + 1;
        const sourceRow = sourceRows[sourceRowIndex];
        
        const rowData: Record<string, string> = {};
        sourceHeaders.forEach((header, i) => {
          rowData[header] = sourceRow[i];
        });
        
        missing.push({
          id: missingId++,
          key,
          location: 'target',
          columns: rowData
        });
      }
      
      // Calculate summary
      const result: ComparisonResultType = {
        summary: {
          rowsAnalyzed: Math.max(sourceRows.length, targetRows.length) - 1, // Exclude headers
          rowsMatched: commonKeys.length - differences.length,
          rowsDifferent: differences.length,
          rowsMissingSource: missingInSource.length,
          rowsMissingTarget: missingInTarget.length,
          columnsCompared: allHeaders.length,
          columnsDifferent: columnComparisons.filter(c => !c.matches).length,
          executionTime: `${(Math.random() * 5 + 1).toFixed(1)} seconds`
        },
        columns: columnComparisons,
        differences,
        missing
      };
      
      // Cache the result
      comparisonResultsStore[cachedKey] = result;
      
      resolve(result);
    } catch (error) {
      console.error('Error during comparison:', error);
      
      // Return a fallback empty result
      const result: ComparisonResultType = {
        summary: {
          rowsAnalyzed: 0,
          rowsMatched: 0,
          rowsDifferent: 0,
          rowsMissingSource: 0,
          rowsMissingTarget: 0,
          columnsCompared: 0,
          columnsDifferent: 0,
          executionTime: '0.0 seconds'
        },
        columns: [],
        differences: [],
        missing: []
      };
      
      resolve(result);
    }
  });
};
