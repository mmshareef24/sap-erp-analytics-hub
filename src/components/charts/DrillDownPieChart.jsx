import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChartIcon, ArrowLeft, ChevronRight } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function DrillDownPieChart({ 
  data, 
  title = "Distribution",
  valueKey = "value",
  nameKey = "name",
  drillDownData = {},
  formatValue = (v) => v.toLocaleString()
}) {
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [drillLevel, setDrillLevel] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const currentData = drillLevel === 0 ? data : drillDownData[breadcrumbs[drillLevel - 1]] || [];
  const total = currentData.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

  const handleSliceClick = (entry) => {
    if (drillDownData[entry[nameKey]]) {
      setBreadcrumbs([...breadcrumbs, entry[nameKey]]);
      setDrillLevel(drillLevel + 1);
    } else {
      setSelectedSlice(entry);
    }
  };

  const goBack = () => {
    if (drillLevel > 0) {
      setBreadcrumbs(breadcrumbs.slice(0, -1));
      setDrillLevel(drillLevel - 1);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data[valueKey] / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data[nameKey]}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue(data[valueKey])} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {drillLevel > 0 && (
                <Button variant="ghost" size="icon" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" /> {title}
              </CardTitle>
            </div>
            {drillLevel > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center">
                    {idx > 0 && <ChevronRight className="h-3 w-3" />}
                    {crumb}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  innerRadius={60}
                  outerRadius={100}
                  dataKey={valueKey}
                  onClick={(_, index) => handleSliceClick(currentData[index])}
                  style={{ cursor: 'pointer' }}
                >
                  {currentData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  formatter={(value, entry) => (
                    <span className="text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-2xl font-bold">{formatValue(total)}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSlice} onOpenChange={() => setSelectedSlice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSlice?.[nameKey]} Details</DialogTitle>
          </DialogHeader>
          {selectedSlice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="text-2xl font-bold">{formatValue(selectedSlice[valueKey])}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="text-2xl font-bold">
                    {((selectedSlice[valueKey] / total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {selectedSlice.items && (
                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  <Table>
                    <TableBody>
                      {selectedSlice.items.slice(0, 5).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatValue(item.value)}
                          </TableCell>
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