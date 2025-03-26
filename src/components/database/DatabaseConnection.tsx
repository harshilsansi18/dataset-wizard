
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Database, Server, Table, Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { connectToDatabase, getDatabaseTables, importTableAsDataset, disconnectDatabase, postgresConfig } from "@/services/api";

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
        password
      });
      
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center">
                <Database className="mr-2 h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Connected to database</p>
                  <p className="text-sm text-slate-500">{postgresConfig.connectionUrl}</p>
                </div>
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
                      <Table className="h-4 w-4" />
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
