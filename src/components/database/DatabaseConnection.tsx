
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Database, Server, Table, Download, Loader2, Clock, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
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
  API_URL
} from "@/services/api";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

const DatabaseConnection = () => {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("postgres");
  const [user, setUser] = useState("postgres");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [lastConnected, setLastConnected] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    initDatabaseConnection();
    
    const checkBackendAvailable = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${API_URL}/health`, {
          signal: controller.signal,
          // No-cors mode won't help with the actual API calls, but helps determine if server is running
          // mode: 'no-cors' 
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
    
    if (postgresConfig.isConnected) {
      setHost(postgresConfig.host);
      setPort(postgresConfig.port);
      setDatabase(postgresConfig.database);
      setUser(postgresConfig.user);
      setLastConnected(postgresConfig.lastConnected);
      
      handleGetTables();
    }
  }, []);

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
    try {
      console.log("Attempting to connect to database:", host, port, database);
      await connectToDatabase({
        host,
        port,
        database,
        user,
        password
      });
      
      setLastConnected(postgresConfig.lastConnected);
      toast({
        title: "Connected",
        description: `Successfully connected to ${database} database`,
      });
      
      handleGetTables();
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to database",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGetTables = async () => {
    setIsLoadingTables(true);
    try {
      const tableList = await getDatabaseTables();
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
    setIsImporting(tableName);
    try {
      const dataset = await importTableAsDataset(tableName);
      refreshImportedDatasets();
      
      toast({
        title: "Table Imported",
        description: `Successfully imported ${tableName} as dataset with ${dataset.rowCount} rows`,
      });
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

  const handleDisconnect = () => {
    disconnectDatabase();
    setTables([]);
    setLastConnected(null);
  };
  
  const handleClearData = () => {
    setIsResetting(true);
    setTimeout(() => {
      clearDatabaseData();
      setTables([]);
      setLastConnected(null);
      setIsResetting(false);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-blue-600" />
          PostgreSQL Connection
        </CardTitle>
        <CardDescription>
          Connect to PostgreSQL database to import tables as datasets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderBackendWarning()}
        
        {!postgresConfig.isConnected ? (
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
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <Database className="mr-2 h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Connected to database</p>
                    <p className="text-sm text-slate-500">{postgresConfig.connectionUrl}</p>
                    {lastConnected && (
                      <div className="flex items-center mt-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Connected {formatTimeSince(lastConnected)}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="default" className="ml-2">
                  PostgreSQL
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Database Tables</h3>
                <div className="flex space-x-2">
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleClearData}
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Reset All Data
                  </Button>
                </div>
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
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseConnection;
