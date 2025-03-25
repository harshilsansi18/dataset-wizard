
import { toast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import { DatasetType } from "./types";

// Persistent storage using localStorage
const DATASETS_STORAGE_KEY = "soda_core_datasets";

// Initialize store from localStorage or create empty objects
const initializeStore = () => {
  try {
    const storedData = localStorage.getItem(DATASETS_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error(`Error initializing store for datasets:`, error);
    return {};
  }
};

// Store datasets
let datasetsStore: { [key: string]: DatasetType } = initializeStore();

// Save store to localStorage
const saveToStorage = (data: any) => {
  try {
    localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${DATASETS_STORAGE_KEY}:`, error);
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
      saveToStorage(datasetsStore);
      
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
      saveToStorage(datasetsStore);
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
        saveToStorage(datasetsStore);
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
        saveToStorage(datasetsStore);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 500);
  });
};

// Helper functions for dataset management
export function determineFileType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'CSV';
  if (extension === 'json') return 'JSON';
  if (['xlsx', 'xls'].includes(extension || '')) return 'Excel';
  return 'CSV'; // Default
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
