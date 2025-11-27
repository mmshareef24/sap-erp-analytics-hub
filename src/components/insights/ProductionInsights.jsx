import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, Factory, AlertTriangle, Settings,
  CheckCircle, Lightbulb, Loader2, Sparkles, Target
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { base44 } from "@/api/base44Client";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

export default function ProductionInsights({ productionOrders }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Calculate metrics
  const totalOrders = productionOrders.length;
  const totalPlanned = productionOrders.reduce((sum, o) => sum + (o.planned_quantity || 0), 0);
  const totalConfirmed = productionOrders.reduce((sum, o) => sum + (o.confirmed_quantity || 0), 0);
  const overallEfficiency = totalPlanned > 0 ? (totalConfirmed / totalPlanned * 100) : 0;

  const completedOrders = productionOrders.filter(o => ["Completed", "Closed"].includes(o.status)).length;
  const inProcessOrders = productionOrders.filter(o => o.status === "In Process").length;
  const releasedOrders = productionOrders.filter(o => o.status === "Released").length;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0;

  // Monthly trend
  const monthlyData = productionOrders.reduce((acc, order) => {
    const month = order.start_date?.substring(0, 7) || "Unknown";
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.planned += order.planned_quantity || 0;
      existing.confirmed += order.confirmed_quantity || 0;
      existing.orders += 1;
    } else {
      acc.push({ 
        month, 
        planned: order.planned_quantity || 0, 
        confirmed: order.confirmed_quantity || 0,
        orders: 1 
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  // Add efficiency to monthly data
  monthlyData.forEach(m => {
    m.efficiency = m.planned > 0 ? (m.confirmed / m.planned * 100) : 0;
  });

  // Work center performance
  const workCenterData = productionOrders.reduce((acc, order) => {
    const wc = order.work_center || "Unknown";
    const existing = acc.find(w => w.workCenter === wc);
    if (existing) {
      existing.planned += order.planned_quantity || 0;
      existing.confirmed += order.confirmed_quantity || 0;
      existing.orders += 1;
    } else {
      acc.push({ 
        workCenter: wc, 
        planned: order.planned_quantity || 0, 
        confirmed: order.confirmed_quantity || 0,
        orders: 1 
      });
    }
    return acc;
  }, []).map(wc => ({
    ...wc,
    efficiency: wc.planned > 0 ? (wc.confirmed / wc.planned * 100) : 0
  })).sort((a, b) => b.orders - a.orders).slice(0, 6);

  // Status distribution
  const statusData = [
    { name: "Completed", value: completedOrders, color: "#10b981" },
    { name: "In Process", value: inProcessOrders, color: "#f59e0b" },
    { name: "Released", value: releasedOrders, color: "#3b82f6" },
    { name: "Created", value: productionOrders.filter(o => o.status === "Created").length, color: "#8b5cf6" }
  ].filter(s => s.value > 0);

  // Plant performance
  const plantData = productionOrders.reduce((acc, order) => {
    const plant = order.plant || "Unknown";
    const existing = acc.find(p => p.plant === plant);
    if (existing) {
      existing.planned += order.planned_quantity || 0;
      existing.confirmed += order.confirmed_quantity || 0;
      existing.orders += 1;
    } else {
      acc.push({ 
        plant, 
        planned: order.planned_quantity || 0, 
        confirmed: order.confirmed_quantity || 0,
        orders: 1 
      });
    }
    return acc;
  }, []).map(p => ({
    ...p,
    efficiency: p.planned > 0 ? (p.confirmed / p.planned * 100) : 0
  })).sort((a, b) => b.orders - a.orders);

  // Underperforming work centers
  const underperformingWC = workCenterData.filter(wc => wc.efficiency < 80);

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this production data and provide actionable insights:
        
Total Production Orders: ${totalOrders}
Completed Orders: ${completedOrders}
Completion Rate: ${completionRate.toFixed(1)}%
Overall Efficiency: ${overallEfficiency.toFixed(1)}%
Total Planned Quantity: ${totalPlanned.toLocaleString()}
Total Confirmed Quantity: ${totalConfirmed.toLocaleString()}
Orders In Process: ${inProcessOrders}
Released Orders: ${releasedOrders}

Work Center Performance:
${workCenterData.map(wc => `- ${wc.workCenter}: ${wc.efficiency.toFixed(1)}% efficiency (${wc.orders} orders)`).join('\n')}

Plant Performance:
${plantData.slice(0, 5).map(p => `- ${p.plant}: ${p.efficiency.toFixed(1)}% efficiency (${p.orders} orders)`).join('\n')}

Underperforming Work Centers (<80% efficiency): ${underperformingWC.length}

Provide 3-4 specific recommendations to improve production efficiency, reduce bottlenecks, and optimize capacity.`,
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
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <Factory className="h-8 w-8 text-pink-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{inProcessOrders} in process</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold">{overallEfficiency.toFixed(0)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={overallEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Underperforming</p>
                <p className="text-2xl font-bold">{underperformingWC.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">work centers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Production Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="planned" fill="#3b82f6" name="Planned" />
                  <Bar yAxisId="left" dataKey="confirmed" fill="#10b981" name="Confirmed" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} name="Efficiency %" />
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

      {/* Work Center & Plant Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" /> Work Center Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workCenterData.slice(0, 5).map((wc, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{wc.workCenter}</span>
                    <span className={`text-sm font-semibold ${wc.efficiency >= 80 ? 'text-green-600' : wc.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {wc.efficiency.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={wc.efficiency} 
                    className={wc.efficiency >= 80 ? '' : wc.efficiency >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{wc.orders} orders</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plant Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plantData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plant" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="efficiency" fill="#ec4899" radius={[4, 4, 0, 0]} name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-pink-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" /> AI-Powered Insights
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
              Click "Generate Insights" to get AI-powered recommendations for production optimization
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}