import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar, Loader2, Sparkles, Target, DollarSign, ShoppingCart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";
import { base44 } from "@/api/base44Client";

export default function SalesForecast({ salesOrders }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState("3");

  // Prepare historical data
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
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  const generateForecast = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a sales forecasting expert. Analyze this historical sales data and generate a ${forecastPeriod}-month forecast.

Historical Monthly Sales Data (last ${monthlyData.length} months):
${monthlyData.map(m => `${m.month}: Revenue SAR ${m.revenue.toLocaleString()}, Orders: ${m.orders}`).join('\n')}

Based on this data:
1. Identify trends (growth rate, seasonality patterns)
2. Generate monthly forecasts for the next ${forecastPeriod} months
3. Provide confidence levels and key assumptions
4. Calculate expected growth rate

Return forecasted values that are realistic based on the historical patterns. Use the current date of 2025-01 as reference for future months.`,
        response_json_schema: {
          type: "object",
          properties: {
            trend_analysis: { type: "string" },
            growth_rate: { type: "number" },
            confidence_level: { type: "string" },
            key_assumptions: { type: "array", items: { type: "string" } },
            monthly_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_revenue: { type: "number" },
                  predicted_orders: { type: "number" },
                  lower_bound: { type: "number" },
                  upper_bound: { type: "number" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });
      setForecast(result);
    } catch (error) {
      console.error("Forecast error:", error);
    }
    setLoading(false);
  };

  // Combine historical and forecast data for chart
  const chartData = forecast ? [
    ...monthlyData.slice(-6).map(m => ({ 
      month: m.month, 
      actual: m.revenue,
      type: "historical"
    })),
    ...forecast.monthly_forecast.map(f => ({
      month: f.month,
      predicted: f.predicted_revenue,
      lower: f.lower_bound,
      upper: f.upper_bound,
      type: "forecast"
    }))
  ] : monthlyData.slice(-6).map(m => ({ month: m.month, actual: m.revenue }));

  const totalForecastedRevenue = forecast?.monthly_forecast?.reduce((sum, f) => sum + f.predicted_revenue, 0) || 0;
  const totalForecastedOrders = forecast?.monthly_forecast?.reduce((sum, f) => sum + f.predicted_orders, 0) || 0;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Sales Revenue Forecast
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateForecast} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Forecast
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {forecast && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" /> Forecasted Revenue
              </div>
              <p className="text-xl font-bold text-blue-600">SAR {(totalForecastedRevenue / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ShoppingCart className="h-4 w-4" /> Forecasted Orders
              </div>
              <p className="text-xl font-bold text-green-600">{totalForecastedOrders}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" /> Growth Rate
              </div>
              <p className={`text-xl font-bold ${forecast.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {forecast.growth_rate >= 0 ? '+' : ''}{forecast.growth_rate?.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Target className="h-4 w-4" /> Confidence
              </div>
              <Badge variant="outline" className="text-base">{forecast.confidence_level}</Badge>
            </div>
          </div>
        )}

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => `SAR ${v?.toLocaleString()}`} />
              {forecast && (
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="none" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  name="Upper Bound"
                />
              )}
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} name="Actual" />
              {forecast && (
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#3b82f6" }} name="Forecast" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {forecast && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Trend Analysis</h4>
              <p className="text-sm text-muted-foreground">{forecast.trend_analysis}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Key Assumptions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {forecast.key_assumptions?.map((a, i) => <li key={i}>• {a}</li>)}
              </ul>
            </div>
          </div>
        )}

        {forecast?.recommendations && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" /> AI Recommendations
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {forecast.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </div>
        )}

        {!forecast && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Click "Generate Forecast" to predict future sales based on historical trends</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}