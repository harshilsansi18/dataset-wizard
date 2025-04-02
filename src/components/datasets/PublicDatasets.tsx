
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Database, Download, Loader2, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DatasetType, downloadDataset, getPublicDatasets } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PublicDatasets = () => {
  const [publicDatasets, setPublicDatasets] = useState<DatasetType[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPublicDatasets();
  }, []);

  const fetchPublicDatasets = async () => {
    setIsLoading(true);
    try {
      const datasets = await getPublicDatasets();
      setPublicDatasets(datasets);
    } catch (error) {
      console.error("Error fetching public datasets:", error);
      toast({
        title: "Error",
        description: "Failed to load public datasets",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchPublicDatasets();
      toast({
        title: "Refreshed",
        description: "Public datasets have been refreshed"
      });
    } catch (error) {
      console.error("Error refreshing public datasets:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (dataset: DatasetType) => {
    setIsDownloading(dataset.id);
    try {
      await downloadDataset(dataset);
      toast({
        title: "Download Started",
        description: `${dataset.name} is being downloaded`
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the dataset",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5 text-green-600" />
            Public Datasets
          </CardTitle>
          <CardDescription>
            Datasets that have been shared for public access
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : publicDatasets.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <Info className="h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-lg font-medium mb-1">No public datasets available</h3>
            <p className="text-sm text-slate-500 mb-4">
              Public datasets will appear here when users mark datasets as public.
            </p>
            <p className="text-xs text-slate-400">
              To make your datasets public, go to the Datasets tab and toggle the "Public" option.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicDatasets.map((dataset) => (
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
                      <Badge variant="outline">{dataset.type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{dataset.rowCount}</TableCell>
                  <TableCell>{dataset.columnCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(dataset)}
                      disabled={isDownloading === dataset.id}
                    >
                      {isDownloading === dataset.id ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-3 w-3" />
                      )}
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicDatasets;
