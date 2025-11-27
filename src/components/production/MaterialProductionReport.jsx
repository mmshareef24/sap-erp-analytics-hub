import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Box } from "lucide-react";

export default function MaterialProductionReport({ productionOrders }) {
  const materialData = productionOrders.reduce((acc, order) => {
    const key = order.material_number;
    const existing = acc.find(m => m.material_number === key);
    if (existing) {
      existing.order_count += 1;
      existing.planned_qty += order.planned_quantity || 0;
      existing.confirmed_qty += order.confirmed_quantity || 0;
      if (order.status === "Completed" || order.status === "Closed") existing.completed += 1;
    } else {
      acc.push({
        material_number: key,
        material_description: order.material_description,
        unit_of_measure: order.unit_of_measure,
        order_count: 1,
        planned_qty: order.planned_quantity || 0,
        confirmed_qty: order.confirmed_quantity || 0,
        completed: (order.status === "Completed" || order.status === "Closed") ? 1 : 0
      });
    }
    return acc;
  }, []);

  const sortedMaterials = materialData
    .map(m => ({
      ...m,
      efficiency: m.planned_qty > 0 ? (m.confirmed_qty / m.planned_qty) * 100 : 0
    }))
    .sort((a, b) => b.planned_qty - a.planned_qty);

  const chartData = sortedMaterials.slice(0, 8).map(m => ({
    name: m.material_description?.substring(0, 20) || m.material_number,
    planned: m.planned_qty,
    confirmed: m.confirmed_qty
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-orange-500" />
            Top Materials by Production Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
                <Bar dataKey="confirmed" fill="#22c55e" name="Confirmed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material Production Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Planned Qty</TableHead>
                <TableHead className="text-right">Confirmed Qty</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.slice(0, 10).map((material) => (
                <TableRow key={material.material_number}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{material.material_description}</p>
                      <p className="text-xs text-muted-foreground">{material.material_number}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{material.order_count}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-green-50">{material.completed}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{material.planned_qty.toLocaleString()} {material.unit_of_measure}</TableCell>
                  <TableCell className="text-right">{material.confirmed_qty.toLocaleString()} {material.unit_of_measure}</TableCell>
                  <TableCell className="w-[150px]">
                    <div className="flex items-center gap-2">
                      <Progress value={material.efficiency} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-12">{material.efficiency.toFixed(0)}%</span>
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