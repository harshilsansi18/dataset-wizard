
import { DatasetType, ComparisonResultType } from './types';

// Persistent storage using localStorage
const COMPARISON_RESULTS_STORAGE_KEY = "soda_core_comparison_results";

// Initialize comparison results store
const initializeComparisonStore = () => {
  try {
    const storedData = localStorage.getItem(COMPARISON_RESULTS_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error(`Error initializing store for comparison results:`, error);
    return {};
  }
};

// Store comparison results
let comparisonResultsStore: { [key: string]: ComparisonResultType } = initializeComparisonStore();

// Save comparison results to localStorage
const saveComparisonToStorage = (data: any) => {
  try {
    localStorage.setItem(COMPARISON_RESULTS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${COMPARISON_RESULTS_STORAGE_KEY}:`, error);
  }
};

// Main function to compare two datasets
export const compareDatasets = (source: DatasetType, target: DatasetType): ComparisonResultType => {
  const startTime = performance.now();
  
  // Extract headers from both datasets
  const sourceHeaders = source.headers || [];
  const targetHeaders = target.headers || [];
  
  // Find common headers
  const commonHeaders = sourceHeaders.filter(header => targetHeaders.includes(header));
  
  // Initialize comparison data structures
  const differences: ComparisonResultType['differences'] = [];
  const missingRows: ComparisonResultType['missing'] = [];
  const columnComparisonMap = new Map<string, { matches: boolean, differences: number }>();
  
  // Initialize column comparison state
  commonHeaders.forEach(header => {
    columnComparisonMap.set(header, { matches: true, differences: 0 });
  });
  
  // Create maps of data for efficient lookup
  const sourceDataMap = new Map();
  const targetDataMap = new Map();
  
  // Use the first column as a key by default, or "id" if it exists
  const keyColumn = sourceHeaders.includes('id') ? 'id' : sourceHeaders[0];
  
  // Map source data for lookup
  source.content?.forEach(row => {
    const key = String(row[keyColumn]);
    sourceDataMap.set(key, row);
  });
  
  // Map target data and find differences
  target.content?.forEach(row => {
    const key = String(row[keyColumn]);
    targetDataMap.set(key, row);
    
    // Check if this row exists in source
    if (sourceDataMap.has(key)) {
      const sourceRow = sourceDataMap.get(key);
      
      // Compare common fields
      commonHeaders.forEach(header => {
        const sourceValue = sourceRow[header];
        const targetValue = row[header];
        
        // If values don't match, record the difference
        if (String(sourceValue) !== String(targetValue)) {
          differences.push({
            id: `diff_${key}_${header}`,
            key,
            column: header,
            sourceValue: String(sourceValue),
            targetValue: String(targetValue)
          });
          
          // Update column comparison stats
          const colStats = columnComparisonMap.get(header);
          if (colStats) {
            colStats.matches = false;
            colStats.differences += 1;
            columnComparisonMap.set(header, colStats);
          }
        }
      });
    } else {
      // Row exists in target but not in source
      missingRows.push({
        id: `missing_src_${key}`,
        key,
        location: 'source',
        columns: row
      });
    }
  });
  
  // Find rows in source that don't exist in target
  source.content?.forEach(row => {
    const key = String(row[keyColumn]);
    if (!targetDataMap.has(key)) {
      missingRows.push({
        id: `missing_tgt_${key}`,
        key,
        location: 'target',
        columns: row
      });
    }
  });
  
  // Create column comparison results
  const columnResults = Array.from(columnComparisonMap.entries()).map(([name, stats], index) => ({
    id: `col_${index}`,
    name,
    type: typeof source.content?.[0]?.[name] === 'number' ? 'number' : 'string',
    matches: stats.matches,
    differences: stats.differences
  }));
  
  // Add columns that exist only in source or target
  sourceHeaders
    .filter(header => !targetHeaders.includes(header))
    .forEach((header, index) => {
      columnResults.push({
        id: `col_src_only_${index}`,
        name: header,
        type: typeof source.content?.[0]?.[header] === 'number' ? 'number' : 'string',
        matches: false,
        differences: source.content?.length || 0
      });
    });
  
  targetHeaders
    .filter(header => !sourceHeaders.includes(header))
    .forEach((header, index) => {
      columnResults.push({
        id: `col_tgt_only_${index}`,
        name: header,
        type: typeof target.content?.[0]?.[header] === 'number' ? 'number' : 'string',
        matches: false,
        differences: target.content?.length || 0
      });
    });
  
  const endTime = performance.now();
  const executionTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;
  
  // Create summary
  const summary = {
    rowsAnalyzed: (source.content?.length || 0) + (target.content?.length || 0),
    rowsMatched: ((source.content?.length || 0) + (target.content?.length || 0) - missingRows.length - differences.length),
    rowsDifferent: new Set(differences.map(d => d.key)).size,
    rowsMissingSource: missingRows.filter(m => m.location === 'source').length,
    rowsMissingTarget: missingRows.filter(m => m.location === 'target').length,
    columnsCompared: commonHeaders.length,
    columnsDifferent: columnResults.filter(col => !col.matches).length,
    executionTime
  };
  
  return {
    summary,
    columns: columnResults,
    differences,
    missing: missingRows
  };
};

// Function to compare datasets with API-like interface
export const compareDatasetsByIds = (sourceId: string, targetId: string, options: any = {}): Promise<ComparisonResultType> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Get datasets from localStorage
        const storedData = localStorage.getItem("soda_core_datasets");
        const datasets = storedData ? JSON.parse(storedData) : {};
        
        const sourceDataset = datasets[sourceId];
        const targetDataset = datasets[targetId];
        
        if (!sourceDataset || !targetDataset) {
          throw new Error(`Dataset not found. Source: ${!!sourceDataset}, Target: ${!!targetDataset}`);
        }
        
        if (!sourceDataset.content || !targetDataset.content) {
          throw new Error('One or both datasets have no content to compare');
        }
        
        // Use the internal compareDatasets function
        const result = compareDatasets(sourceDataset, targetDataset);
        
        // Store the result for future reference
        const comparisonId = `comp_${Date.now()}`;
        comparisonResultsStore[comparisonId] = result;
        saveComparisonToStorage(comparisonResultsStore);
        
        resolve(result);
      } catch (error) {
        console.error("Comparison error:", error);
        reject(error);
      }
    }, 1000);
  });
};
