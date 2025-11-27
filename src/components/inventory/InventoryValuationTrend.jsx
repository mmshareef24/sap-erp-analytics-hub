import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import moment from "moment";

export default function InventoryValuationTrend({ inventory }) {
  // Simulate historical valuation data based on current inventory
  const totalCurrentValue = inventory.reduce((sum, item) => sum + (item.value || 0), 0);
  
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = moment().subtract(i, 'months');
    const variance = 0.85 + (Math.random() * 0.3); // Simulate 85%-115% of current value
    months.push({
      month: month.format('MMM YYYY'),
      value: Math.round(totalCurrentValue * variance),
      items: inventory.length + Math.floor((Math.random() - 0.5) * 10)
    });
  }

  const latestValue = months[months.length - 1]?.value || 0;
  const previousValue = months[months.length - 2]?.value || 0;
  const changePercent = previousValue > 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Inventory Valuation Trend
          </span>
          <span className={`text-sm font-normal ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {changePercent >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}% vs last month
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Value']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}