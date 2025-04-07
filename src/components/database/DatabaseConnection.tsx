
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Database, Server, Table, Download, Loader2, Clock, RefreshCw, Trash2, AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  connectToDatabase, 
  getDatabaseTables, 
  importTableAsDataset, 
  disconnectDatabase, 
  postgresConfig,
  initDatabaseConnection,
  clearDatabaseData,
  refreshImportedDatasets,
  validateConnectionParams,
  API_URL,
  getActiveConnections,
  PostgresConfig
} from "@/services/api";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatTimeSince = (isoString: string | null): string => {
  if (!isoString) return "unknown";
  
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const ConnectionPanel = ({ connection, onRefresh }: { connection: PostgresConfig, onRefresh: () => void }) => {
  const [tables, setTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    if (connection.isConnected && connection.connectionKey) {
      handleGetTables();
    }
  }, [connection]);

  const handleGetTables = async () => {
    if (!connection.connectionKey) return;

    setIsLoadingTables(true);
    try {
      const tableList = await getDatabaseTables(connection.connectionKey);
      setTables(tableList);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to fetch database tables",
        variant: "destructive"
      });
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleImportTable = async (tableName: string) => {
    if (!connection.connectionKey) return;

    setIsImporting(tableName);
    try {
      const dataset = await importTableAsDataset(tableName, connection.connectionKey);
      refreshImportedDatasets();
      
      toast({
        title: "Table Imported",
        description: `Successfully imported ${tableName} as dataset with ${dataset.rowCount} rows`,
      });
      
      // Run validation on the imported dataset
      try {
        await fetch(`${API_URL}/validate/${dataset.id}`);
      } catch (error) {
        console.error("Error validating dataset:", error);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import table as dataset",
        variant: "destructive"
      });
    } finally {
      setIsImporting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!connection.connectionKey) return;

    setIsDisconnecting(true);
    try {
      await disconnectDatabase(connection.connectionKey);
      onRefresh();
      toast({
        title: "Disconnected",
        description: `Disconnected from ${connection.connectionUrl}`,
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect from database",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <Database className="mr-2 h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">{connection.host}:{connection.port}</p>
              <p className="text-sm text-slate-500">{connection.database} (user: {connection.user})</p>
              {connection.lastConnected && (
                <div className="flex items-center mt-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Connected {formatTimeSince(connection.lastConnected)}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge variant="default" className="ml-2">
              PostgreSQL
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Database Tables</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGetTables}
            disabled={isLoadingTables}
          >
            {isLoadingTables ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh Tables</span>
          </Button>
        </div>

        {tables.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <Table className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium">No tables found</p>
            <p className="text-xs text-slate-500">
              Click "Refresh Tables" to load database tables
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tables.map((table) => (
              <div
                key={table}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center">
                  <Table className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{table}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImportTable(table)}
                  disabled={isImporting === table}
                >
                  {isImporting === table ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-3 w-3" />
                  )}
                  Import as Dataset
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DatabaseConnection = () => {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("postgres");
  const [user, setUser] = useState("postgres");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<{error: string, tips?: string[]} | null>(null);
  const [connections, setConnections] = useState<PostgresConfig[]>([]);
  const [activeTab, setActiveTab] = useState("connect");

  useEffect(() => {
    initDatabaseConnection();
    
    const checkBackendAvailable = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${API_URL}/health`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        setBackendAvailable(response.ok);
        console.log("Backend is available:", response.ok);
      } catch (error) {
        console.error("Backend check failed:", error);
        setBackendAvailable(false);
      }
    };
    
    checkBackendAvailable();
    refreshConnections();
  }, []);

  const refreshConnections = () => {
    const activeConnections = getActiveConnections();
    setConnections(activeConnections);
    
    if (activeConnections.length > 0) {
      setActiveTab("connections");
    } else {
      setActiveTab("connect");
    }
  };

  const handleConnect = async () => {
    const validationError = validateConnectionParams(
      host,
      port,
      database,
      user,
      password
    );
    
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      console.log("Attempting to connect to database:", host, port, database);
      const result = await connectToDatabase({
        host,
        port,
        database,
        user,
        password
      });
      
      if (result.success) {
        toast({
          title: "Connected",
          description: `Successfully connected to ${database} database`,
        });
        
        refreshConnections();
        setPassword(""); // Clear password for security
      } else if (result.error) {
        setConnectionError({
          error: result.error,
          tips: result.troubleshooting
        });
        toast({
          title: "Connection Failed",
          description: "Failed to connect to database. See details below.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionError({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to database",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClearData = () => {
    setIsResetting(true);
    setTimeout(() => {
      clearDatabaseData();
      refreshConnections();
      setIsResetting(false);
      toast({
        title: "Data Reset",
        description: "All database connections and imported datasets have been reset",
      });
    }, 500);
  };

  const renderBackendWarning = () => {
    if (backendAvailable === false) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertTitle>Backend server not available</AlertTitle>
          <AlertDescription>
            <p>The FastAPI backend server at {API_URL} is not responding. Please start the backend server.</p>
            <div className="mt-2 font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded text-sm">
              <p>cd fastapi-backend && ./start_backend.sh <span className="text-xs">(Linux/Mac)</span></p>
              <p>cd fastapi-backend && start_backend.bat <span className="text-xs">(Windows)</span></p>
            </div>
            <div className="mt-2">
              <p className="text-sm">If using GitHub Codespaces, make sure:</p>
              <ol className="list-decimal list-inside text-sm ml-2 mt-1">
                <li>You've made the script executable: <code>chmod +x fastapi-backend/start_backend.sh</code></li>
                <li>You're in the correct directory (project root) when running the command</li>
                <li>Port 8000 is forwarded (should be automatic in most cases)</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  const renderConnectionError = () => {
    if (connectionError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertTitle>PostgreSQL Connection Error</AlertTitle>
          <AlertDescription>
            <p className="font-medium">{connectionError.error}</p>
            
            {connectionError.tips && connectionError.tips.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold">Troubleshooting tips:</p>
                <ul className="list-disc list-inside text-sm ml-2 mt-1">
                  {connectionError.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded">
              <p className="text-sm font-medium">Common solutions:</p>
              <ul className="list-disc list-inside text-xs ml-2 mt-1">
                <li>Make sure PostgreSQL is installed and running</li>
                <li>Check if the database exists</li>
                <li>Verify username and password</li>
                <li>Try connecting with a PostgreSQL client like pgAdmin or psql</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-blue-600" />
          PostgreSQL Connections
        </CardTitle>
        <CardDescription>
          Connect to multiple PostgreSQL databases to import tables as datasets
        </CardDescription>
        
        <div className="flex justify-between items-center mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="connect" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Connection
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center" disabled={connections.length === 0}>
                <Database className="h-4 w-4 mr-2" />
                Active Connections ({connections.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {connections.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearData}
              disabled={isResetting}
              className="ml-4"
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Reset All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderBackendWarning()}
        {renderConnectionError()}
        
        <TabsContent value="connect">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="5432"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="postgres"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="postgres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <p className="text-sm">
                <strong>Note:</strong> For PostgreSQL connections, ensure the FastAPI backend is running with:
                <code className="ml-2 p-1 bg-amber-100 dark:bg-amber-900 rounded">cd fastapi-backend && ./start_backend.sh</code>
              </p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleConnect}
              disabled={isConnecting || backendAvailable === false}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Connect to Database
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="connections">
          {connections.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <Database className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium">No active connections</p>
              <p className="text-xs text-slate-500">
                Click "New Connection" to connect to a database
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {connections.map((connection, index) => (
                <div key={connection.connectionKey || index}>
                  <ConnectionPanel connection={connection} onRefresh={refreshConnections} />
                  {index < connections.length - 1 && <Separator className="my-6" />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnection;
