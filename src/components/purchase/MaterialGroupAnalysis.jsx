import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Layers } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function MaterialGroupAnalysis({ purchaseOrders }) {
  const materialGroupData = purchaseOrders.reduce((acc, po) => {
    const group = po.material_group || "Unassigned";
    const existing = acc.find(m => m.material_group === group);
    if (existing) {
      existing.total_value += po.net_value || 0;
      existing.order_count += 1;
    } else {
      acc.push({
        material_group: group,
        total_value: po.net_value || 0,
        order_count: 1
      });
    }
    return acc;
  }, []);

  const sortedGroups = materialGroupData.sort((a, b) => b.total_value - a.total_value);
  const totalValue = sortedGroups.reduce((sum, g) => sum + g.total_value, 0);

  const pieData = sortedGroups.slice(0, 6).map(g => ({
    name: g.material_group,
    value: g.total_value
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-500" />
              Spend by Material Group
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
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PO Count by Material Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedGroups.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="material_group" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="order_count" fill="#3b82f6" name="PO Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Group Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Group</TableHead>
                <TableHead className="text-right">PO Count</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Avg PO Value</TableHead>
                <TableHead className="text-right">% Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.map((group, idx) => (
                <TableRow key={group.material_group}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-medium">{group.material_group}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{group.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {group.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">SAR {(group.total_value / group.order_count).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{((group.total_value / totalValue) * 100).toFixed(1)}%</Badge>
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