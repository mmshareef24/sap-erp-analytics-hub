import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Building2 } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function CostCenterAnalysis({ financialEntries }) {
  const costCenterData = financialEntries.reduce((acc, entry) => {
    const cc = entry.cost_center || "Unassigned";
    const existing = acc.find(c => c.cost_center === cc);
    if (existing) {
      existing.debit_total += entry.debit_amount || 0;
      existing.credit_total += entry.credit_amount || 0;
      existing.entry_count += 1;
    } else {
      acc.push({
        cost_center: cc,
        debit_total: entry.debit_amount || 0,
        credit_total: entry.credit_amount || 0,
        entry_count: 1
      });
    }
    return acc;
  }, []);

  const sortedCostCenters = costCenterData
    .map(c => ({ ...c, total_activity: c.debit_total + c.credit_total }))
    .sort((a, b) => b.total_activity - a.total_activity);

  const pieData = sortedCostCenters.slice(0, 6).map(c => ({
    name: c.cost_center,
    value: c.total_activity
  }));

  const totalActivity = sortedCostCenters.reduce((sum, c) => sum + c.total_activity, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              Cost Center Distribution
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
            <CardTitle>Debit vs Credit by Cost Center</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedCostCenters.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="cost_center" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="debit_total" fill="#22c55e" name="Debit" />
                  <Bar dataKey="credit_total" fill="#ef4444" name="Credit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Center Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost Center</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Total Debit</TableHead>
                <TableHead className="text-right">Total Credit</TableHead>
                <TableHead className="text-right">Total Activity</TableHead>
                <TableHead className="text-right">% Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCostCenters.map((cc, idx) => (
                <TableRow key={cc.cost_center}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-medium">{cc.cost_center}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{cc.entry_count}</TableCell>
                  <TableCell className="text-right text-green-600">SAR {cc.debit_total.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">SAR {cc.credit_total.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {cc.total_activity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{((cc.total_activity / totalActivity) * 100).toFixed(1)}%</Badge>
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