import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Cpu } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function WorkCenterAnalysis({ productionOrders }) {
  const workCenterData = productionOrders.reduce((acc, order) => {
    const wc = order.work_center || "Unassigned";
    const existing = acc.find(w => w.work_center === wc);
    if (existing) {
      existing.order_count += 1;
      existing.planned_qty += order.planned_quantity || 0;
      existing.confirmed_qty += order.confirmed_quantity || 0;
      if (order.status === "Completed" || order.status === "Closed") existing.completed += 1;
      if (order.status === "In Process") existing.in_process += 1;
    } else {
      acc.push({
        work_center: wc,
        order_count: 1,
        planned_qty: order.planned_quantity || 0,
        confirmed_qty: order.confirmed_quantity || 0,
        completed: (order.status === "Completed" || order.status === "Closed") ? 1 : 0,
        in_process: order.status === "In Process" ? 1 : 0
      });
    }
    return acc;
  }, []);

  const sortedWorkCenters = workCenterData
    .map(wc => ({
      ...wc,
      efficiency: wc.planned_qty > 0 ? (wc.confirmed_qty / wc.planned_qty) * 100 : 0,
      completion_rate: wc.order_count > 0 ? (wc.completed / wc.order_count) * 100 : 0
    }))
    .sort((a, b) => b.order_count - a.order_count);

  const pieData = sortedWorkCenters.slice(0, 6).map(wc => ({
    name: wc.work_center,
    value: wc.order_count
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              Orders by Work Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Efficiency by Work Center</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedWorkCenters.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="work_center" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="efficiency" fill="#22c55e" name="Efficiency %" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Center Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work Center</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">In Process</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Planned Qty</TableHead>
                <TableHead className="text-right">Confirmed Qty</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedWorkCenters.map((wc, idx) => (
                <TableRow key={wc.work_center}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-medium">{wc.work_center}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{wc.order_count}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-yellow-50">{wc.in_process}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-green-50">{wc.completed}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{wc.planned_qty.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{wc.confirmed_qty.toLocaleString()}</TableCell>
                  <TableCell className="w-[150px]">
                    <div className="flex items-center gap-2">
                      <Progress value={wc.efficiency} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-12">{wc.efficiency.toFixed(0)}%</span>
                    </div>
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