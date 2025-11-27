import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, TrendingUp, TrendingDown } from "lucide-react";

export default function PerformanceMatrix({ 
  data, 
  title = "Performance Matrix",
  xKey = "volume",
  yKey = "value",
  sizeKey = "count",
  labelKey = "name",
  xLabel = "Volume",
  yLabel = "Value"
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  const maxX = Math.max(...data.map(d => d[xKey] || 0));
  const maxY = Math.max(...data.map(d => d[yKey] || 0));
  const maxSize = Math.max(...data.map(d => d[sizeKey] || 1));
  const medianX = maxX / 2;
  const medianY = maxY / 2;

  const getQuadrant = (item) => {
    const x = item[xKey] || 0;
    const y = item[yKey] || 0;
    if (x >= medianX && y >= medianY) return { label: "Stars", color: "bg-green-500" };
    if (x >= medianX && y < medianY) return { label: "Question Marks", color: "bg-yellow-500" };
    if (x < medianX && y >= medianY) return { label: "Cash Cows", color: "bg-blue-500" };
    return { label: "Dogs", color: "bg-red-500" };
  };

  const getPosition = (item) => {
    const x = ((item[xKey] || 0) / maxX) * 100;
    const y = 100 - ((item[yKey] || 0) / maxY) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const getSize = (item) => {
    const normalized = (item[sizeKey] || 1) / maxSize;
    return Math.max(20, Math.min(60, normalized * 60));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[400px] border rounded-lg overflow-hidden">
            {/* Quadrant backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="bg-yellow-50 border-r border-b flex items-center justify-center">
                <span className="text-xs text-yellow-600 font-medium opacity-50">Question Marks</span>
              </div>
              <div className="bg-green-50 border-b flex items-center justify-center">
                <span className="text-xs text-green-600 font-medium opacity-50">Stars</span>
              </div>
              <div className="bg-red-50 border-r flex items-center justify-center">
                <span className="text-xs text-red-600 font-medium opacity-50">Dogs</span>
              </div>
              <div className="bg-blue-50 flex items-center justify-center">
                <span className="text-xs text-blue-600 font-medium opacity-50">Cash Cows</span>
              </div>
            </div>

            {/* Axis labels */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
              {xLabel} →
            </div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
              {yLabel} →
            </div>

            {/* Data points */}
            {data.map((item, idx) => {
              const pos = getPosition(item);
              const size = getSize(item);
              const quadrant = getQuadrant(item);

              return (
                <div
                  key={idx}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${quadrant.color} rounded-full cursor-pointer hover:ring-4 ring-offset-2 transition-all flex items-center justify-center text-white text-xs font-medium shadow-lg`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${size}px`,
                    height: `${size}px`
                  }}
                  onClick={() => setSelectedItem({ ...item, quadrant })}
                  title={item[labelKey]}
                >
                  {size > 30 && item[labelKey]?.substring(0, 2)}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" /> Stars (High {xLabel}, High {yLabel})
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" /> Cash Cows (Low {xLabel}, High {yLabel})
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" /> Question Marks
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" /> Dogs
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.[labelKey]}
              <Badge className={selectedItem?.quadrant?.color?.replace('bg-', 'bg-') + ' text-white'}>
                {selectedItem?.quadrant?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{xLabel}</p>
                  <p className="text-xl font-bold">{selectedItem[xKey]?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{yLabel}</p>
                  <p className="text-xl font-bold">{selectedItem[yKey]?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Count</p>
                  <p className="text-xl font-bold">{selectedItem[sizeKey]?.toLocaleString()}</p>
                </div>
              </div>
              {selectedItem.growth !== undefined && (
                <div className="flex items-center gap-2">
                  {selectedItem.growth >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className={selectedItem.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {selectedItem.growth >= 0 ? '+' : ''}{selectedItem.growth.toFixed(1)}% growth
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}