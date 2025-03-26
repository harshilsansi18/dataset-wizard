import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Database, 
  FileText, 
  Info, 
  Search, 
  Calendar, 
  Check, 
  MoreVertical, 
  Globe, 
  ServerCrash, 
  FileSpreadsheet,
  Loader2,
  Trash2,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { uploadDataset, getDatasets, deleteDataset, downloadDataset, DatasetType } from "@/services/api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Datasets = () => {
  const [uploading, setUploading] = useState(false);
  const [connectingDb, setConnectingDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch datasets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      
      try {
        const uploadPromises = Array.from(files).map(file => uploadDataset(file));
        const uploadedDatasets = await Promise.all(uploadPromises);
        
        await fetchDatasets();
        
        toast({
          title: "Upload Successful",
          description: `${files.length} file(s) have been uploaded.`,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload Failed",
          description: "There was an error uploading your file(s). Please try again.",
          variant: "destructive"
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDbConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setConnectingDb(true);
    
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    const dbType = formData.get('db-type') as string;
    const host = formData.get('host') as string;
    const port = formData.get('port') as string;
    const database = formData.get('database') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    setTimeout(() => {
      setConnectingDb(false);
      
      const newDbDataset = {
        id: `db_${Date.now()}`,
        name: `${dbType}://${host}:${port}/${database}`,
        type: "Database" as const,
        columnCount: 0,
        rowCount: 0,
        dateUploaded: new Date().toISOString().split('T')[0],
        status: "Not Validated" as const,
        size: "N/A",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      setDatasets(prev => [...prev, newDbDataset]);
      
      toast({
        title: "Database Connected",
        description: `Successfully connected to ${database} on ${host}.`,
      });
    }, 2000);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "Validated":
        return <Check className="mr-2 h-4 w-4 text-green-500" />;
      case "Issues Found":
        return <Info className="mr-2 h-4 w-4 text-amber-500" />;
      case "Not Validated":
        return <Info className="mr-2 h-4 w-4 text-slate-400" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CSV":
        return <FileText className="mr-2 h-4 w-4" />;
      case "JSON":
        return <FileText className="mr-2 h-4 w-4" />;
      case "Excel":
        return <FileSpreadsheet className="mr-2 h-4 w-4" />;
      case "Database":
        return <Database className="mr-2 h-4 w-4" />;
      default:
        return <FileText className="mr-2 h-4 w-4" />;
    }
  };

  const handleDeleteDataset = async (datasetId: string, datasetName: string) => {
    try {
      await deleteDataset(datasetId);
      toast({
        title: "Dataset Deleted",
        description: `${datasetName} has been successfully deleted.`,
      });
      fetchDatasets();
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the dataset. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDataset = async (dataset: DatasetType) => {
    try {
      await downloadDataset(dataset);
      toast({
        title: "Download Started",
        description: `${dataset.name} is being downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading dataset:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the dataset. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Datasets</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Upload, connect, and manage your datasets
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="connect">Connect</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Dataset</CardTitle>
                  <CardDescription>
                    Upload CSV, Excel or other file formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
                      <Upload className="mx-auto h-10 w-10 text-slate-400" />
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                          Drag and drop your files here
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Supports CSV, Excel, and text files
                        </p>
                      </div>
                      <Input
                        id="file-upload"
                        type="file"
                        className="mt-4 cursor-pointer"
                        onChange={handleFileUpload}
                        accept=".csv,.xlsx,.xls,.txt,.json"
                        multiple
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <p className="text-sm text-slate-500">Max file size: 100MB</p>
                  <Button disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="connect">
              <Card>
                <CardHeader>
                  <CardTitle>Connect Database</CardTitle>
                  <CardDescription>
                    Connect to PostgreSQL, MySQL or other databases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDbConnect}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="db-type">Database Type</Label>
                        <select
                          id="db-type"
                          name="db-type"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="postgresql">PostgreSQL</option>
                          <option value="mysql">MySQL</option>
                          <option value="sqlserver">SQL Server</option>
                          <option value="oracle">Oracle</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="host">Host</Label>
                        <Input id="host" name="host" placeholder="localhost or IP address" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="port">Port</Label>
                          <Input id="port" name="port" placeholder="5432" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="database">Database</Label>
                          <Input id="database" name="database" placeholder="database name" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button className="w-full" type="submit" disabled={connectingDb}>
                        {connectingDb ? (
                          <>
                            <ServerCrash className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Globe className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Datasets</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search datasets..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Separator />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Loading datasets...
                    </p>
                  </div>
                ) : filteredDatasets.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-600">
                    <Database className="h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {searchQuery ? "No datasets match your search" : "No datasets yet. Upload your first dataset!"}
                    </p>
                  </div>
                ) : (
                  filteredDatasets.map((dataset) => (
                    <motion.div
                      key={dataset.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {getTypeIcon(dataset.type)}
                        </div>
                        <div>
                          <div className="font-medium">{dataset.name}</div>
                          <div className="mt-1 flex text-sm text-slate-500">
                            <span className="flex items-center">
                              {getTypeIcon(dataset.type)}
                              {dataset.type}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{dataset.size}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-slate-500">
                          <Calendar className="mr-1 h-4 w-4" />
                          {dataset.lastUpdated}
                        </div>
                        <div className="flex items-center text-sm">
                          {getStatusIcon(dataset.status)}
                          <span className={`
                            ${dataset.status === "Validated" ? "text-green-600 dark:text-green-400" : ""}
                            ${dataset.status === "Issues Found" ? "text-amber-600 dark:text-amber-400" : ""}
                            ${dataset.status === "Not Validated" ? "text-slate-500" : ""}
                          `}>
                            {dataset.status}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="flex items-center cursor-pointer"
                              onClick={() => handleDownloadDataset(dataset)}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteDataset(dataset.id, dataset.name)} 
                              className="flex items-center text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Datasets;
