
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

// Mock datasets storage (in a real app, this would be in a database)
let datasetsStore: DatasetType[] = [];
let validationResultsStore: Record<string, ValidationResult[]> = {};
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

// Run Soda Core validation API
export const runValidation = async (datasetId: string): Promise<ValidationResult[]> => {
  console.log('Running validation for dataset ID:', datasetId);
  
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
      
      // Basic row count check (works for any file)
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
      }
      
      // Update dataset status based on validation results
      const hasFailure = results.some(r => r.status === 'Fail');
      const hasWarning = results.some(r => r.status === 'Warning');
      
      dataset.status = hasFailure 
        ? 'Issues Found' 
        : (hasWarning ? 'Issues Found' : 'Validated');
      
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
