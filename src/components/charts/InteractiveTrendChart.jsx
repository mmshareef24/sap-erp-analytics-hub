import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Brush 
} from "recharts";
import { TrendingUp, Calendar, ZoomIn } from "lucide-react";

export default function InteractiveTrendChart({ 
  data, 
  title = "Trend Analysis",
  lines = [],
  bars = [],
  areas = [],
  onDrillDown
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [zoomDomain, setZoomDomain] = useState(null);

  const handleClick = (data) => {
    if (data && data.activePayload) {
      setSelectedPoint(data.activePayload[0]?.payload);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}</span>
              <span className="font-medium">
                {typeof entry.value === 'number' 
                  ? entry.value.toLocaleString() 
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {zoomDomain && (
                <Button variant="outline" size="sm" onClick={() => setZoomDomain(null)}>
                  Reset Zoom
                </Button>
              )}
              <Badge variant="outline" className="text-xs">
                <ZoomIn className="h-3 w-3 mr-1" /> Click to drill down
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={data} 
                onClick={handleClick}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11 }} 
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                {(lines.length > 0 || areas.length > 0) && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                
                {areas.map((area, idx) => (
                  <Area
                    key={idx}
                    yAxisId={area.yAxisId || "left"}
                    type="monotone"
                    dataKey={area.dataKey}
                    fill={area.color}
                    fillOpacity={0.2}
                    stroke={area.color}
                    strokeWidth={2}
                    name={area.name}
                  />
                ))}
                
                {bars.map((bar, idx) => (
                  <Bar
                    key={idx}
                    yAxisId={bar.yAxisId || "left"}
                    dataKey={bar.dataKey}
                    fill={bar.color}
                    radius={[4, 4, 0, 0]}
                    name={bar.name}
                  />
                ))}
                
                {lines.map((line, idx) => (
                  <Line
                    key={idx}
                    yAxisId={line.yAxisId || "right"}
                    type="monotone"
                    dataKey={line.dataKey}
                    stroke={line.color}
                    strokeWidth={2}
                    dot={{ fill: line.color, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name={line.name}
                  />
                ))}
                
                <Brush 
                  dataKey="month" 
                  height={30} 
                  stroke="#8884d8"
                  onChange={(domain) => setZoomDomain(domain)}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPoint} onOpenChange={() => setSelectedPoint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> {selectedPoint?.month} Details
            </DialogTitle>
          </DialogHeader>
          {selectedPoint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedPoint)
                  .filter(([key]) => key !== 'month' && key !== 'details')
                  .map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xl font-bold">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </p>
                    </div>
                  ))}
              </div>
              {selectedPoint.details && (
                <div>
                  <p className="text-sm font-medium mb-2">Breakdown</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(selectedPoint.details[0] || {}).map((key) => (
                          <TableHead key={key} className="capitalize">
                            {key.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPoint.details.slice(0, 5).map((item, idx) => (
                        <TableRow key={idx}>
                          {Object.values(item).map((val, i) => (
                            <TableCell key={i}>
                              {typeof val === 'number' ? val.toLocaleString() : val}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}