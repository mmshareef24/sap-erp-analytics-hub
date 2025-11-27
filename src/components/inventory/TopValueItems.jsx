import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function TopValueItems({ inventory, topN = 10 }) {
  const sortedByValue = [...inventory].sort((a, b) => (b.value || 0) - (a.value || 0));
  const topItems = sortedByValue.slice(0, topN);
  const totalValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0);

  const chartData = topItems.map(item => ({
    name: item.material_number,
    value: item.value || 0,
    description: item.material_description
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Top {topN} Most Valuable Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Value']}
                labelFormatter={(label) => chartData.find(i => i.name === label)?.description}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topItems.map((item, idx) => {
              const percentage = totalValue > 0 ? ((item.value || 0) / totalValue) * 100 : 0;
              return (
                <TableRow key={item.material_number}>
                  <TableCell>
                    <Badge style={{ backgroundColor: COLORS[idx % COLORS.length] }}>#{idx + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{item.material_description}</p>
                      <p className="text-xs text-muted-foreground">{item.material_number}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity_on_hand?.toLocaleString()} {item.unit_of_measure}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {item.value?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}