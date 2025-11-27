import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ZAxis
} from "recharts";
import { GitBranch, Play, RotateCcw } from "lucide-react";

const moduleConfig = {
  salesOrders: {
    label: "Sales Orders",
    metrics: [
      { key: "net_value", label: "Order Value", type: "number" },
      { key: "order_count", label: "Order Count", type: "count" }
    ],
    groupBy: ["customer_name", "region", "salesperson_name", "status", "material_group"]
  },
  purchaseOrders: {
    label: "Purchase Orders",
    metrics: [
      { key: "net_value", label: "PO Value", type: "number" },
      { key: "po_count", label: "PO Count", type: "count" }
    ],
    groupBy: ["vendor_name", "status", "material_group", "purchasing_org"]
  },
  inventory: {
    label: "Inventory",
    metrics: [
      { key: "quantity_on_hand", label: "Stock Quantity", type: "number" },
      { key: "value", label: "Stock Value", type: "number" },
      { key: "item_count", label: "SKU Count", type: "count" }
    ],
    groupBy: ["plant", "material_group", "storage_location"]
  },
  productionOrders: {
    label: "Production Orders",
    metrics: [
      { key: "planned_quantity", label: "Planned Qty", type: "number" },
      { key: "confirmed_quantity", label: "Confirmed Qty", type: "number" },
      { key: "efficiency", label: "Efficiency %", type: "calculated" },
      { key: "order_count", label: "Order Count", type: "count" }
    ],
    groupBy: ["plant", "work_center", "status", "order_type"]
  },
  suppliers: {
    label: "Suppliers",
    metrics: [
      { key: "lead_time_days", label: "Lead Time", type: "number" },
      { key: "rating", label: "Rating", type: "number" },
      { key: "supplier_count", label: "Supplier Count", type: "count" }
    ],
    groupBy: ["category", "status", "country"]
  },
  shipments: {
    label: "Shipments",
    metrics: [
      { key: "freight_cost", label: "Freight Cost", type: "number" },
      { key: "shipment_count", label: "Shipment Count", type: "count" },
      { key: "on_time_rate", label: "On-Time Rate %", type: "calculated" }
    ],
    groupBy: ["carrier", "type", "status"]
  }
};

