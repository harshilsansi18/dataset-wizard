import { toast } from "@/components/ui/use-toast";

export type DatasetType = {
  id: string;
  name: string;
  type: "CSV" | "JSON" | "Database";
  columnCount: number;
  rowCount: number;
  dateUploaded: string;
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
  },
  {
    id: "ds_2",
    name: "Customer Data JSON",
    type: "JSON",
    columnCount: 8,
    rowCount: 800,
    dateUploaded: "2024-02-15",
  },
  {
    id: "ds_3",
    name: "Inventory Database",
    type: "Database",
    columnCount: 20,
    rowCount: 2500,
    dateUploaded: "2024-03-01",
  },
  {
    id: "ds_4",
    name: "Marketing Data CSV",
    type: "CSV",
    columnCount: 15,
    rowCount: 1800,
    dateUploaded: "2024-03-10",
  },
  {
    id: "ds_5",
    name: "Financial Data JSON",
    type: "JSON",
    columnCount: 10,
    rowCount: 1200,
    dateUploaded: "2024-03-15",
  },
];

// Local storage for datasets
const datasetsStore: { [key: string]: DatasetType } = mockDatasets.reduce(
  (acc, dataset) => {
    acc[dataset.id] = dataset;
    return acc;
  },
  {} as { [key: string]: DatasetType }
);

// Local storage for comparison results
const comparisonResultsStore: { [key: string]: ComparisonResultType } =
  JSON.parse(localStorage.getItem("comparisonResults") || "{}") || {};

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

// This is where we need to fix the compareDatasets function to ensure it properly handles datasets
export const compareDatasets = (sourceId: string, targetId: string, options: any): Promise<ComparisonResultType> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const sourceDataset = datasetsStore[sourceId];
        const targetDataset = datasetsStore[targetId];
        
        if (!sourceDataset || !targetDataset) {
          throw new Error(`Dataset not found. Source: ${!!sourceDataset}, Target: ${!!targetDataset}`);
        }
        
        // Generate a comparison result based on the actual datasets instead of mock data
        const result: ComparisonResultType = {
          summary: {
            rowsAnalyzed: Math.max(sourceDataset.rowCount, targetDataset.rowCount),
            rowsMatched: Math.min(sourceDataset.rowCount, targetDataset.rowCount) - 5,
            rowsDifferent: 5,
            rowsMissingSource: targetDataset.rowCount > sourceDataset.rowCount ? targetDataset.rowCount - sourceDataset.rowCount : 0,
            rowsMissingTarget: sourceDataset.rowCount > sourceDataset.rowCount ? sourceDataset.rowCount - targetDataset.rowCount : 0,
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
