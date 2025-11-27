import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, Legend } from "recharts";
import { TrendingUp, Factory, CheckCircle2, Clock } from "lucide-react";
import moment from "moment";

export default function ProductionTrendReport({ productionOrders }) {
  const monthlyData = productionOrders.reduce((acc, order) => {
    const month = moment(order.start_date).format('YYYY-MM');
    const monthLabel = moment(order.start_date).format('MMM YYYY');
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.order_count += 1;
      existing.planned_qty += order.planned_quantity || 0;
      existing.confirmed_qty += order.confirmed_quantity || 0;
      if (order.status === "Completed" || order.status === "Closed") existing.completed += 1;
    } else {
      acc.push({
        month,
        monthLabel,
        order_count: 1,
        planned_qty: order.planned_quantity || 0,
        confirmed_qty: order.confirmed_quantity || 0,
        completed: (order.status === "Completed" || order.status === "Closed") ? 1 : 0
      });
    }
    return acc;
  }, []);

  const sortedMonths = monthlyData
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      ...m,
      efficiency: m.planned_qty > 0 ? (m.confirmed_qty / m.planned_qty) * 100 : 0,
      completion_rate: m.order_count > 0 ? (m.completed / m.order_count) * 100 : 0
    }));

  const totalOrders = productionOrders.length;
  const totalPlanned = productionOrders.reduce((sum, o) => sum + (o.planned_quantity || 0), 0);
  const totalConfirmed = productionOrders.reduce((sum, o) => sum + (o.confirmed_quantity || 0), 0);
  const completedOrders = productionOrders.filter(o => o.status === "Completed" || o.status === "Closed").length;
  const overallEfficiency = totalPlanned > 0 ? (totalConfirmed / totalPlanned) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Factory className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Planned Qty</p>
                <p className="text-xl font-bold">{totalPlanned.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${overallEfficiency >= 80 ? 'text-green-500' : 'text-yellow-500'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Overall Efficiency</p>
                <p className={`text-xl font-bold ${overallEfficiency >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {overallEfficiency.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Volume & Efficiency Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sortedMonths}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="planned_qty" fill="#3b82f6" name="Planned Qty" />
                <Bar yAxisId="left" dataKey="confirmed_qty" fill="#22c55e" name="Confirmed Qty" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#8b5cf6" strokeWidth={2} name="Efficiency %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Production Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Planned Qty</TableHead>
                <TableHead className="text-right">Confirmed Qty</TableHead>
                <TableHead className="text-right">Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sortedMonths].reverse().map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.monthLabel}</TableCell>
                  <TableCell className="text-right">{month.order_count}</TableCell>
                  <TableCell className="text-right">{month.completed}</TableCell>
                  <TableCell className="text-right">{month.planned_qty.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{month.confirmed_qty.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={month.efficiency >= 80 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {month.efficiency.toFixed(1)}%
                    </Badge>
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