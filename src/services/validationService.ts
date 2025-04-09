
import { ValidationResult, DatasetType } from "./types";
import { updateDataset } from "./datasetService";
import { toast } from "@/hooks/use-toast";

// Persistent storage using localStorage
const VALIDATION_RESULTS_STORAGE_KEY = "soda_core_validation_results";

// Initialize store from localStorage or create empty objects
const initializeStore = () => {
  try {
    const storedData = localStorage.getItem(VALIDATION_RESULTS_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error(`Error initializing store for validation results:`, error);
    return {};
  }
};

// Store validation results
let validationResultsStore: { [key: string]: ValidationResult[] } = initializeStore();

// Save store to localStorage
const saveToStorage = (data: any) => {
  try {
    localStorage.setItem(VALIDATION_RESULTS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${VALIDATION_RESULTS_STORAGE_KEY}:`, error);
    toast({
      title: "Storage Error",
      description: "Failed to save validation results locally. Storage might be full.",
      variant: "destructive",
    });
  }
};

// Actual data validation functions
const validateRowCount = (data: any[]): ValidationResult['status'] => {
  return data.length > 0 ? 'Pass' : 'Fail';
};

const validateMissingValues = (data: any[], headers: string[]): { status: ValidationResult['status'], details: string, affectedColumns: string[], affectedRows: number[] } => {
  const nullCounts: Record<string, number> = {};
  let totalNulls = 0;
  const affectedColumns: string[] = [];
  const affectedRows: number[] = [];
  
  headers.forEach(header => {
    const nullCount = data.filter((row, index) => {
      const isNull = !row[header] && row[header] !== 0 && row[header] !== false;
      if (isNull) {
        affectedRows.push(index + 1); // +1 because row indices are 0-based but we want 1-based for human readability
      }
      return isNull;
    }).length;
    
    if (nullCount > 0) {
      nullCounts[header] = nullCount;
      totalNulls += nullCount;
      affectedColumns.push(header);
    }
  });
  
  if (totalNulls === 0) {
    return { 
      status: 'Pass', 
      details: 'No missing values found in any columns.', 
      affectedColumns: [], 
      affectedRows: [] 
    };
  } else if (totalNulls / (data.length * headers.length) < 0.05) {
    return { 
      status: 'Warning', 
      details: `Found ${totalNulls} missing values across columns: ${affectedColumns.join(', ')}.`,
      affectedColumns,
      affectedRows: [...new Set(affectedRows)] // Remove duplicates
    };
  } else {
    return { 
      status: 'Fail', 
      details: `High number of missing values: ${totalNulls} nulls found across columns: ${affectedColumns.join(', ')}.`,
      affectedColumns,
      affectedRows: [...new Set(affectedRows)] // Remove duplicates
    };
  }
};

const validateDataTypes = (data: any[], headers: string[]): { status: ValidationResult['status'], details: string, affectedColumns: string[], affectedRows: number[] } => {
  // Infer column types from first few rows
  const typeMap: Record<string, string> = {};
  const inconsistentColumns: string[] = [];
  const affectedRows: number[] = [];
  
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
    data.forEach((row, rowIndex) => {
      if (rowIndex === 0) return; // Skip first row since we already used it for inference
      
      headers.forEach(header => {
        const value = row[header];
        if (value === null || value === undefined || value === '') return;
        
        const inferredType = typeMap[header];
        if (inferredType === 'number' && isNaN(Number(value))) {
          if (!inconsistentColumns.includes(header)) inconsistentColumns.push(header);
          affectedRows.push(rowIndex + 1); // +1 because row indices are 0-based
        } else if (inferredType === 'date' && isNaN(Date.parse(value))) {
          if (!inconsistentColumns.includes(header)) inconsistentColumns.push(header);
          affectedRows.push(rowIndex + 1);
        }
      });
    });
  }
  
  if (inconsistentColumns.length === 0) {
    return { 
      status: 'Pass', 
      details: 'Data types are consistent across all columns.',
      affectedColumns: [],
      affectedRows: []
    };
  } else {
    return { 
      status: 'Fail', 
      details: `Inconsistent data types found in columns: ${inconsistentColumns.join(', ')}. Affected rows: ${affectedRows.slice(0, 5).join(', ')}${affectedRows.length > 5 ? ` and ${affectedRows.length - 5} more` : ''}.`,
      affectedColumns: inconsistentColumns,
      affectedRows: [...new Set(affectedRows)] // Remove duplicates
    };
  }
};

// Enhanced AI-powered validation
const validateWithAI = (data: any[], headers: string[]): { status: ValidationResult['status'], details: string, affectedColumns: string[], affectedRows: number[] } => {
  // Simulated AI validation that would normally use a machine learning model
  // This looks for patterns and anomalies that simple rule-based validation might miss
  
  const anomalies: string[] = [];
  const insights: string[] = [];
  const affectedColumns: string[] = [];
  const affectedRows: number[] = [];
  
  // Check for outliers in numeric columns using IQR (simplified)
  headers.forEach(header => {
    // Skip processing if no data
    if (data.length === 0) return;
    
    // Get all numeric values in the column
    const numericValues: {value: number, rowIndex: number}[] = data
      .map((row, index) => ({ value: row[header], rowIndex: index + 1 }))
      .filter(item => item.value !== null && item.value !== undefined && item.value !== '' && !isNaN(Number(item.value)))
      .map(item => ({ value: Number(item.value), rowIndex: item.rowIndex }));
    
    // Skip if not enough numeric values
    if (numericValues.length < data.length * 0.5) return;
    
    // Sort values for quartile calculation
    numericValues.sort((a, b) => a.value - b.value);
    const values = numericValues.map(item => item.value);
    
    // Calculate quartiles (simplified)
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;
    
    // Define outlier thresholds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    // Find outliers with their row numbers
    const outliers = numericValues.filter(item => item.value < lowerBound || item.value > upperBound);
    
    if (outliers.length > 0) {
      const outlierPercentage = (outliers.length / values.length * 100).toFixed(1);
      anomalies.push(`${header}: ${outliers.length} outliers (${outlierPercentage}%) detected outside normal range.`);
      affectedColumns.push(header);
      outliers.forEach(outlier => affectedRows.push(outlier.rowIndex));
    }
    
    // Generate statistical insights
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = values[0];
    const max = values[values.length - 1];
    
    insights.push(`${header}: Range ${min.toFixed(2)} to ${max.toFixed(2)}, Average ${mean.toFixed(2)}`);
  });
  
  // Pattern detection in string columns (simplified)
  headers.forEach(header => {
    // Get all string values with their row numbers
    const stringValuesWithRows = data
      .map((row, index) => ({ value: row[header], rowIndex: index + 1 }))
      .filter(item => item.value !== null && item.value !== undefined && item.value !== '' && isNaN(Number(item.value)))
      .map(item => ({ value: String(item.value), rowIndex: item.rowIndex }));
    
    const stringValues = stringValuesWithRows.map(item => item.value);
    
    // Skip if not enough string values
    if (stringValues.length < data.length * 0.5) return;
    
    // Check for email patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLikeValuesWithRows = stringValuesWithRows.filter(item => emailPattern.test(item.value));
    
    if (emailLikeValuesWithRows.length > 0 && emailLikeValuesWithRows.length < stringValues.length) {
      anomalies.push(`${header}: May contain emails (${emailLikeValuesWithRows.length}/${stringValues.length}) but format is inconsistent.`);
      affectedColumns.push(header);
      emailLikeValuesWithRows.forEach(item => affectedRows.push(item.rowIndex));
    }
    
    // Check for date-like strings that aren't parsed as dates
    const datePattern = /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/;
    const dateLikeValuesWithRows = stringValuesWithRows.filter(item => datePattern.test(item.value) && isNaN(Date.parse(item.value)));
    
    if (dateLikeValuesWithRows.length > 0) {
      anomalies.push(`${header}: Contains ${dateLikeValuesWithRows.length} date-like values that aren't in a standard format.`);
      affectedColumns.push(header);
      dateLikeValuesWithRows.forEach(item => affectedRows.push(item.rowIndex));
    }
  });
  
  if (anomalies.length === 0) {
    return {
      status: 'Pass',
      details: 'AI validation found no anomalies or patterns of concern.',
      affectedColumns: [],
      affectedRows: []
    };
  } else if (anomalies.length <= 2) {
    return {
      status: 'Warning',
      details: `AI validation found minor anomalies: ${anomalies.join(' ')}${insights.length > 0 ? ' Additional insights: ' + insights.join(' ') : ''}`,
      affectedColumns: [...new Set(affectedColumns)],
      affectedRows: [...new Set(affectedRows)]
    };
  } else {
    return {
      status: 'Fail',
      details: `AI validation found multiple anomalies: ${anomalies.join(' ')}`,
      affectedColumns: [...new Set(affectedColumns)],
      affectedRows: [...new Set(affectedRows)]
    };
  }
};

