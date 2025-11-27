import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle, TrendingDown, Package, Calculator, 
  Lightbulb, Loader2, CheckCircle, Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

export default function InventoryOptimizationReport({ inventory, salesOrders }) {
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate demand from sales orders
  const demandByMaterial = salesOrders.reduce((acc, order) => {
    const material = order.material_group || "Unknown";
    if (!acc[material]) acc[material] = { quantity: 0, orders: 0 };
    acc[material].quantity += order.net_value || 0;
    acc[material].orders += 1;
    return acc;
  }, {});

  // Calculate safety stock and reorder analysis
  const inventoryAnalysis = inventory.map(item => {
    const avgDailyDemand = (item.quantity_on_hand || 0) / 30; // Simplified estimation
    const leadTimeDays = 7; // Default lead time assumption
    const demandVariability = 0.2; // 20% variability assumption
    const serviceLevel = 1.65; // 95% service level (z-score)

    // Safety Stock = Z × σ × √L (where σ = demand std dev, L = lead time)
    const safetyStock = Math.ceil(serviceLevel * (avgDailyDemand * demandVariability) * Math.sqrt(leadTimeDays));
    
    // Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock
    const calculatedReorderPoint = Math.ceil((avgDailyDemand * leadTimeDays) + safetyStock);
    
    // Days of Stock = Current Stock / Average Daily Demand
    const daysOfStock = avgDailyDemand > 0 ? Math.floor(item.quantity_on_hand / avgDailyDemand) : 999;
    
    // Stock Status
    let status = "Healthy";
    let statusColor = "bg-green-100 text-green-800";
    if (item.quantity_on_hand <= (item.reorder_point || calculatedReorderPoint)) {
      status = "Reorder Now";
      statusColor = "bg-red-100 text-red-800";
    } else if (item.quantity_on_hand <= (item.safety_stock || safetyStock) * 2) {
      status = "Low Stock";
      statusColor = "bg-yellow-100 text-yellow-800";
    } else if (item.quantity_on_hand > (item.safety_stock || safetyStock) * 5) {
      status = "Overstock";
      statusColor = "bg-purple-100 text-purple-800";
    }

    // Holding Cost Estimate (2% of value per month)
    const monthlyHoldingCost = (item.value || 0) * 0.02;

    return {
      ...item,
      safetyStock: item.safety_stock || safetyStock,
      calculatedReorderPoint,
      daysOfStock,
      status,
      statusColor,
      monthlyHoldingCost,
      avgDailyDemand
    };
  });

  // Summary metrics
  const reorderItems = inventoryAnalysis.filter(i => i.status === "Reorder Now");
  const lowStockItems = inventoryAnalysis.filter(i => i.status === "Low Stock");
  const overstockItems = inventoryAnalysis.filter(i => i.status === "Overstock");
  const healthyItems = inventoryAnalysis.filter(i => i.status === "Healthy");

  const totalHoldingCost = inventoryAnalysis.reduce((sum, i) => sum + i.monthlyHoldingCost, 0);
  const overstockValue = overstockItems.reduce((sum, i) => sum + (i.value || 0), 0);

  // Status distribution for chart
  const statusData = [
    { name: "Healthy", value: healthyItems.length, color: "#10b981" },
    { name: "Low Stock", value: lowStockItems.length, color: "#f59e0b" },
    { name: "Reorder Now", value: reorderItems.length, color: "#ef4444" },
    { name: "Overstock", value: overstockItems.length, color: "#8b5cf6" }
  ].filter(s => s.value > 0);

  const generateAISuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this inventory data and provide optimization recommendations:

Total SKUs: ${inventory.length}
Items needing reorder: ${reorderItems.length}
Low stock items: ${lowStockItems.length}
Overstocked items: ${overstockItems.length}
Monthly holding cost: SAR ${totalHoldingCost.toFixed(0)}
Overstock value: SAR ${overstockValue.toFixed(0)}

Top items needing attention:
${reorderItems.slice(0, 5).map(i => `- ${i.material_description}: ${i.quantity_on_hand} units (Reorder Point: ${i.calculatedReorderPoint})`).join('\n')}

Overstock items:
${overstockItems.slice(0, 5).map(i => `- ${i.material_description}: ${i.quantity_on_hand} units, Value: SAR ${(i.value || 0).toLocaleString()}`).join('\n')}

Provide specific, actionable recommendations to:
1. Reduce holding costs
2. Prevent stockouts
3. Optimize reorder quantities
4. Improve inventory turnover`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            costReduction: { type: "array", items: { type: "string" } },
            stockoutPrevention: { type: "array", items: { type: "string" } },
            reorderOptimization: { type: "array", items: { type: "string" } },
            priorityActions: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiSuggestions(result);
    } catch (error) {
      console.error("AI suggestion error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Healthy Stock</p>
                <p className="text-2xl font-bold">{healthyItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reorder Now</p>
                <p className="text-2xl font-bold">{reorderItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overstock</p>
                <p className="text-2xl font-bold">{overstockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Holding Cost/Mo</p>
                <p className="text-2xl font-bold">SAR {(totalHoldingCost / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stock Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reorder Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Immediate Reorder Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {reorderItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.material_description}</p>
                    <p className="text-xs text-muted-foreground">{item.material_number} | {item.plant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.quantity_on_hand} units</p>
                    <p className="text-xs text-red-600">Reorder: {item.calculatedReorderPoint}</p>
                  </div>
                </div>
              ))}
              {reorderItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No items require immediate reorder</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Stock Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Safety Stock & Reorder Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Safety Stock</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="text-right">Days of Stock</TableHead>
                  <TableHead className="text-right">Holding Cost/Mo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryAnalysis.slice(0, 15).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.material_description}</p>
                        <p className="text-xs text-muted-foreground">{item.material_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.plant}</TableCell>
                    <TableCell className="text-right">{item.quantity_on_hand?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.safetyStock}</TableCell>
                    <TableCell className="text-right">{item.calculatedReorderPoint}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.daysOfStock < 14 ? "text-red-600 font-medium" : ""}>
                        {item.daysOfStock > 365 ? "365+" : item.daysOfStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">SAR {item.monthlyHoldingCost.toFixed(0)}</TableCell>
                    <TableCell>
                      <Badge className={item.statusColor}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Optimization Suggestions */}
      <Card className="border-primary/20 bg-gradient-to-r from-blue-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" /> AI Optimization Suggestions
            </CardTitle>
            <Button onClick={generateAISuggestions} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Generate Suggestions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiSuggestions ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">{aiSuggestions.summary}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-green-500" /> Cost Reduction
                  </h4>
                  <ul className="space-y-1">
                    {aiSuggestions.costReduction?.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Stockout Prevention
                  </h4>
                  <ul className="space-y-1">
                    {aiSuggestions.stockoutPrevention?.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" /> Reorder Optimization
                  </h4>
                  <ul className="space-y-1">
                    {aiSuggestions.reorderOptimization?.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" /> Priority Actions
                  </h4>
                  <ul className="space-y-1">
                    {aiSuggestions.priorityActions?.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Click "Generate Suggestions" for AI-powered inventory optimization recommendations
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}