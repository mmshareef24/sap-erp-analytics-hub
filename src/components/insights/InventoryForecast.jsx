import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Loader2, Sparkles, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

export default function InventoryForecast({ inventory }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Prepare inventory summary
  const inventorySummary = inventory.slice(0, 20).map(item => ({
    material: item.material_number,
    description: item.material_description,
    current_stock: item.quantity_on_hand,
    reorder_point: item.reorder_point || 0,
    safety_stock: item.safety_stock || 0,
    value: item.value || 0,
    plant: item.plant
  }));

  const totalValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0);
  const lowStockCount = inventory.filter(i => i.reorder_point && i.quantity_on_hand <= i.reorder_point).length;
  const overstockCount = inventory.filter(i => i.safety_stock && i.quantity_on_hand > i.safety_stock * 3).length;

  const generateForecast = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an inventory optimization expert. Analyze this inventory data and provide stock forecasting and reorder recommendations.

Current Inventory Summary:
- Total SKUs: ${inventory.length}
- Total Value: SAR ${totalValue.toLocaleString()}
- Items Below Reorder Point: ${lowStockCount}
- Overstocked Items: ${overstockCount}

Sample Inventory Items:
${inventorySummary.slice(0, 15).map(i => 
  `- ${i.description} (${i.material}): Stock ${i.current_stock}, Reorder Point ${i.reorder_point}, Safety Stock ${i.safety_stock}, Value SAR ${i.value.toLocaleString()}`
).join('\n')}

Based on this data:
1. Identify items that need immediate attention (reorder urgently)
2. Suggest optimal reorder points based on current stock patterns
3. Identify slow-moving or excess inventory
4. Calculate potential savings from inventory optimization
5. Provide demand forecast assumptions

Focus on actionable recommendations for the next 30-90 days.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            urgent_reorders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  material: { type: "string" },
                  description: { type: "string" },
                  current_stock: { type: "number" },
                  recommended_order: { type: "number" },
                  urgency: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            overstock_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  material: { type: "string" },
                  description: { type: "string" },
                  excess_quantity: { type: "number" },
                  excess_value: { type: "number" },
                  recommendation: { type: "string" }
                }
              }
            },
            optimization_metrics: {
              type: "object",
              properties: {
                potential_savings: { type: "number" },
                stockout_risk_reduction: { type: "string" },
                inventory_turnover_improvement: { type: "string" }
              }
            },
            reorder_recommendations: { type: "array", items: { type: "string" } },
            demand_forecast: { type: "string" }
          }
        }
      });
      setForecast(result);
    } catch (error) {
      console.error("Forecast error:", error);
    }
    setLoading(false);
  };

  const urgencyColors = {
    "Critical": "#ef4444",
    "High": "#f59e0b",
    "Medium": "#3b82f6",
    "Low": "#10b981"
  };

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-500" />
            Inventory Demand Forecast
          </CardTitle>
          <Button onClick={generateForecast} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Analyze & Forecast
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {forecast && (
          <>
            {/* Optimization Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-sm text-muted-foreground mb-1">Potential Savings</div>
                <p className="text-xl font-bold text-green-600">
                  SAR {(forecast.optimization_metrics?.potential_savings || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-muted-foreground mb-1">Stockout Risk Reduction</div>
                <p className="text-lg font-bold text-blue-600">
                  {forecast.optimization_metrics?.stockout_risk_reduction}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-muted-foreground mb-1">Turnover Improvement</div>
                <p className="text-lg font-bold text-purple-600">
                  {forecast.optimization_metrics?.inventory_turnover_improvement}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-muted-foreground">{forecast.summary}</p>
            </div>

            {/* Urgent Reorders */}
            {forecast.urgent_reorders?.length > 0 && (
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Urgent Reorder Recommendations
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Recommended Order</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecast.urgent_reorders.slice(0, 5).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.description}</p>
                              <p className="text-xs text-muted-foreground">{item.material}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.current_stock}</TableCell>
                          <TableCell className="font-semibold text-blue-600">+{item.recommended_order}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: urgencyColors[item.urgency] + '20', color: urgencyColors[item.urgency] }}>
                              {item.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px]">{item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Overstock Items */}
            {forecast.overstock_items?.length > 0 && (
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-purple-500" />
                    Overstock / Slow-Moving Items
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  {forecast.overstock_items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">+{item.excess_quantity} excess</p>
                        <p className="text-xs text-muted-foreground">SAR {item.excess_value?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" /> Reorder Strategy Recommendations
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {forecast.reorder_recommendations?.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>

            {/* Demand Forecast */}
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" /> Demand Forecast
              </h4>
              <p className="text-sm text-muted-foreground">{forecast.demand_forecast}</p>
            </div>
          </>
        )}

        {!forecast && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Click "Analyze & Forecast" to get AI-powered inventory predictions and reorder recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}