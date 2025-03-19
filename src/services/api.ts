
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

// Upload file API
export const uploadDataset = async (file: File): Promise<DatasetType> => {
  // In a real app, you would upload to a server/cloud storage
  console.log('Uploading file:', file.name);
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
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
  // In a real app, you would fetch from a server
  console.log('Fetching datasets');
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...datasetsStore]);
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
  
  // Simulate Soda Core validation
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate validation results based on dataset type
      const results: ValidationResult[] = [];
      
      // Basic checks for all types
      results.push({
        id: 1,
        check: "Row Count Check",
        status: "Pass",
        details: "Table has 1,254 rows",
        timestamp: new Date().toISOString()
      });
      
      results.push({
        id: 2,
        check: "Null Values Check",
        status: Math.random() > 0.5 ? "Pass" : "Warning",
        details: Math.random() > 0.5 
          ? "No null values found in required columns" 
          : "Found 15 null values in 'email' column",
        timestamp: new Date().toISOString()
      });
      
      // Type-specific checks
      if (dataset.type === 'CSV' || dataset.type === 'Excel') {
        results.push({
          id: 3,
          check: "Column Names Check",
          status: "Pass",
          details: "All required columns are present",
          timestamp: new Date().toISOString()
        });
        
        results.push({
          id: 4,
          check: "Data Type Validation",
          status: Math.random() > 0.7 ? "Pass" : "Fail",
          details: Math.random() > 0.7 
            ? "All data types match schema definition" 
            : "Column 'age' contains non-numeric values",
          timestamp: new Date().toISOString()
        });
      }
      
      if (dataset.type === 'Excel') {
        results.push({
          id: 5,
          check: "Sheet Structure",
          status: "Pass",
          details: "All sheets follow the expected structure",
          timestamp: new Date().toISOString()
        });
      }
      
      // Update dataset status based on validation results
      const hasFailure = results.some(r => r.status === 'Fail');
      const hasWarning = results.some(r => r.status === 'Warning');
      
      dataset.status = hasFailure 
        ? 'Issues Found' 
        : (hasWarning ? 'Issues Found' : 'Validated');
      
      resolve(results);
    }, 2000);
  });
};
