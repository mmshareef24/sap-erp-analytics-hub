import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, Warehouse, AlertTriangle, Package,
  CheckCircle, Lightbulb, Loader2, Sparkles, DollarSign
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function InventoryInsights({ inventory }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Calculate metrics
  const totalValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0);
  const totalItems = inventory.length;
  const totalQuantity = inventory.reduce((sum, i) => sum + (i.quantity_on_hand || 0), 0);

  // Low stock items
  const lowStockItems = inventory.filter(i => 
    i.reorder_point && i.quantity_on_hand <= i.reorder_point
  );

  // Overstocked items (quantity > 3x safety stock)
  const overstockedItems = inventory.filter(i => 
    i.safety_stock && i.quantity_on_hand > (i.safety_stock * 3)
  );

  // Plant distribution
  const plantData = inventory.reduce((acc, item) => {
    const plant = item.plant || "Unknown";
    const existing = acc.find(p => p.plant === plant);
    if (existing) {
      existing.value += item.value || 0;
      existing.items += 1;
    } else {
      acc.push({ plant, value: item.value || 0, items: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Material group distribution
  const materialGroupData = inventory.reduce((acc, item) => {
    const group = item.material_group || "Other";
    const existing = acc.find(g => g.group === group);
    if (existing) {
      existing.value += item.value || 0;
      existing.quantity += item.quantity_on_hand || 0;
    } else {
      acc.push({ group, value: item.value || 0, quantity: item.quantity_on_hand || 0 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 6);

  // Top value items
  const topValueItems = [...inventory]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5);

  // Stock health
  const healthyStock = inventory.filter(i => {
    if (!i.reorder_point) return true;
    return i.quantity_on_hand > i.reorder_point;
  }).length;
  const stockHealthRate = totalItems > 0 ? (healthyStock / totalItems * 100) : 0;

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this inventory data and provide actionable insights:
        
Total Inventory Value: SAR ${totalValue.toLocaleString()}
Total SKUs: ${totalItems}
Total Quantity: ${totalQuantity.toLocaleString()} units
Stock Health Rate: ${stockHealthRate.toFixed(1)}%
Low Stock Items: ${lowStockItems.length}
Overstocked Items: ${overstockedItems.length}

Top 5 Items by Value:
${topValueItems.map(i => `- ${i.material_description}: SAR ${(i.value || 0).toLocaleString()} (${i.quantity_on_hand} ${i.unit_of_measure})`).join('\n')}

Inventory by Plant:
${plantData.slice(0, 5).map(p => `- ${p.plant}: SAR ${p.value.toLocaleString()} (${p.items} items)`).join('\n')}

Material Groups:
${materialGroupData.map(g => `- ${g.group}: SAR ${g.value.toLocaleString()}`).join('\n')}

Provide 3-4 specific recommendations to optimize inventory levels, reduce carrying costs, and prevent stockouts.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiInsight(result);
    } catch (error) {
      console.error("AI insight error:", error);
    }
    setLoadingAI(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">SAR {(totalValue / 1000000).toFixed(1)}M</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{totalItems} SKUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-2xl font-bold">{(totalQuantity / 1000).toFixed(0)}K</p>
              </div>
              <Warehouse className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{plantData.length} plants</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Health</p>
                <p className="text-2xl font-bold">{stockHealthRate.toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={stockHealthRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold">{lowStockItems.length + overstockedItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {lowStockItems.length} low, {overstockedItems.length} over
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Value by Material Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ group, percent }) => `${group} ${(percent * 100).toFixed(0)}%`}
                  >
                    {materialGroupData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Value by Plant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plantData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plant" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items & Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> Top Value Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topValueItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{idx + 1}</span>
                    <div>
                      <p className="font-medium">{item.material_description}</p>
                      <p className="text-sm text-muted-foreground">{item.material_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">SAR {(item.value || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity_on_hand} {item.unit_of_measure}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.material_description}</p>
                    <p className="text-xs text-muted-foreground">{item.plant}</p>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
              {overstockedItems.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.material_description}</p>
                    <p className="text-xs text-muted-foreground">{item.plant}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Overstock</Badge>
                </div>
              ))}
              {lowStockItems.length === 0 && overstockedItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No stock alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-cyan-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" /> AI-Powered Insights
            </CardTitle>
            <Button onClick={generateAIInsight} disabled={loadingAI} size="sm">
              {loadingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Generate Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsight ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">{aiInsight.summary}</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {aiInsight.recommendations?.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Risks
                  </h4>
                  <ul className="space-y-1">
                    {aiInsight.risks?.map((risk, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {risk}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" /> Opportunities
                  </h4>
                  <ul className="space-y-1">
                    {aiInsight.opportunities?.map((opp, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Click "Generate Insights" to get AI-powered recommendations for inventory optimization
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}