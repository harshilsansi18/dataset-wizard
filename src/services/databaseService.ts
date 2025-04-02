
import { toast } from "@/hooks/use-toast";
import { DatasetType } from "./types";

// PostgreSQL connection configuration state
export const postgresConfig = {
  host: "localhost",
  port: "5432",
  database: "",
  user: "",
  password: "",
};

// Store imported datasets in-memory
let importedDatasets: DatasetType[] = [];

// Configuration for database service
const USE_REAL_DB_KEY = "use_real_postgres_connection";
const API_URL = "http://localhost:8000";  // Change this to your FastAPI backend URL

// Function to determine if we should use real database connections
export const shouldUseRealDatabaseConnection = (): boolean => {
  return localStorage.getItem(USE_REAL_DB_KEY) === "true";
};

// Function to toggle between mock and real database connections
export const toggleRealDatabaseConnection = (useReal: boolean): void => {
  localStorage.setItem(USE_REAL_DB_KEY, useReal ? "true" : "false");
  
  toast({
    title: useReal ? "Using real PostgreSQL connection" : "Using mock PostgreSQL connection",
    description: useReal 
      ? "Now connecting to your actual database" 
      : "Now using simulated database functionality",
  });
};

// Initialize database connection based on stored preference
export const initDatabaseConnection = (): void => {
  const useReal = shouldUseRealDatabaseConnection();
  console.log(`Database mode: ${useReal ? "Real connection" : "Mock connection"}`);
  
  // Clear any stored datasets when switching modes
  importedDatasets = [];
};

// Test connection to PostgreSQL database
export const connectToDatabase = async (config = postgresConfig): Promise<boolean> => {
  if (shouldUseRealDatabaseConnection()) {
    try {
      const response = await fetch(`${API_URL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to connect to database');
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Database connection error:", error);
      throw error;
    }
  } else {
    // Mock connection logic (always succeeds after delay)
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  }
};

// Disconnect from database
export const disconnectDatabase = async (): Promise<void> => {
  // In a real implementation, you might want to close connections
  importedDatasets = [];
};

// Get all tables from PostgreSQL database
export const getDatabaseTables = async (config = postgresConfig): Promise<string[]> => {
  if (shouldUseRealDatabaseConnection()) {
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
  } else {
    // Mock tables (after delay)
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      "customers",
      "orders",
      "products",
      "employees",
      "suppliers"
    ];
  }
};

// Import table as dataset
export const importTableAsDataset = async (
  tableName: string,
  config = postgresConfig
): Promise<DatasetType> => {
  if (shouldUseRealDatabaseConnection()) {
    try {
      const response = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
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
  } else {
    // Mock dataset creation (after delay)
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const columnCount = Math.floor(Math.random() * 6) + 3;
    const rowCount = Math.floor(Math.random() * 200) + 50;
    
    // Generate mock headers based on table name
    const mockHeaders = getMockHeaders(tableName, columnCount);
    
    // Generate mock data rows
    const content = Array.from({ length: rowCount }, (_, rowIndex) => {
      const row: Record<string, any> = {};
      mockHeaders.forEach(header => {
        row[header] = getMockValue(header, rowIndex);
      });
      return row;
    });
    
    const dataset: DatasetType = {
      id: `db_${tableName}_${Date.now()}`,
      name: tableName,
      type: "Database",
      columnCount,
      rowCount,
      dateUploaded: new Date().toISOString().split('T')[0],
      status: "Not Validated",
      size: `${rowCount * columnCount * 10} B`,
      lastUpdated: new Date().toISOString().split('T')[0],
      content,
      headers: mockHeaders,
      source: {
        type: "database",
        connectionName: config.database,
        tableName
      }
    };
    
    importedDatasets.push(dataset);
    return dataset;
  }
};

// Helper function to generate mock headers
const getMockHeaders = (tableName: string, count: number): string[] => {
  const baseHeaders: Record<string, string[]> = {
    customers: ["id", "name", "email", "address", "city", "country", "phone"],
    orders: ["id", "customer_id", "order_date", "status", "total", "shipping_method"],
    products: ["id", "name", "category", "price", "stock", "rating"],
    employees: ["id", "name", "department", "title", "hire_date", "salary"],
    suppliers: ["id", "name", "contact", "phone", "city", "country"]
  };
  
  // Use table-specific headers or generic ones
  const headers = baseHeaders[tableName as keyof typeof baseHeaders] || 
    ["id", "name", "description", "created_at", "updated_at", "status"];
  
  // Return requested number of headers (minimum 3)
  return headers.slice(0, Math.max(count, 3));
};

// Helper function to generate mock values based on header
const getMockValue = (header: string, index: number): any => {
  switch (header) {
    case "id":
      return index + 1;
    case "customer_id":
    case "product_id":
      return Math.floor(Math.random() * 100) + 1;
    case "name":
      return `${["Alpha", "Beta", "Gamma", "Delta", "Omega"][index % 5]} ${["Corp", "Inc", "Ltd", "LLC", "Group"][Math.floor(index / 5) % 5]}`;
    case "email":
      return `user${index}@example.com`;
    case "price":
    case "total":
    case "salary":
      return (Math.random() * 1000).toFixed(2);
    case "stock":
      return Math.floor(Math.random() * 100);
    case "order_date":
    case "hire_date":
    case "created_at":
    case "updated_at":
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      return date.toISOString().split('T')[0];
    case "status":
      return ["Active", "Pending", "Completed", "Cancelled"][index % 4];
    case "rating":
      return (Math.random() * 5).toFixed(1);
    case "city":
      return ["New York", "London", "Tokyo", "Paris", "Berlin"][index % 5];
    case "country":
      return ["USA", "UK", "Japan", "France", "Germany"][index % 5];
    case "phone":
      return `+1 555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    default:
      return `Value ${index}`;
  }
};

// Function to get all imported datasets
export const getImportedDatasets = (): DatasetType[] => {
  console.log("Returning", importedDatasets.length, "imported datasets");
  return [...importedDatasets];
};

// Function to refresh the list of imported datasets
export const refreshImportedDatasets = async (
  config = postgresConfig
): Promise<DatasetType[]> => {
  if (shouldUseRealDatabaseConnection()) {
    try {
      const tables = await getDatabaseTables(config);
      
      // Import all tables (could be optimized to only import new/changed tables)
      importedDatasets = [];
      for (const table of tables) {
        const dataset = await importTableAsDataset(table, config);
        importedDatasets.push(dataset);
      }
      
      return [...importedDatasets];
    } catch (error) {
      console.error("Error refreshing datasets:", error);
      throw error;
    }
  } else {
    // For mock mode, just return existing datasets or generate new ones if none
    if (importedDatasets.length === 0) {
      importedDatasets = await Promise.all([
        importTableAsDataset("customers", config),
        importTableAsDataset("orders", config)
      ]);
    }
    return [...importedDatasets];
  }
};

// Ensure datasets are available (lazy load)
export const ensureImportedDatasetsAvailable = async (
  config = postgresConfig
): Promise<DatasetType[]> => {
  if (importedDatasets.length === 0) {
    return refreshImportedDatasets(config);
  }
  return [...importedDatasets];
};

// Clear database data
export const clearDatabaseData = (): void => {
  importedDatasets = [];
};
