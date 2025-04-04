
import { toast } from "@/hooks/use-toast";
import { DatasetType } from "./types";

// Define a proper type for PostgreSQL config
type PostgresConfig = {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  isConnected: boolean;
  lastConnected: string | null;
  connectionUrl: string;
};

// PostgreSQL connection configuration state
export const postgresConfig: PostgresConfig = {
  host: "localhost",
  port: "5432",
  database: "",
  user: "",
  password: "",
  isConnected: false,
  lastConnected: null,
  get connectionUrl() {
    return `${this.host}:${this.port}/${this.database}`;
  }
};

// Store imported datasets in-memory
let importedDatasets: DatasetType[] = [];

// Configuration for database service
const API_URL = "http://localhost:8000";  // Change this to your FastAPI backend URL

// Initialize database connection from localStorage if available
export const initDatabaseConnection = (): void => {
  console.log("Initializing database connection");
  // Clear any stored datasets when initializing
  importedDatasets = [];
};

// Test connection to PostgreSQL database
export const connectToDatabase = async (config: Partial<PostgresConfig> = {}): Promise<boolean> => {
  // Update the config with any provided values
  Object.assign(postgresConfig, config);
  
  try {
    const response = await fetch(`${API_URL}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: postgresConfig.host,
        port: parseInt(postgresConfig.port, 10),
        database: postgresConfig.database,
        user: postgresConfig.user,
        password: postgresConfig.password
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to connect to database');
    }
    
    const result = await response.json();
    postgresConfig.isConnected = result.success;
    postgresConfig.lastConnected = new Date().toISOString();
    return result.success;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

// Disconnect from database
export const disconnectDatabase = async (): Promise<void> => {
  // In a real implementation, you might want to close connections
  postgresConfig.isConnected = false;
  importedDatasets = [];
};

// Get all tables from PostgreSQL database
export const getDatabaseTables = async (config = postgresConfig): Promise<string[]> => {
  try {
    const queryParams = new URLSearchParams({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      ...(config.password && { password: config.password }),
    });
    
    const response = await fetch(`${API_URL}/tables?${queryParams}`, {
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
  config = postgresConfig
): Promise<DatasetType> => {
  try {
    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: config.host,
        port: parseInt(config.port, 10),
        database: config.database,
        user: config.user,
        password: config.password,
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
export const refreshImportedDatasets = (): DatasetType[] => {
  console.log("Refreshing imported datasets:", importedDatasets.length);
  return [...importedDatasets];
};

// Ensure datasets are available (lazy load)
export const ensureImportedDatasetsAvailable = async (
  config = postgresConfig
): Promise<DatasetType[]> => {
  // Just return the current datasets
  return [...importedDatasets];
};

// Clear database data
export const clearDatabaseData = (): void => {
  importedDatasets = [];
  postgresConfig.isConnected = false;
  postgresConfig.lastConnected = null;
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

