
import { useEffect, useState } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Database, 
  Filter, 
  Search, 
  Download, 
  Trash2, 
  ChevronDown,
  Loader2,
  Globe,
  Lock
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { getDatasets, downloadDataset, deleteDataset, uploadDataset, DatasetType, toggleDatasetPublicStatus } from "@/services/api";
import DatabaseConnection from "@/components/database/DatabaseConnection";
import PublicDatasets from "@/components/datasets/PublicDatasets";

const Datasets = () => {
  const [datasets, setDatasets] = useState<DatasetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [updatingPublicStatus, setUpdatingPublicStatus] = useState<string | null>(null);

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

  const handleDownload = async (id: string, name: string) => {
    try {
      const dataset = datasets.find(d => d.id === id);
      if (!dataset) {
        throw new Error("Dataset not found");
      }
      
      await downloadDataset(dataset);
      toast({
        title: "Download Started",
        description: `${name} is being downloaded`
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the dataset",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDataset(id);
      setDatasets(datasets.filter(dataset => dataset.id !== id));
      toast({
        title: "Dataset Deleted",
        description: `${name} has been deleted`
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the dataset",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    setUpdatingPublicStatus(id);
    try {
      const updatedDataset = await toggleDatasetPublicStatus(id, isPublic);
      if (updatedDataset) {
        setDatasets(
          datasets.map((dataset) =>
            dataset.id === id ? { ...dataset, isPublic } : dataset
          )
        );
        toast({
          title: isPublic ? "Dataset Made Public" : "Dataset Made Private",
          description: isPublic 
            ? "The dataset is now accessible to everyone" 
            : "The dataset is now private"
        });
      }
    } catch (error) {
      console.error("Error updating public status:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update dataset visibility",
        variant: "destructive"
      });
    } finally {
      setUpdatingPublicStatus(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];
      const dataset = await uploadDataset(file);
      
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded as a new dataset.`
      });
      
      // Update the datasets list directly instead of refetching
      setDatasets(prev => [...prev, dataset]);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the dataset",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    return dataset.type.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "validated":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "issues found":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "not validated":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const renderDatasetsTable = (datasets: DatasetType[]) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }
    
    if (datasets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileSpreadsheet className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-medium">No datasets found</h3>
          <p className="text-sm text-slate-500">
            Upload a dataset or import from a database to get started
          </p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Date Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Public</TableHead>
            <TableHead>Rows</TableHead>
            <TableHead>Columns</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datasets.map((dataset) => (
            <TableRow key={dataset.id}>
              <TableCell className="font-medium">{dataset.name}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  {dataset.type === "CSV" ? (
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
                  ) : dataset.type === "JSON" ? (
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-yellow-500" />
                  ) : (
                    <Database className="mr-2 h-4 w-4 text-blue-500" />
                  )}
                  {dataset.type}
                </div>
              </TableCell>
              <TableCell>{dataset.size}</TableCell>
              <TableCell>{dataset.dateUploaded}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(dataset.status || "")}>
                  {dataset.status || "Not Validated"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Switch 
                    checked={dataset.isPublic || false}
                    onCheckedChange={(checked) => handleTogglePublic(dataset.id, checked)}
                    disabled={updatingPublicStatus === dataset.id}
                    className="mr-2"
                  />
                  {updatingPublicStatus === dataset.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : dataset.isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </TableCell>
              <TableCell>{dataset.rowCount}</TableCell>
              <TableCell>{dataset.columnCount}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ChevronDown className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDownload(dataset.id, dataset.name)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(dataset.id, dataset.name)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Datasets</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage your datasets for validation and comparison
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(tab) => {
          setActiveTab(tab);
          // Refresh datasets when changing tabs
          fetchDatasets();
        }}
        className="space-y-4"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Datasets</TabsTrigger>
            <TabsTrigger value="CSV">CSV</TabsTrigger>
            <TabsTrigger value="JSON">JSON</TabsTrigger>
            <TabsTrigger value="Database">Database</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search datasets..."
                className="pl-8 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <Button disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Dataset
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {renderDatasetsTable(filteredDatasets)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Database">
          <DatabaseConnection />
        </TabsContent>
        
        <TabsContent value="public">
          <PublicDatasets />
        </TabsContent>

        <TabsContent value="CSV" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {renderDatasetsTable(filteredDatasets.filter(dataset => dataset.type === "CSV"))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="JSON" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {renderDatasetsTable(filteredDatasets.filter(dataset => dataset.type === "JSON"))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Datasets;
