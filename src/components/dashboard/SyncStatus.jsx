import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Clock, CheckCircle2, AlertCircle, Settings2 } from "lucide-react";
import moment from "moment";

const INTERVAL_OPTIONS = [
  { label: "1 minute", value: 60000 },
  { label: "5 minutes", value: 300000 },
  { label: "15 minutes", value: 900000 },
  { label: "30 minutes", value: 1800000 },
  { label: "Manual only", value: null }
];

export default function SyncStatus({ onRefresh, isRefreshing, lastUpdated, syncInterval, onIntervalChange }) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      if (lastUpdated) {
        setTimeAgo(moment(lastUpdated).fromNow());
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const currentIntervalLabel = INTERVAL_OPTIONS.find(o => o.value === syncInterval)?.label || "Manual only";

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        {isRefreshing ? (
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
        ) : lastUpdated ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        )}
        
        <div className="text-sm">
          {isRefreshing ? (
            <span className="text-muted-foreground">Syncing...</span>
          ) : lastUpdated ? (
            <span className="text-muted-foreground">
              Last updated: <span className="font-medium text-foreground">{timeAgo}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Not synced yet</span>
          )}
        </div>
      </div>

      <div className="h-4 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-8">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{currentIntervalLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Auto-refresh interval</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {INTERVAL_OPTIONS.map((option) => (
            <DropdownMenuItem 
              key={option.label}
              onClick={() => onIntervalChange(option.value)}
              className={syncInterval === option.value ? "bg-primary/10" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh} 
        disabled={isRefreshing}
        className="gap-2 h-8"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh Now
      </Button>
    </div>
  );
}