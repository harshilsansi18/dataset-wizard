
import { Badge } from "@/components/ui/badge";
import { postgresConfig } from "@/services/api";
import { Database, Clock } from "lucide-react";

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

const ConnectionStatus: React.FC = () => {
  if (!postgresConfig.isConnected) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Database className="w-4 h-4 text-green-500" />
      <span className="text-sm">Connected to:</span>
      <Badge variant="outline" className="font-mono text-xs">
        {postgresConfig.connectionUrl}
      </Badge>
      {postgresConfig.lastConnected && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          {formatTimeSince(postgresConfig.lastConnected)}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
