import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Area } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import moment from "moment";

export default function MonthlyTrendReport({ salesOrders }) {
  // Aggregate by month
  const monthlyData = salesOrders.reduce((acc, order) => {
    const month = moment(order.order_date).format('YYYY-MM');
    const monthLabel = moment(order.order_date).format('MMM YYYY');
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.total_value += order.net_value || 0;
      existing.order_count += 1;
    } else {
      acc.push({
        month,
        monthLabel,
        total_value: order.net_value || 0,
        order_count: 1
      });
    }
    return acc;
  }, []);

  const sortedMonths = monthlyData.sort((a, b) => a.month.localeCompare(b.month));
  
  // Calculate month-over-month growth
  sortedMonths.forEach((month, idx) => {
    if (idx > 0) {
      const prevMonth = sortedMonths[idx - 1];
      month.growth = ((month.total_value - prevMonth.total_value) / prevMonth.total_value) * 100;
    } else {
      month.growth = 0;
    }
    month.avg_order_value = month.total_value / month.order_count;
  });

  const totalRevenue = sortedMonths.reduce((sum, m) => sum + m.total_value, 0);
  const avgMonthlyRevenue = totalRevenue / (sortedMonths.length || 1);
  const latestMonth = sortedMonths[sortedMonths.length - 1];
  const previousMonth = sortedMonths[sortedMonths.length - 2];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue (All Time)</p>
                <p className="text-2xl font-bold">SAR {(totalRevenue / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg. Monthly Revenue</p>
            <p className="text-2xl font-bold">SAR {(avgMonthlyRevenue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Current Month</p>
            <p className="text-2xl font-bold">SAR {((latestMonth?.total_value || 0) / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card className={latestMonth?.growth >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {latestMonth?.growth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Month-over-Month</p>
                <p className={`text-2xl font-bold ${latestMonth?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestMonth?.growth >= 0 ? '+' : ''}{latestMonth?.growth?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sortedMonths}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}`} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'total_value') return [`SAR ${value.toLocaleString()}`, 'Revenue'];
                      return [value, 'Orders'];
                    }}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="total_value" fill="hsl(var(--primary))" fillOpacity={0.2} stroke="hsl(var(--primary))" name="Revenue" />
                  <Bar yAxisId="right" dataKey="order_count" fill="#22c55e" name="Orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedMonths.slice(1)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Growth']} />
                  <Bar 
                    dataKey="growth" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg. Order Value</TableHead>
                <TableHead className="text-right">Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sortedMonths].reverse().map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.monthLabel}</TableCell>
                  <TableCell className="text-right">{month.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {month.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">SAR {month.avg_order_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="text-right">
                    {month.growth !== 0 && (
                      <Badge className={month.growth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}