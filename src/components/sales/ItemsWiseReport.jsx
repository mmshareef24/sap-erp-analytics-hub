import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function ItemsWiseReport({ salesOrderItems }) {
  const itemData = salesOrderItems.reduce((acc, item) => {
    const existing = acc.find(i => i.material_number === item.material_number);
    if (existing) {
      existing.total_value += item.net_value || 0;
      existing.total_quantity += item.quantity || 0;
      existing.order_count += 1;
    } else {
      acc.push({
        material_number: item.material_number,
        material_description: item.material_description,
        total_value: item.net_value || 0,
        total_quantity: item.quantity || 0,
        unit_of_measure: item.unit_of_measure,
        order_count: 1
      });
    }
    return acc;
  }, []);

  const topItems = itemData.sort((a, b) => b.total_value - a.total_value).slice(0, 10);
  const totalRevenue = itemData.reduce((sum, i) => sum + i.total_value, 0);

  const pieData = topItems.map(item => ({
    name: item.material_description?.substring(0, 15) + "...",
    value: item.total_value,
    percentage: ((item.total_value / totalRevenue) * 100).toFixed(1)
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Top Items by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="material_number" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => topItems.find(i => i.material_number === label)?.material_description}
                  />
                  <Bar dataKey="total_value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ percentage }) => `${percentage}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item-Wise Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material #</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">% Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.map((item) => (
                <TableRow key={item.material_number}>
                  <TableCell className="font-mono text-sm">{item.material_number}</TableCell>
                  <TableCell className="font-medium">{item.material_description}</TableCell>
                  <TableCell className="text-right">{item.total_quantity.toLocaleString()}</TableCell>
                  <TableCell>{item.unit_of_measure}</TableCell>
                  <TableCell className="text-right">{item.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {item.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{((item.total_value / totalRevenue) * 100).toFixed(1)}%</Badge>
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