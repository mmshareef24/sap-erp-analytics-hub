import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

export default function TopCustomersReport({ salesOrders }) {
  const customerData = salesOrders.reduce((acc, order) => {
    const existing = acc.find(c => c.customer_code === order.customer_code);
    if (existing) {
      existing.total_value += order.net_value || 0;
      existing.order_count += 1;
    } else {
      acc.push({
        customer_code: order.customer_code,
        customer_name: order.customer_name,
        total_value: order.net_value || 0,
        order_count: 1,
        region: order.region
      });
    }
    return acc;
  }, []);

  const topCustomers = customerData
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Top 10 Customers by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="customer_name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="total_value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.map((customer, idx) => (
                <TableRow key={customer.customer_code}>
                  <TableCell>
                    <Badge variant={idx < 3 ? "default" : "secondary"} className={idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-amber-600" : ""}>
                      #{idx + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{customer.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.customer_code}</TableCell>
                  <TableCell>{customer.region || "-"}</TableCell>
                  <TableCell className="text-right">{customer.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {customer.total_value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}