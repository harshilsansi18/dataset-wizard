
import { toast } from "@/hooks/use-toast";
import { DatasetType } from "./types";

// This is a simulated PostgreSQL connection - in a real app, this would connect to a backend
export const postgresConfig = {
  isConnected: false,
  connectionUrl: "",
  user: "",
  password: "",
  database: "",
  host: "",
  port: 5432,
  // Add a shared state for datasets imported from database
  importedDatasets: [] as DatasetType[],
  // Add timestamp to track when database was last connected
  lastConnected: null as string | null
};

export const connectToDatabase = async (
  connectionParams: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // In a real implementation, this would connect to PostgreSQL
      console.log("Connecting to database:", connectionParams.host, connectionParams.database);
      
      // Store connection details
      postgresConfig.isConnected = true;
      postgresConfig.host = connectionParams.host;
      postgresConfig.port = connectionParams.port;
      postgresConfig.database = connectionParams.database;
      postgresConfig.user = connectionParams.user;
      postgresConfig.connectionUrl = `postgres://${connectionParams.user}:***@${connectionParams.host}:${connectionParams.port}/${connectionParams.database}`;
      postgresConfig.lastConnected = new Date().toISOString();
      
      // Store connection in localStorage to persist between sessions
      localStorage.setItem('postgres_connection', JSON.stringify({
        isConnected: true,
        host: connectionParams.host,
        port: connectionParams.port,
        database: connectionParams.database,
        user: connectionParams.user,
        connectionUrl: postgresConfig.connectionUrl,
        lastConnected: postgresConfig.lastConnected
      }));
      
      toast({
        title: "Database Connected",
        description: `Successfully connected to ${connectionParams.database} on ${connectionParams.host}`,
      });
      
      resolve(true);
    } catch (err) {
      console.error('Failed to connect to database:', err);
      reject(new Error('Failed to connect to database'));
    }
  });
};

// Initialize connection from localStorage if available
export const initDatabaseConnection = (): void => {
  try {
    const savedConnection = localStorage.getItem('postgres_connection');
    if (savedConnection) {
      const connectionData = JSON.parse(savedConnection);
      postgresConfig.isConnected = connectionData.isConnected;
      postgresConfig.host = connectionData.host;
      postgresConfig.port = connectionData.port;
      postgresConfig.database = connectionData.database;
      postgresConfig.user = connectionData.user;
      postgresConfig.connectionUrl = connectionData.connectionUrl;
      postgresConfig.lastConnected = connectionData.lastConnected;
      
      // Also load imported datasets
      const savedDatasets = localStorage.getItem('db_imported_datasets');
      if (savedDatasets) {
        postgresConfig.importedDatasets = JSON.parse(savedDatasets);
      }
      
      console.log('Restored database connection from localStorage');
    }
  } catch (err) {
    console.error('Failed to restore database connection:', err);
  }
};

export const getDatabaseTables = async (): Promise<string[]> => {
  if (!postgresConfig.isConnected) {
    toast({
      title: "Not Connected",
      description: "Please connect to a database first",
      variant: "destructive"
    });
    return [];
  }
  
  // In a real implementation, this would fetch tables from PostgreSQL
  // For now, we'll return simulated tables
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        "users",
        "products",
        "orders",
        "transactions",
        "inventory",
        "customers",
        "suppliers",
        "categories"
      ]);
    }, 700);
  });
};

export const importTableAsDataset = async (tableName: string): Promise<DatasetType> => {
  if (!postgresConfig.isConnected) {
    throw new Error("Not connected to database");
  }
  
  // In a real implementation, this would query the table and format as a dataset
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate mock data for this table
      const columnCount = Math.floor(Math.random() * 5) + 3;
      const rowCount = Math.floor(Math.random() * 200) + 50;
      
      const headers = [];
      for (let i = 0; i < columnCount; i++) {
        headers.push(`column_${i}`);
      }
      
      const content = [];
      for (let i = 0; i < rowCount; i++) {
        const row: Record<string, any> = {};
        for (let j = 0; j < columnCount; j++) {
          row[`column_${j}`] = `value_${i}_${j}`;
        }
        content.push(row);
      }
      
      const dataset: DatasetType = {
        id: `db_${Date.now()}`,
        name: tableName,
        type: "Database",
        columnCount,
        rowCount,
        dateUploaded: new Date().toISOString().split('T')[0],
        status: "Not Validated",
        size: `${rowCount * columnCount * 10} B`,
        lastUpdated: new Date().toISOString().split('T')[0],
        content,
        headers,
        source: {
          type: "database",
          connectionName: postgresConfig.database,
          tableName: tableName
        }
      };
      
      // Store in the imported datasets array
      postgresConfig.importedDatasets.push(dataset);
      
      // Save to localStorage for persistence between page loads
      try {
        localStorage.setItem('db_imported_datasets', JSON.stringify(postgresConfig.importedDatasets));
      } catch (err) {
        console.error('Failed to save imported dataset to localStorage:', err);
      }
      
      resolve(dataset);
    }, 1500);
  });
};

export const getImportedDatasets = (): DatasetType[] => {
  // Try to load from localStorage first
  try {
    const storedDatasets = localStorage.getItem('db_imported_datasets');
    if (storedDatasets) {
      postgresConfig.importedDatasets = JSON.parse(storedDatasets);
    }
  } catch (err) {
    console.error('Failed to load imported datasets from localStorage:', err);
  }
  
  return postgresConfig.importedDatasets;
};

export const disconnectDatabase = (): void => {
  postgresConfig.isConnected = false;
  postgresConfig.connectionUrl = "";
  postgresConfig.user = "";
  postgresConfig.password = "";
  postgresConfig.database = "";
  postgresConfig.host = "";
  postgresConfig.lastConnected = null;
  
  // Clear connection from localStorage
  try {
    localStorage.removeItem('postgres_connection');
  } catch (err) {
    console.error('Failed to remove connection from localStorage:', err);
  }
  
  toast({
    title: "Database Disconnected",
    description: "Successfully disconnected from the database",
  });
};
