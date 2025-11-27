import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, TrendingUp, Target } from "lucide-react";

export default function SalesmanWiseReport({ salesOrders }) {
  const salesmanData = salesOrders.reduce((acc, order) => {
    if (!order.salesperson_name) return acc;
    const existing = acc.find(s => s.salesperson_code === order.salesperson_code);
    if (existing) {
      existing.total_value += order.net_value || 0;
      existing.order_count += 1;
      if (order.status === "Completed" || order.status === "Delivered") {
        existing.completed_orders += 1;
      }
    } else {
      acc.push({
        salesperson_code: order.salesperson_code,
        salesperson_name: order.salesperson_name,
        total_value: order.net_value || 0,
        order_count: 1,
        completed_orders: (order.status === "Completed" || order.status === "Delivered") ? 1 : 0,
        region: order.region
      });
    }
    return acc;
  }, []);

  const sortedSalesmen = salesmanData.sort((a, b) => b.total_value - a.total_value);
  const totalRevenue = sortedSalesmen.reduce((sum, s) => sum + s.total_value, 0);
  const topPerformer = sortedSalesmen[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Top Performer</p>
                <p className="text-xl font-bold text-green-900">{topPerformer?.salesperson_name || "-"}</p>
                <p className="text-sm text-green-600">SAR {topPerformer?.total_value?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales Team</p>
                <p className="text-2xl font-bold">{sortedSalesmen.length}</p>
                <p className="text-sm text-muted-foreground">Active salespersons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. per Salesman</p>
                <p className="text-2xl font-bold">SAR {sortedSalesmen.length > 0 ? (totalRevenue / sortedSalesmen.length / 1000).toFixed(0) : 0}K</p>
                <p className="text-sm text-muted-foreground">Average revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salesman Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedSalesmen.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="salesperson_name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="total_value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salesman-Wise Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="w-32">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSalesmen.map((salesman, idx) => {
                const performancePercent = (salesman.total_value / (topPerformer?.total_value || 1)) * 100;
                return (
                  <TableRow key={salesman.salesperson_code}>
                    <TableCell>
                      <Badge variant={idx < 3 ? "default" : "secondary"}>#{idx + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{salesman.salesperson_name}</TableCell>
                    <TableCell className="text-muted-foreground">{salesman.salesperson_code}</TableCell>
                    <TableCell>{salesman.region || "-"}</TableCell>
                    <TableCell className="text-right">{salesman.order_count}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">{salesman.completed_orders}</span>
                      <span className="text-muted-foreground">/{salesman.order_count}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">SAR {salesman.total_value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Progress value={performancePercent} className="h-2" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}