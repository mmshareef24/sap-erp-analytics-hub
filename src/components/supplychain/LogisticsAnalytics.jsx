import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Truck, Users, Clock, DollarSign, 
  AlertTriangle, CheckCircle, Lightbulb, Loader2, Sparkles 
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { base44 } from "@/api/base44Client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function LogisticsAnalytics({ shipments, suppliers, purchaseOrders }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Carrier performance
  const carrierData = shipments.reduce((acc, s) => {
    const carrier = s.carrier || "Unknown";
    const existing = acc.find(c => c.carrier === carrier);
    if (existing) {
      existing.total += 1;
      existing.freight += s.freight_cost || 0;
      if (s.status === "Delivered") {
        existing.delivered += 1;
        if (s.actual_delivery && s.expected_delivery && 
            new Date(s.actual_delivery) <= new Date(s.expected_delivery)) {
          existing.onTime += 1;
        }
      }
      if (s.status === "Delayed") existing.delayed += 1;
    } else {
      acc.push({ 
        carrier, 
        total: 1, 
        delivered: s.status === "Delivered" ? 1 : 0,
        onTime: (s.status === "Delivered" && s.actual_delivery && s.expected_delivery && 
                 new Date(s.actual_delivery) <= new Date(s.expected_delivery)) ? 1 : 0,
        delayed: s.status === "Delayed" ? 1 : 0,
        freight: s.freight_cost || 0
      });
    }
    return acc;
  }, []).map(c => ({
    ...c,
    onTimeRate: c.delivered > 0 ? (c.onTime / c.delivered * 100) : 0,
    avgFreight: c.total > 0 ? c.freight / c.total : 0
  })).sort((a, b) => b.total - a.total);

  // Monthly shipment trend
  const monthlyData = shipments.reduce((acc, s) => {
    const month = s.ship_date?.substring(0, 7) || "Unknown";
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.shipments += 1;
      existing.freight += s.freight_cost || 0;
    } else {
      acc.push({ month, shipments: 1, freight: s.freight_cost || 0 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  // Shipment type distribution
  const typeData = shipments.reduce((acc, s) => {
    const type = s.type || "Unknown";
    const existing = acc.find(t => t.type === type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ type, count: 1 });
    }
    return acc;
  }, []);

  // Supplier performance
  const supplierPerformance = suppliers
    .filter(s => s.status === "Active" && s.rating)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  // Metrics
  const totalFreight = shipments.reduce((sum, s) => sum + (s.freight_cost || 0), 0);
  const avgLeadTime = suppliers.filter(s => s.lead_time_days).length > 0
    ? suppliers.reduce((sum, s) => sum + (s.lead_time_days || 0), 0) / suppliers.filter(s => s.lead_time_days).length
    : 0;
  const delayedShipments = shipments.filter(s => s.status === "Delayed").length;

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this supply chain data and provide actionable insights:

Shipment Overview:
- Total Shipments: ${shipments.length}
- Delayed Shipments: ${delayedShipments}
- Total Freight Cost: SAR ${totalFreight.toLocaleString()}

Carrier Performance:
${carrierData.slice(0, 5).map(c => `- ${c.carrier}: ${c.total} shipments, ${c.onTimeRate.toFixed(0)}% on-time, SAR ${c.avgFreight.toFixed(0)} avg freight`).join('\n')}

Supplier Overview:
- Active Suppliers: ${suppliers.filter(s => s.status === "Active").length}
- Average Lead Time: ${avgLeadTime.toFixed(0)} days
- Top Rated Suppliers: ${supplierPerformance.map(s => `${s.name} (${s.rating}/5)`).join(', ')}

Provide 3-4 specific recommendations to optimize supply chain performance, reduce costs, and improve delivery reliability.`,
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
                <p className="text-sm text-muted-foreground">Total Freight Cost</p>
                <p className="text-2xl font-bold">SAR {(totalFreight / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Lead Time</p>
                <p className="text-2xl font-bold">{avgLeadTime.toFixed(0)} days</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Carriers</p>
                <p className="text-2xl font-bold">{carrierData.length}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delayed</p>
                <p className="text-2xl font-bold">{delayedShipments}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment & Freight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="shipments" fill="#3b82f6" name="Shipments" />
                  <Bar yAxisId="right" dataKey="freight" fill="#10b981" name="Freight (SAR)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="count"
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrier Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Carrier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {carrierData.slice(0, 5).map((carrier, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{carrier.carrier}</p>
                    <p className="text-sm text-muted-foreground">{carrier.total} shipments</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{carrier.onTimeRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">On-Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{carrier.delayed}</p>
                    <p className="text-xs text-muted-foreground">Delayed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">SAR {carrier.avgFreight.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Avg Cost</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-indigo-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" /> AI-Powered Insights
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
              Click "Generate Insights" to get AI-powered supply chain optimization recommendations
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}