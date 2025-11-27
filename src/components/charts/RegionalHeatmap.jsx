import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, TrendingUp, TrendingDown } from "lucide-react";

export default function RegionalHeatmap({ data, title = "Regional Performance", valueKey = "revenue", labelKey = "region" }) {
  const [selectedRegion, setSelectedRegion] = useState(null);

  const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
  const minValue = Math.min(...data.map(d => d[valueKey] || 0));

  const getHeatColor = (value) => {
    const normalized = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0.5;
    if (normalized > 0.8) return "bg-green-500";
    if (normalized > 0.6) return "bg-green-400";
    if (normalized > 0.4) return "bg-yellow-400";
    if (normalized > 0.2) return "bg-orange-400";
    return "bg-red-400";
  };

  const getTextColor = (value) => {
    const normalized = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0.5;
    return normalized > 0.5 ? "text-white" : "text-gray-800";
  };

  const sortedData = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedData.map((item, idx) => (
              <div
                key={idx}
                className={`${getHeatColor(item[valueKey])} ${getTextColor(item[valueKey])} p-4 rounded-lg cursor-pointer hover:opacity-90 transition-all hover:scale-105`}
                onClick={() => setSelectedRegion(item)}
              >
                <p className="font-semibold text-sm truncate">{item[labelKey]}</p>
                <p className="text-lg font-bold">SAR {((item[valueKey] || 0) / 1000).toFixed(0)}K</p>
                <div className="flex items-center gap-1 text-xs mt-1">
                  {item.growth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{item.growth?.toFixed(1) || 0}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded" /> Low
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-400 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded" /> Medium
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" /> High
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRegion} onOpenChange={() => setSelectedRegion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> {selectedRegion?.[labelKey]} Details
            </DialogTitle>
          </DialogHeader>
          {selectedRegion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">SAR {(selectedRegion[valueKey] || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className={`text-2xl font-bold ${selectedRegion.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedRegion.growth >= 0 ? '+' : ''}{selectedRegion.growth?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
              {selectedRegion.orders && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Orders</p>
                    <p className="text-xl font-bold">{selectedRegion.orders}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-xl font-bold">
                      SAR {selectedRegion.orders > 0 ? ((selectedRegion[valueKey] || 0) / selectedRegion.orders).toFixed(0) : 0}
                    </p>
                  </div>
                </div>
              )}
              {selectedRegion.customers && (
                <div>
                  <p className="text-sm font-medium mb-2">Top Customers</p>
                  <div className="space-y-2">
                    {selectedRegion.customers.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{c.name}</span>
                        <span className="text-sm font-medium">SAR {c.value?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}