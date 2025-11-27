import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Building } from "lucide-react";

export default function PlantAnalysis({ productionOrders }) {
  const plantData = productionOrders.reduce((acc, order) => {
    const plant = order.plant || "Unknown";
    const existing = acc.find(p => p.plant === plant);
    if (existing) {
      existing.order_count += 1;
      existing.planned_qty += order.planned_quantity || 0;
      existing.confirmed_qty += order.confirmed_quantity || 0;
      if (order.status === "Completed" || order.status === "Closed") existing.completed += 1;
      if (order.status === "In Process") existing.in_process += 1;
      if (order.status === "Released") existing.released += 1;
    } else {
      acc.push({
        plant,
        order_count: 1,
        planned_qty: order.planned_quantity || 0,
        confirmed_qty: order.confirmed_quantity || 0,
        completed: (order.status === "Completed" || order.status === "Closed") ? 1 : 0,
        in_process: order.status === "In Process" ? 1 : 0,
        released: order.status === "Released" ? 1 : 0
      });
    }
    return acc;
  }, []);

  const sortedPlants = plantData
    .map(p => ({
      ...p,
      efficiency: p.planned_qty > 0 ? (p.confirmed_qty / p.planned_qty) * 100 : 0
    }))
    .sort((a, b) => b.order_count - a.order_count);

  const chartData = sortedPlants.map(p => ({
    name: p.plant,
    "Completed": p.completed,
    "In Process": p.in_process,
    "Released": p.released,
    "Other": p.order_count - p.completed - p.in_process - p.released
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-500" />
            Production Orders by Plant & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Completed" stackId="a" fill="#22c55e" />
                <Bar dataKey="In Process" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Released" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Other" stackId="a" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plant Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plant</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Released</TableHead>
                <TableHead className="text-right">In Process</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Total Planned</TableHead>
                <TableHead>Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlants.map((plant) => (
                <TableRow key={plant.plant}>
                  <TableCell className="font-medium">{plant.plant}</TableCell>
                  <TableCell className="text-right">{plant.order_count}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-blue-50">{plant.released}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-yellow-50">{plant.in_process}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-green-50">{plant.completed}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{plant.planned_qty.toLocaleString()}</TableCell>
                  <TableCell className="w-[150px]">
                    <div className="flex items-center gap-2">
                      <Progress value={plant.efficiency} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-12">{plant.efficiency.toFixed(0)}%</span>
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