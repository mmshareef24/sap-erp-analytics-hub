import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package,
  AlertTriangle, CheckCircle, Lightbulb, BarChart3, Loader2, Sparkles
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function SalesInsights({ salesOrders, salesInvoices }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Calculate metrics
  const totalRevenue = salesOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
  const totalOrders = salesOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const completedOrders = salesOrders.filter(o => o.status === "Completed").length;
  const openOrders = salesOrders.filter(o => o.status === "Open").length;
  const cancelledOrders = salesOrders.filter(o => o.status === "Cancelled").length;
  const conversionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100) : 0;

  // Monthly trend
  const monthlyData = salesOrders.reduce((acc, order) => {
    const month = order.order_date?.substring(0, 7) || "Unknown";
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.revenue += order.net_value || 0;
      existing.orders += 1;
    } else {
      acc.push({ month, revenue: order.net_value || 0, orders: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  // Top customers
  const customerData = salesOrders.reduce((acc, order) => {
    const customer = order.customer_name || "Unknown";
    const existing = acc.find(c => c.name === customer);
    if (existing) {
      existing.revenue += order.net_value || 0;
      existing.orders += 1;
    } else {
      acc.push({ name: customer, revenue: order.net_value || 0, orders: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Status distribution
  const statusData = [
    { name: "Completed", value: completedOrders, color: "#10b981" },
    { name: "Open", value: openOrders, color: "#3b82f6" },
    { name: "In Process", value: salesOrders.filter(o => o.status === "In Process").length, color: "#f59e0b" },
    { name: "Cancelled", value: cancelledOrders, color: "#ef4444" }
  ].filter(s => s.value > 0);

  // Region performance
  const regionData = salesOrders.reduce((acc, order) => {
    const region = order.region || "Unknown";
    const existing = acc.find(r => r.region === region);
    if (existing) {
      existing.revenue += order.net_value || 0;
    } else {
      acc.push({ region, revenue: order.net_value || 0 });
    }
    return acc;
  }, []).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Invoice analysis
  const paidInvoices = salesInvoices.filter(i => i.status === "Paid");
  const overdueInvoices = salesInvoices.filter(i => i.status === "Overdue");
  const totalReceivables = salesInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  // Growth calculation
  const currentMonth = monthlyData[monthlyData.length - 1]?.revenue || 0;
  const previousMonth = monthlyData[monthlyData.length - 2]?.revenue || 0;
  const growthRate = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth * 100) : 0;

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this sales data and provide actionable business insights:
        
Total Revenue: SAR ${totalRevenue.toLocaleString()}
Total Orders: ${totalOrders}
Average Order Value: SAR ${avgOrderValue.toFixed(0)}
Conversion Rate: ${conversionRate.toFixed(1)}%
Month-over-Month Growth: ${growthRate.toFixed(1)}%
Open Orders: ${openOrders}
Cancelled Orders: ${cancelledOrders}
Overdue Invoices: ${overdueInvoices.length}
Outstanding Receivables: SAR ${totalReceivables.toLocaleString()}

Top 5 Customers by Revenue:
${customerData.map(c => `- ${c.name}: SAR ${c.revenue.toLocaleString()} (${c.orders} orders)`).join('\n')}

Top 5 Regions:
${regionData.map(r => `- ${r.region}: SAR ${r.revenue.toLocaleString()}`).join('\n')}

Provide 3-4 specific, actionable recommendations to improve sales performance. Be concise and practical.`,
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">SAR {(totalRevenue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              {growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={growthRate >= 0 ? "text-green-600" : "text-red-600"}>
                {growthRate.toFixed(1)}% MoM
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{openOrders} open orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">SAR {avgOrderValue.toFixed(0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{conversionRate.toFixed(0)}% conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receivables</p>
                <p className="text-2xl font-bold">SAR {(totalReceivables / 1000).toFixed(0)}K</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-red-600 mt-2">{overdueInvoices.length} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status Distribution</CardTitle>
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

      {/* Top Customers & Regions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{idx + 1}</span>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                    </div>
                  </div>
                  <p className="font-semibold">SAR {customer.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Region Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI-Powered Insights
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
              Click "Generate Insights" to get AI-powered recommendations based on your sales data
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}