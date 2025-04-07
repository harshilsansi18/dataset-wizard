
import { toast } from "@/hooks/use-toast";
import { DatasetType } from "./types";

// Define a proper type for PostgreSQL config
export type PostgresConfig = {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  isConnected: boolean;
  lastConnected: string | null;
  connectionKey: string | null;
  connectionUrl: string;
};

// Active connections store
export const activeConnections: { [connectionKey: string]: PostgresConfig } = {};

// Default PostgreSQL connection configuration state
export const postgresConfig: PostgresConfig = {
  host: "localhost",
  port: "5432",
  database: "",
  user: "",
  password: "",
  isConnected: false,
  lastConnected: null,
  connectionKey: null,
  get connectionUrl() {
    return `${this.host}:${this.port}/${this.database}`;
  }
};

// Store imported datasets in-memory
let importedDatasets: DatasetType[] = [];

// Configuration for database service
// Automatically detect GitHub Codespaces and adjust API_URL accordingly
const detectApiUrl = () => {
  // GitHub Codespaces detection
  if (window.location.hostname.includes('.app.github.dev')) {
    // Replace frontend port (likely 5173 or 8080) with backend port (8000)
    const baseUrl = window.location.origin;
    const modifiedUrl = baseUrl.replace(/:\d+\.app\.github\.dev/, ':8000.app.github.dev');
    console.log('Detected GitHub Codespaces, using URL:', modifiedUrl);
    return modifiedUrl;
  }
  
  // Default for local development
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
};

export const API_URL = detectApiUrl();
console.log('Using API URL:', API_URL);

// Initialize database connections from localStorage if available
export const initDatabaseConnection = (): void => {
  console.log("Initializing database connections");
  try {
    // Check if we have stored connection info
    const storedConnections = localStorage.getItem("postgres_connections");
    if (storedConnections) {
      const connections = JSON.parse(storedConnections);
      
      // Update the active connections
      Object.assign(activeConnections, connections);
      
      console.log("Loaded stored database configurations:", Object.keys(activeConnections).length);
      
      // Attempt to reconnect to all previously connected databases
      Object.values(activeConnections).forEach(config => {
        if (config.isConnected) {
          connectToDatabase(config)
            .then(() => console.log("Reconnected to database:", config.connectionUrl))
            .catch(() => {
              // If reconnection fails, reset the connected state
              config.isConnected = false;
              saveConnections();
            });
        }
      });
    }
  } catch (error) {
    console.error("Error initializing database connections:", error);
    clearDatabaseData();
  }
};

// Save all connections to localStorage
const saveConnections = (): void => {
  localStorage.setItem("postgres_connections", JSON.stringify(activeConnections));
};

