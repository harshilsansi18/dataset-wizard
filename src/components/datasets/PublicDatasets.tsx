
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Database, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DatasetType, downloadDataset } from "@/services/api";

// These are example public datasets that will be visible to all users
const SAMPLE_PUBLIC_DATASETS: DatasetType[] = [
  {
    id: "public_ds_1",
    name: "US Population Data",
    type: "CSV",
    columnCount: 8,
    rowCount: 50,
    dateUploaded: "2023-08-10",
    status: "Validated",
    size: "25 KB",
    lastUpdated: "2023-08-10",
    headers: ["State", "Population", "Area", "Density", "Growth", "GDP", "Income", "Region"],
    content: [
      { State: "California", Population: "39.5M", Area: "163,696 sq mi", Density: "241/sq mi", Growth: "0.6%", GDP: "$3.4T", Income: "$70,192", Region: "West" },
      { State: "Texas", Population: "29.9M", Area: "268,596 sq mi", Density: "111/sq mi", Growth: "1.3%", GDP: "$1.9T", Income: "$61,874", Region: "South" },
      // More rows would be included in a real dataset
    ],
    source: { type: "file", fileName: "us_population.csv" }
  },
  {
    id: "public_ds_2",
    name: "Global Weather Data",
    type: "CSV",
    columnCount: 7,
    rowCount: 100,
    dateUploaded: "2023-07-15",
    status: "Validated",
    size: "42 KB",
    lastUpdated: "2023-07-15",
    headers: ["City", "Country", "Temperature", "Humidity", "Precipitation", "WindSpeed", "AirQuality"],
    content: [
      { City: "New York", Country: "USA", Temperature: "75°F", Humidity: "65%", Precipitation: "0.2 in", WindSpeed: "8 mph", AirQuality: "Good" },
      { City: "London", Country: "UK", Temperature: "68°F", Humidity: "78%", Precipitation: "0.5 in", WindSpeed: "12 mph", AirQuality: "Moderate" },
      // More rows would be included in a real dataset
    ],
    source: { type: "file", fileName: "global_weather.csv" }
  },
  {
    id: "public_ds_3",
    name: "Sales Transactions",
    type: "CSV",
    columnCount: 6,
    rowCount: 200,
    dateUploaded: "2023-06-20",
    status: "Validated",
    size: "58 KB",
    lastUpdated: "2023-06-20",
    headers: ["TransactionID", "Date", "Product", "Quantity", "Price", "Customer"],
    content: [
      { TransactionID: "T-1001", Date: "2023-06-01", Product: "Laptop", Quantity: "1", Price: "$999", Customer: "John Smith" },
      { TransactionID: "T-1002", Date: "2023-06-01", Product: "Monitor", Quantity: "2", Price: "$349", Customer: "Jane Doe" },
      // More rows would be included in a real dataset
    ],
    source: { type: "file", fileName: "sales_transactions.csv" }
  }
];

const PublicDatasets = () => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

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
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="mr-2 h-5 w-5 text-green-600" />
          Public Datasets
        </CardTitle>
        <CardDescription>
          Example datasets available to all users
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
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
            {SAMPLE_PUBLIC_DATASETS.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell className="font-medium">{dataset.name}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
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
      </CardContent>
    </Card>
  );
};

export default PublicDatasets;