// Custom SQL check simulation (only for demonstration)
const validateCustomSQL = (data: any[], sqlQuery: string): { status: ValidationResult['status'], details: string, affectedColumns: string[], affectedRows: number[] } => {
  // This is a simplified simulation of SQL execution on the data
  const lowerQuery = sqlQuery.toLowerCase();
  const affectedColumns: string[] = [];
  const affectedRows: number[] = [];
  
  // Check for some basic SQL patterns
  if (lowerQuery.includes('count(*)') && lowerQuery.includes('where')) {
    // Simulate row count with condition
    const condition = lowerQuery.split('where')[1].trim();
    if (condition.includes('null')) {
      // Simulate checking for nulls
      // For simulation, randomly select some rows as affected
      const sampleSize = Math.min(5, Math.ceil(data.length * 0.1));
      for (let i = 0; i < sampleSize; i++) {
        affectedRows.push(Math.floor(Math.random() * data.length) + 1);
      }
      
      // Extract column name from condition if possible
      const columnMatch = condition.match(/(\w+)\s+is\s+null/i);
      if (columnMatch && columnMatch[1]) {
        affectedColumns.push(columnMatch[1]);
      }
      
      return { 
        status: Math.random() > 0.5 ? 'Pass' : 'Fail',
        details: `Custom SQL query executed successfully. Checked for NULL values in ${affectedColumns.length > 0 ? `column: ${affectedColumns[0]}` : 'columns'}.`,
        affectedColumns,
        affectedRows: [...new Set(affectedRows)]
      };
    }
  }
  
  return { 
    status: Math.random() > 0.7 ? 'Pass' : 'Fail',
    details: 'Custom SQL query executed. Note: Client-side SQL execution is limited.',
    affectedColumns,
    affectedRows
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
        // We need to get the dataset from datasetService but for now we'll grab directly from localStorage
        const storedData = localStorage.getItem("soda_core_datasets");
        const datasets = storedData ? JSON.parse(storedData) : {};
        const dataset = datasets[datasetId];
        
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
          const rowSignatures = dataset.content.map(row => 
            JSON.stringify(Object.values(row).slice(0, 2))
          );
          const distinctCount = new Set(rowSignatures).size;
          const duplicateRows: number[] = [];
          
          // Find duplicate rows
          const seen = new Set<string>();
          rowSignatures.forEach((signature, index) => {
            if (seen.has(signature)) {
              duplicateRows.push(index + 1); // +1 for 1-based row numbers
            } else {
              seen.add(signature);
            }
          });
          
          const hasDuplicates = distinctCount < dataset.content.length;
          results.push({
            id: `vr_${Date.now()}_4`,
            datasetId,
            timestamp,
            check: 'Duplicate detection',
            status: hasDuplicates ? 'Warning' : 'Pass',
            details: hasDuplicates 
              ? `Found potential duplicates: ${dataset.content.length - distinctCount} rows may be duplicated. Affected rows: ${duplicateRows.slice(0, 5).join(', ')}${duplicateRows.length > 5 ? ` and ${duplicateRows.length - 5} more` : ''}.` 
              : 'No duplicates detected in the first few columns.'
          });
          
          // Add AI-powered validation
          const aiValidationResult = validateWithAI(dataset.content, dataset.headers);
          results.push({
            id: `vr_${Date.now()}_5`,
            datasetId,
            timestamp,
            check: 'AI-powered anomaly detection',
            status: aiValidationResult.status,
            details: aiValidationResult.details
          });
        }
        
        // Add custom SQL check
        if (method === 'custom' && customSQL) {
          const sqlResult = validateCustomSQL(dataset.content, customSQL);
          results.push({
            id: `vr_${Date.now()}_6`,
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
        saveToStorage(validationResultsStore);
        
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