// Test connection to PostgreSQL database
export const connectToDatabase = async (config: Partial<PostgresConfig> = {}): Promise<any> {
  // Create a copy of the default config
  const connectionConfig = { ...postgresConfig, ...config };
  
  try {
    console.log("Connecting to database:", connectionConfig.host);
    console.log("Using API URL:", API_URL);
    
    const response = await fetch(`${API_URL}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: connectionConfig.host,
        port: parseInt(connectionConfig.port, 10),
        database: connectionConfig.database,
        user: connectionConfig.user,
        password: connectionConfig.password
      }),
    });
    
    // Check HTTP status first
    if (!response.ok) {
      let errorDetail = 'Failed to connect to database';
      
      // Try to extract error details from JSON, but handle case where it's not valid JSON
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.detail || errorDetail;
      } catch (jsonError) {
        console.error("Failed to parse error response:", jsonError);
        // If response has text but not valid JSON, use that
        const textResponse = await response.text();
        if (textResponse) {
          errorDetail = textResponse;
        }
      }
      
      throw new Error(errorDetail);
    }
    
    // Parse the JSON response safely
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      const textResponse = await response.text();
      throw new Error(`Invalid response from server: ${textResponse || 'Empty response'}`);
    }
    
    // Update connection state if successful
    if (result.success) {
      const connectionKey = result.connectionKey || `${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`;
      
      connectionConfig.isConnected = true;
      connectionConfig.lastConnected = new Date().toISOString();
      connectionConfig.connectionKey = connectionKey;
      
      // Store in our active connections
      activeConnections[connectionKey] = { ...connectionConfig };
      
      // Store the updated configs in localStorage
      saveConnections();
    }
    
    return result;
  } catch (error) {
    console.error("Database connection error:", error);
    // Check if the error is related to backend unavailability
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Backend server not available. Make sure the FastAPI server is running.');
    }
    throw error;
  }
};

// Disconnect from database
export const disconnectDatabase = async (connectionKey: string): Promise<void> => {
  console.log("Disconnecting from database:", connectionKey);
  
  if (activeConnections[connectionKey]) {
    try {
      // Call the backend to disconnect
      await fetch(`${API_URL}/connect/${connectionKey}`, {
        method: 'DELETE',
      });
      
      // Remove from our active connections
      delete activeConnections[connectionKey];
      
      // Update localStorage
      saveConnections();
      
      console.log("Successfully disconnected from database:", connectionKey);
    } catch (error) {
      console.error("Error disconnecting from database:", error);
      
      // Still remove from local state even if backend call fails
      delete activeConnections[connectionKey];
      saveConnections();
    }
  }
};

// Get all tables from PostgreSQL database
export const getDatabaseTables = async (connectionKey: string): Promise<string[]> => {
  try {
    console.log("Getting tables for connection:", connectionKey);
    
    const response = await fetch(`${API_URL}/tables?connection_key=${connectionKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch tables');
    }
    
    const result = await response.json();
    return result.tables;
  } catch (error) {
    console.error("Error fetching tables:", error);
    throw error;
  }
};

// Import table as dataset
export const importTableAsDataset = async (
  tableName: string,
  connectionKey: string
): Promise<DatasetType> => {
  try {
    console.log(`Importing table '${tableName}' from connection '${connectionKey}'`);
    
    const connection = activeConnections[connectionKey];
    if (!connection) {
      throw new Error(`Connection '${connectionKey}' not found`);
    }
    
    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: connection.host,
        port: parseInt(connection.port, 10),
        database: connection.database,
        user: connection.user,
        password: connection.password,
        table: tableName
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to import table');
    }
    
    const dataset = await response.json();
    importedDatasets.push(dataset);
    return dataset;
  } catch (error) {
    console.error("Error importing table:", error);
    throw error;
  }
};

// Function to get all imported datasets
export const getImportedDatasets = (): DatasetType[] => {
  console.log("Returning", importedDatasets.length, "imported datasets");
  return [...importedDatasets];
};

// Function to refresh the list of imported datasets
export const refreshImportedDatasets = async (): Promise<DatasetType[]> => {
  console.log("Refreshing imported datasets:", importedDatasets.length);
  return [...importedDatasets];
};

// Ensure datasets are available (lazy load)
export const ensureImportedDatasetsAvailable = async (): Promise<DatasetType[]> => {
  // Just return the current datasets
  return [...importedDatasets];
};

// Clear database data
export const clearDatabaseData = (): void => {
  importedDatasets = [];
  Object.keys(activeConnections).forEach(key => {
    activeConnections[key].isConnected = false;
  });
  
  // Clear from localStorage
  localStorage.removeItem("postgres_connections");
};

// Validate the Postgres connection parameters
export const validateConnectionParams = (
  host: string,
  port: string,
  database: string,
  user: string,
  password: string
): string | null => {
  if (!host.trim()) return "Host is required";
  if (!port.trim()) return "Port is required";
  if (isNaN(parseInt(port))) return "Port must be a number";
  if (!database.trim()) return "Database name is required";
  if (!user.trim()) return "Username is required";
  if (!password.trim()) return "Password is required";
  return null;
};

// Get all active connections
export const getActiveConnections = (): PostgresConfig[] => {
  return Object.values(activeConnections);
};

// Validate a dataset
export const validateDataset = async (datasetId: string): Promise<any> => {
  try {
    console.log(`Validating dataset '${datasetId}'`);
    
    const response = await fetch(`${API_URL}/validate/${datasetId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to validate dataset');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error validating dataset:", error);
    throw error;
  }
};
