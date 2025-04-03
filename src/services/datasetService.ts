import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { DatasetType } from "./types";
import { getImportedDatasets } from "./databaseService";

// Persistent storage using localStorage
const DATASETS_STORAGE_KEY = "soda_core_datasets";
// Add a separate storage key for public datasets
const PUBLIC_DATASETS_STORAGE_KEY = "soda_core_public_datasets";
// API URL for server-side public datasets
const API_URL = "http://localhost:8000"; 

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

// Get public datasets from the server
const fetchServerPublicDatasets = async (): Promise<DatasetType[]> => {
  try {
    const response = await fetch(`${API_URL}/public-datasets`);
    if (!response.ok) {
      throw new Error('Failed to fetch public datasets from server');
    }
    const data = await response.json();
    return data.datasets || [];
  } catch (error) {
    console.error("Error fetching public datasets from server:", error);
    return [];
  }
};

// Save a dataset to the server's public collection
const saveDatasetToServer = async (dataset: DatasetType): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/public-datasets/${dataset.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataset),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save dataset to server');
    }
    
    return true;
  } catch (error) {
    console.error("Error saving dataset to server:", error);
    return false;
  }
};

// Remove a dataset from the server's public collection
const removeDatasetFromServer = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/public-datasets/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove dataset from server');
    }
    
    return true;
  } catch (error) {
    console.error("Error removing dataset from server:", error);
    return false;
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

// Get public datasets from both local storage and server
export const getPublicDatasets = async (): Promise<DatasetType[]> => {
  // Fetch public datasets from server
  const serverPublicDatasets = await fetchServerPublicDatasets();
  
  // Get all public datasets from the public store
  const localPublicDatasets = Object.values(publicDatasetsStore);
  
  // Combine local and server datasets
  const combinedPublicDatasets = [...localPublicDatasets, ...serverPublicDatasets];
  
  // Get user's own public datasets
  const userDatasets = await getDatasets();
  const userPublicDatasets = userDatasets.filter(dataset => dataset.isPublic === true);
  
  // Combine all public datasets
  const allPublicDatasets = [...combinedPublicDatasets, ...userPublicDatasets];
  
  // Remove duplicates
  const uniquePublicDatasets = allPublicDatasets.filter((dataset, index, self) => 
    index === self.findIndex((d) => d.id === dataset.id)
  );
  
  return uniquePublicDatasets;
};

// Toggle dataset public status
export const toggleDatasetPublicStatus = (id: string, isPublic: boolean): Promise<DatasetType | undefined> => {
  return new Promise(async (resolve, reject) => {
    // Check if dataset exists in user's own store
    if (datasetsStore[id]) {
      // Update the dataset in the user's store
      datasetsStore[id] = {
        ...datasetsStore[id],
        isPublic,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      saveToStorage(datasetsStore);
      
      // If making it public, also add to the public store and server
      if (isPublic) {
        publicDatasetsStore[id] = datasetsStore[id];
        savePublicToStorage(publicDatasetsStore);
        
        // Save to server
        await saveDatasetToServer(datasetsStore[id]);
      } else {
        // If making it private, remove from public store and server
        if (publicDatasetsStore[id]) {
          delete publicDatasetsStore[id];
          savePublicToStorage(publicDatasetsStore);
        }
        
        // Remove from server
        await removeDatasetFromServer(id);
      }
      
      resolve(datasetsStore[id]);
    } else {
      // If the dataset doesn't exist in the user's store, check the database datasets
      const dbDatasets = getImportedDatasets();
      const dbDataset = dbDatasets.find(ds => ds.id === id);
      
      if (dbDataset) {
        // Update the database dataset's public status
        dbDataset.isPublic = isPublic;
        
        // If making public, add to public store and server
        if (isPublic) {
          publicDatasetsStore[id] = dbDataset;
          savePublicToStorage(publicDatasetsStore);
          
          // Save to server
          await saveDatasetToServer(dbDataset);
        } else {
          // If making private, remove from public store and server
          if (publicDatasetsStore[id]) {
            delete publicDatasetsStore[id];
            savePublicToStorage(publicDatasetsStore);
          }
          
          // Remove from server
          await removeDatasetFromServer(id);
        }
        
        resolve(dbDataset);
      } else {
        // Dataset not found
        reject(new Error("Dataset not found"));
      }
    }
  });
};

// Get dataset by ID
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
  return new Promise(async (resolve) => {
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
    
    // If dataset is public, also add to public store and server
    if (newDataset.isPublic) {
      publicDatasetsStore[id] = newDataset;
      savePublicToStorage(publicDatasetsStore);
      
      // Save to server
      await saveDatasetToServer(newDataset);
    }
    
    resolve(newDataset);
  });
};

export const updateDataset = (
  id: string,
  updates: Partial<DatasetType>
): Promise<DatasetType | undefined> => {
  return new Promise(async (resolve) => {
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
          // If making public, add to public store and server
          publicDatasetsStore[id] = updatedDataset;
          savePublicToStorage(publicDatasetsStore);
          
          // Save to server
          await saveDatasetToServer(updatedDataset);
        } else {
          // If making private, remove from public store and server
          if (publicDatasetsStore[id]) {
            delete publicDatasetsStore[id];
            savePublicToStorage(publicDatasetsStore);
            
            // Remove from server
            await removeDatasetFromServer(id);
          }
        }
      } else if (updatedDataset.isPublic) {
        // If dataset is already public, update it in the public store and server
        publicDatasetsStore[id] = updatedDataset;
        savePublicToStorage(publicDatasetsStore);
        
        // Save to server
        await saveDatasetToServer(updatedDataset);
      }
      
      resolve(updatedDataset);
    } else {
      resolve(undefined);
    }
  });
};

export const deleteDataset = (id: string): Promise<boolean> => {
  return new Promise(async (resolve) => {
    if (datasetsStore[id]) {
      // Check if dataset is public before deletion
      const isPublic = datasetsStore[id].isPublic;
      
      // Delete from user's store
      delete datasetsStore[id];
      saveToStorage(datasetsStore);
      
      // Also delete from public store if it exists there
      if (publicDatasetsStore[id]) {
        delete publicDatasetsStore[id];
        savePublicToStorage(publicDatasetsStore);
      }
      
      // If it was public, remove from server too
      if (isPublic) {
        await removeDatasetFromServer(id);
      }
      
      resolve(true);
    } else {
      resolve(false);
    }
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
