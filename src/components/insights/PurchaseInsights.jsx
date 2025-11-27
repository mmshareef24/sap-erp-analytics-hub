import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, TrendingDown, Package, Truck, AlertTriangle, 
  CheckCircle, Lightbulb, Loader2, Sparkles, DollarSign
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

export default function PurchaseInsights({ purchaseOrders, vendorInvoices }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Calculate metrics
  const totalSpend = purchaseOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
  const totalPOs = purchaseOrders.length;
  const avgPOValue = totalPOs > 0 ? totalSpend / totalPOs : 0;

  const fullyReceived = purchaseOrders.filter(o => o.status === "Fully Received").length;
  const pendingPOs = purchaseOrders.filter(o => ["Created", "Approved", "Partially Received"].includes(o.status)).length;
  const fulfillmentRate = totalPOs > 0 ? (fullyReceived / totalPOs * 100) : 0;

  // Monthly trend
  const monthlyData = purchaseOrders.reduce((acc, order) => {
    const month = order.po_date?.substring(0, 7) || "Unknown";
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.spend += order.net_value || 0;
      existing.orders += 1;
    } else {
      acc.push({ month, spend: order.net_value || 0, orders: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  // Top vendors
  const vendorData = purchaseOrders.reduce((acc, order) => {
    const vendor = order.vendor_name || "Unknown";
    const existing = acc.find(v => v.name === vendor);
    if (existing) {
      existing.spend += order.net_value || 0;
      existing.orders += 1;
    } else {
      acc.push({ name: vendor, spend: order.net_value || 0, orders: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.spend - a.spend).slice(0, 5);

  // Status distribution
  const statusData = [
    { name: "Fully Received", value: fullyReceived, color: "#10b981" },
    { name: "Approved", value: purchaseOrders.filter(o => o.status === "Approved").length, color: "#3b82f6" },
    { name: "Partially Received", value: purchaseOrders.filter(o => o.status === "Partially Received").length, color: "#f59e0b" },
    { name: "Created", value: purchaseOrders.filter(o => o.status === "Created").length, color: "#8b5cf6" }
  ].filter(s => s.value > 0);

  // Invoice analysis
  const paidInvoices = vendorInvoices.filter(i => i.status === "Paid");
  const blockedInvoices = vendorInvoices.filter(i => i.status === "Blocked");
  const totalPayables = vendorInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  // Material group analysis
  const materialGroupData = purchaseOrders.reduce((acc, order) => {
    const group = order.material_group || "Other";
    const existing = acc.find(g => g.group === group);
    if (existing) {
      existing.spend += order.net_value || 0;
    } else {
      acc.push({ group, spend: order.net_value || 0 });
    }
    return acc;
  }, []).sort((a, b) => b.spend - a.spend).slice(0, 5);

  // Growth calculation
  const currentMonth = monthlyData[monthlyData.length - 1]?.spend || 0;
  const previousMonth = monthlyData[monthlyData.length - 2]?.spend || 0;
  const growthRate = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth * 100) : 0;

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this purchase/procurement data and provide actionable insights:
        
Total Spend: SAR ${totalSpend.toLocaleString()}
Total POs: ${totalPOs}
Average PO Value: SAR ${avgPOValue.toFixed(0)}
Fulfillment Rate: ${fulfillmentRate.toFixed(1)}%
Month-over-Month Change: ${growthRate.toFixed(1)}%
Pending POs: ${pendingPOs}
Blocked Invoices: ${blockedInvoices.length}
Outstanding Payables: SAR ${totalPayables.toLocaleString()}

Top 5 Vendors by Spend:
${vendorData.map(v => `- ${v.name}: SAR ${v.spend.toLocaleString()} (${v.orders} POs)`).join('\n')}

Top Material Groups:
${materialGroupData.map(g => `- ${g.group}: SAR ${g.spend.toLocaleString()}`).join('\n')}

Provide 3-4 specific recommendations to optimize procurement, reduce costs, and improve vendor relationships.`,
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
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">SAR {(totalSpend / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {growthRate <= 0 ? (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={growthRate <= 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(growthRate).toFixed(1)}% MoM
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total POs</p>
                <p className="text-2xl font-bold">{totalPOs}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{pendingPOs} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
                <p className="text-2xl font-bold">{fulfillmentRate.toFixed(0)}%</p>
              </div>
              <Truck className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{fullyReceived} received</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payables</p>
                <p className="text-2xl font-bold">SAR {(totalPayables / 1000).toFixed(0)}K</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-red-600 mt-2">{blockedInvoices.length} blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spend Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="spend" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PO Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor & Material Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" /> Top Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendorData.map((vendor, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{idx + 1}</span>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.orders} POs</p>
                    </div>
                  </div>
                  <p className="font-semibold">SAR {vendor.spend.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spend by Material Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialGroupData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="group" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Bar dataKey="spend" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-purple-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" /> AI-Powered Insights
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
              Click "Generate Insights" to get AI-powered recommendations for procurement optimization
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}