import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { DatasetType } from "./types";
import { getImportedDatasets } from "./databaseService";

// Persistent storage using localStorage
const DATASETS_STORAGE_KEY = "soda_core_datasets";
// Add a separate storage key for public datasets
const PUBLIC_DATASETS_STORAGE_KEY = "soda_core_public_datasets";

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

// Initialize public datasets store
const initializePublicStore = () => {
  try {
    const storedData = localStorage.getItem(PUBLIC_DATASETS_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error(`Error initializing store for public datasets:`, error);
    return {};
  }
};

// Store datasets
let datasetsStore: { [key: string]: DatasetType } = initializeStore();
// Store for public datasets (shared across users)
let publicDatasetsStore: { [key: string]: DatasetType } = initializePublicStore();

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

// Save public datasets to localStorage
const savePublicToStorage = (data: any) => {
  try {
    localStorage.setItem(PUBLIC_DATASETS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${PUBLIC_DATASETS_STORAGE_KEY}:`, error);
    toast({
      title: "Storage Error",
      description: "Failed to save public data. Your browser storage might be full.",
      variant: "destructive",
    });
  }
};

// API functions
export const getDatasets = (): Promise<DatasetType[]> => {
  return new Promise((resolve) => {
    // Combine file-based datasets with database-imported datasets
    const dbDatasets = getImportedDatasets();
    console.log("File datasets:", Object.values(datasetsStore).length);
    console.log("Database datasets:", dbDatasets.length);
    
    const allDatasets = [...Object.values(datasetsStore), ...dbDatasets];
    
    // Remove duplicates by ID
    const uniqueDatasets = allDatasets.filter((dataset, index, self) => 
      index === self.findIndex((d) => d.id === dataset.id)
    );
    
    resolve(uniqueDatasets);
  });
};

// Get public datasets only - now fetches from both local and public storage
export const getPublicDatasets = (): Promise<DatasetType[]> => {
  return new Promise((resolve) => {
    // Get all public datasets from the public store
    const publicDatasets = Object.values(publicDatasetsStore);
    
    // Get all datasets and filter for public ones in the user's own store
    getDatasets().then(datasets => {
      // Get only public datasets from user's personal store
      const userPublicDatasets = datasets.filter(dataset => dataset.isPublic === true);
      
      // Combine all public datasets
      const allPublicDatasets = [...publicDatasets, ...userPublicDatasets];
      
      // Remove duplicates
      const uniquePublicDatasets = allPublicDatasets.filter((dataset, index, self) => 
        index === self.findIndex((d) => d.id === dataset.id)
      );
      
      resolve(uniquePublicDatasets);
    });
  });
};

// Toggle dataset public status
export const toggleDatasetPublicStatus = (id: string, isPublic: boolean): Promise<DatasetType | undefined> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if dataset exists in user's own store
      if (datasetsStore[id]) {
        // Update the dataset in the user's store
        datasetsStore[id] = {
          ...datasetsStore[id],
          isPublic,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        saveToStorage(datasetsStore);
        
        // If making it public, also add to the public store
        if (isPublic) {
          publicDatasetsStore[id] = datasetsStore[id];
          savePublicToStorage(publicDatasetsStore);
        } else {
          // If making it private, remove from public store
          if (publicDatasetsStore[id]) {
            delete publicDatasetsStore[id];
            savePublicToStorage(publicDatasetsStore);
          }
        }
        
        resolve(datasetsStore[id]);
      } else {
        // If the dataset doesn't exist in the user's store, check the public store
        const dbDatasets = getImportedDatasets();
        const dbDataset = dbDatasets.find(ds => ds.id === id);
        
        if (dbDataset) {
          // Update the database dataset's public status
          dbDataset.isPublic = isPublic;
          
          // If making public, add to public store
          if (isPublic) {
            publicDatasetsStore[id] = dbDataset;
            savePublicToStorage(publicDatasetsStore);
          } else {
            // If making private, remove from public store
            if (publicDatasetsStore[id]) {
              delete publicDatasetsStore[id];
              savePublicToStorage(publicDatasetsStore);
            }
          }
          
          resolve(dbDataset);
        } else {
          // Dataset not found
          reject(new Error("Dataset not found"));
        }
      }
    }, 500);
  });
};

export const getDatasetById = (id: string): Promise<DatasetType | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check in file-based datasets
      if (datasetsStore[id]) {
        resolve(datasetsStore[id]);
        return;
      }
      
      // Check in database-imported datasets
      const dbDatasets = getImportedDatasets();
      const dbDataset = dbDatasets.find(ds => ds.id === id);
      
      resolve(dbDataset);
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
      
      // Process the file content
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
        headers,
        source: {
          type: "file",
          fileName: file.name
        },
        isPublic: false // Default to not public
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

export const downloadDataset = (dataset: DatasetType): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      if (!dataset.content) {
        throw new Error("Dataset has no content to download");
      }

      let content: string;
      let fileExtension: string;
      let mimeType: string;

      // Format the content based on dataset type
      if (dataset.type === "CSV") {
        content = Papa.unparse(dataset.content);
        fileExtension = "csv";
        mimeType = "text/csv";
      } else if (dataset.type === "JSON") {
        content = JSON.stringify(dataset.content, null, 2);
        fileExtension = "json";
        mimeType = "application/json";
      } else if (dataset.type === "Database") {
        // For database connections, export as JSON
        content = JSON.stringify(dataset.content || [], null, 2);
        fileExtension = "json";
        mimeType = "application/json";
      } else {
        // Default to JSON if type is unknown
        content = JSON.stringify(dataset.content, null, 2);
        fileExtension = "json";
        mimeType = "application/json";
      }

      // Create file name based on dataset name
      const fileName = dataset.name.includes(`.${fileExtension}`) 
        ? dataset.name 
        : `${dataset.name}.${fileExtension}`;

      // Create a blob with the content
      const blob = new Blob([content], { type: mimeType });
      
      // Create a download link and trigger click
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      resolve(true);
    } catch (error) {
      console.error("Download error:", error);
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
        lastUpdated: new Date().toISOString().split('T')[0],
        isPublic: dataset.isPublic || false
      };
      
      datasetsStore[id] = newDataset;
      saveToStorage(datasetsStore);
      
      // If dataset is public, also add to public store
      if (newDataset.isPublic) {
        publicDatasetsStore[id] = newDataset;
        savePublicToStorage(publicDatasetsStore);
      }
      
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
        const updatedDataset = { 
          ...datasetsStore[id], 
          ...updates,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        datasetsStore[id] = updatedDataset;
        saveToStorage(datasetsStore);
        
        // Handle public status updates
        if (updates.isPublic !== undefined) {
          if (updates.isPublic) {
            // If making public, add to public store
            publicDatasetsStore[id] = updatedDataset;
            savePublicToStorage(publicDatasetsStore);
          } else {
            // If making private, remove from public store
            if (publicDatasetsStore[id]) {
              delete publicDatasetsStore[id];
              savePublicToStorage(publicDatasetsStore);
            }
          }
        } else if (updatedDataset.isPublic) {
          // If dataset is already public, update it in the public store too
          publicDatasetsStore[id] = updatedDataset;
          savePublicToStorage(publicDatasetsStore);
        }
        
        resolve(updatedDataset);
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
        // Delete from user's store
        delete datasetsStore[id];
        saveToStorage(datasetsStore);
        
        // Also delete from public store if it exists there
        if (publicDatasetsStore[id]) {
          delete publicDatasetsStore[id];
          savePublicToStorage(publicDatasetsStore);
        }
        
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
