import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function SalesChart({ data }) {
  const chartData = data.reduce((acc, order) => {
    const month = new Date(order.order_date).toLocaleDateString('en-US', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.value += order.net_value;
      existing.count += 1;
    } else {
      acc.push({ month, value: order.net_value, count: 1 });
    }
    return acc;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sales Orders by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value) => [`SAR ${value.toLocaleString()}`, 'Value']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}