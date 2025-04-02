
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Database, Server, Table, Download, Loader2, Clock, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  connectToDatabase, 
  getDatabaseTables, 
  importTableAsDataset, 
  disconnectDatabase, 
  postgresConfig,
  initDatabaseConnection,
  clearDatabaseData
} from "@/services/api";

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
  const [useRealConnection, setUseRealConnection] = useState(false);

  // Initialize connection from localStorage on component mount
  useEffect(() => {
    initDatabaseConnection();
    
    // Set form values if we have a connection
    if (postgresConfig.isConnected) {
      setHost(postgresConfig.host);
      setPort(postgresConfig.port.toString());
      setDatabase(postgresConfig.database);
      setUser(postgresConfig.user);
      setLastConnected(postgresConfig.lastConnected);
      setUseRealConnection(postgresConfig.isRealConnection);
      
      // Load tables if we're connected
      handleGetTables();
    }
  }, []);

  const handleConnect = async () => {
    if (!host || !database || !user || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required connection fields",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await connectToDatabase({
        host,
        port: parseInt(port, 10),
        database,
        user,
        password,
        useRealConnection
      });
      
      setLastConnected(postgresConfig.lastConnected);
      
      // After successful connection, load tables
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
    setUseRealConnection(false);
  };
  
  const handleClearData = () => {
    setIsResetting(true);
    setTimeout(() => {
      clearDatabaseData();
      setTables([]);
      setLastConnected(null);
      setUseRealConnection(false);
      setIsResetting(false);
    }, 500); // Small delay for better UX
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-blue-600" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Connect to PostgreSQL database to import tables as datasets
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            
            <div className="flex items-center space-x-2 mt-2">
              <Switch 
                id="use-real-connection" 
                checked={useRealConnection}
                onCheckedChange={setUseRealConnection}
              />
              <Label htmlFor="use-real-connection">
                Use real PostgreSQL connection
              </Label>
            </div>
            
            {useRealConnection && (
              <div className="rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <p className="text-sm">
                  <strong>Note:</strong> For real PostgreSQL connections, you need to have a PostgreSQL backend service running. 
                  Update the API_URL in databaseService.ts to point to your backend service.
                </p>
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleConnect}
              disabled={isConnecting}
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
            
            <Separator className="my-4" />
            
            <div className="text-center">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearData}
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Reset All Database Data
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Clear all database connections and imported datasets from local storage
              </p>
            </div>
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
                <Badge variant={postgresConfig.isRealConnection ? "default" : "outline"} className="ml-2">
                  {postgresConfig.isRealConnection ? "Real Connection" : "Mock Connection"}
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