export default function CorrelationBuilder({ data }) {
  const [xModule, setXModule] = useState("");
  const [xMetric, setXMetric] = useState("");
  const [xGroupBy, setXGroupBy] = useState("");
  const [yModule, setYModule] = useState("");
  const [yMetric, setYMetric] = useState("");
  const [yGroupBy, setYGroupBy] = useState("");
  const [chartData, setChartData] = useState([]);

  const calculateMetric = (items, metric, config) => {
    if (!items.length) return 0;
    
    const metricConfig = config.metrics.find(m => m.key === metric);
    if (!metricConfig) return 0;

    if (metricConfig.type === "count") {
      return items.length;
    } else if (metricConfig.type === "calculated") {
      if (metric === "efficiency") {
        const planned = items.reduce((s, i) => s + (i.planned_quantity || 0), 0);
        const confirmed = items.reduce((s, i) => s + (i.confirmed_quantity || 0), 0);
        return planned > 0 ? (confirmed / planned * 100) : 0;
      }
      if (metric === "on_time_rate") {
        const delivered = items.filter(i => i.status === "Delivered").length;
        return items.length > 0 ? (delivered / items.length * 100) : 0;
      }
      return 0;
    } else {
      return items.reduce((sum, item) => sum + (item[metric] || 0), 0);
    }
  };

  const buildCorrelation = () => {
    if (!xModule || !xMetric || !xGroupBy || !yModule || !yMetric || !yGroupBy) return;

    const xData = data[xModule] || [];
    const yData = data[yModule] || [];
    const xConfig = moduleConfig[xModule];
    const yConfig = moduleConfig[yModule];

    // Group X data
    const xGrouped = xData.reduce((acc, item) => {
      const key = item[xGroupBy] || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    // Group Y data
    const yGrouped = yData.reduce((acc, item) => {
      const key = item[yGroupBy] || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    // Find common keys or create correlation
    const allKeys = new Set([...Object.keys(xGrouped), ...Object.keys(yGrouped)]);
    
    const correlationData = Array.from(allKeys).map(key => {
      const xItems = xGrouped[key] || [];
      const yItems = yGrouped[key] || [];
      
      return {
        name: key,
        x: calculateMetric(xItems, xMetric, xConfig),
        y: calculateMetric(yItems, yMetric, yConfig),
        xCount: xItems.length,
        yCount: yItems.length
      };
    }).filter(d => d.x > 0 || d.y > 0);

    setChartData(correlationData);
  };

  const reset = () => {
    setXModule("");
    setXMetric("");
    setXGroupBy("");
    setYModule("");
    setYMetric("");
    setYGroupBy("");
    setChartData([]);
  };

  const xConfig = xModule ? moduleConfig[xModule] : null;
  const yConfig = yModule ? moduleConfig[yModule] : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Build Custom Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* X Axis Configuration */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700">X Axis</h4>
              <div>
                <Label>Module</Label>
                <Select value={xModule} onValueChange={(v) => { setXModule(v); setXMetric(""); setXGroupBy(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(moduleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {xConfig && (
                <>
                  <div>
                    <Label>Metric</Label>
                    <Select value={xMetric} onValueChange={setXMetric}>
                      <SelectTrigger><SelectValue placeholder="Select metric" /></SelectTrigger>
                      <SelectContent>
                        {xConfig.metrics.map((m) => (
                          <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Group By</Label>
                    <Select value={xGroupBy} onValueChange={setXGroupBy}>
                      <SelectTrigger><SelectValue placeholder="Select grouping" /></SelectTrigger>
                      <SelectContent>
                        {xConfig.groupBy.map((g) => (
                          <SelectItem key={g} value={g}>{g.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Y Axis Configuration */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-700">Y Axis</h4>
              <div>
                <Label>Module</Label>
                <Select value={yModule} onValueChange={(v) => { setYModule(v); setYMetric(""); setYGroupBy(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(moduleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {yConfig && (
                <>
                  <div>
                    <Label>Metric</Label>
                    <Select value={yMetric} onValueChange={setYMetric}>
                      <SelectTrigger><SelectValue placeholder="Select metric" /></SelectTrigger>
                      <SelectContent>
                        {yConfig.metrics.map((m) => (
                          <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Group By</Label>
                    <Select value={yGroupBy} onValueChange={setYGroupBy}>
                      <SelectTrigger><SelectValue placeholder="Select grouping" /></SelectTrigger>
                      <SelectContent>
                        {yConfig.groupBy.map((g) => (
                          <SelectItem key={g} value={g}>{g.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={buildCorrelation} disabled={!xModule || !xMetric || !xGroupBy || !yModule || !yMetric || !yGroupBy}>
              <Play className="h-4 w-4 mr-2" /> Build Correlation
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Correlation: {xConfig?.label} ({xConfig?.metrics.find(m => m.key === xMetric)?.label}) vs {yConfig?.label} ({yConfig?.metrics.find(m => m.key === yMetric)?.label})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={xMetric}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toFixed(0)}
                    label={{ value: `${xConfig?.metrics.find(m => m.key === xMetric)?.label} (${xGroupBy})`, position: 'bottom', offset: 40 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={yMetric}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toFixed(0)}
                    label={{ value: `${yConfig?.metrics.find(m => m.key === yMetric)?.label} (${yGroupBy})`, angle: -90, position: 'insideLeft', offset: -40 }}
                  />
                  <ZAxis range={[50, 400]} />
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-sm text-blue-600">X: {d.x.toLocaleString()}</p>
                            <p className="text-sm text-green-600">Y: {d.y.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={chartData} fill="#8b5cf6">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={`hsl(${(index * 30) % 360}, 70%, 50%)`}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {chartData.slice(0, 10).map((d, i) => (
                <Badge key={i} variant="outline" style={{ borderColor: `hsl(${(i * 30) % 360}, 70%, 50%)` }}>
                  {d.name}
                </Badge>
              ))}
              {chartData.length > 10 && (
                <Badge variant="secondary">+{chartData.length - 10} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}