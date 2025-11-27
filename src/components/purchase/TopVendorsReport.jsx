import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy } from "lucide-react";

export default function TopVendorsReport({ purchaseOrders }) {
  const vendorData = purchaseOrders.reduce((acc, po) => {
    const key = po.vendor_code;
    const existing = acc.find(v => v.vendor_code === key);
    if (existing) {
      existing.total_value += po.net_value || 0;
      existing.order_count += 1;
      if (po.status === "Fully Received") existing.completed += 1;
    } else {
      acc.push({
        vendor_code: key,
        vendor_name: po.vendor_name,
        total_value: po.net_value || 0,
        order_count: 1,
        completed: po.status === "Fully Received" ? 1 : 0
      });
    }
    return acc;
  }, []);

  const topVendors = vendorData
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 10);

  const totalPurchases = topVendors.reduce((sum, v) => sum + v.total_value, 0);

  const chartData = topVendors.slice(0, 8).map(v => ({
    name: v.vendor_name?.substring(0, 15) || v.vendor_code,
    value: v.total_value
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Vendors by Purchase Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">PO Count</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">% Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVendors.map((vendor, idx) => (
                <TableRow key={vendor.vendor_code}>
                  <TableCell>
                    <Badge variant={idx < 3 ? "default" : "outline"}>#{idx + 1}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vendor.vendor_name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.vendor_code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{vendor.order_count}</TableCell>
                  <TableCell className="text-right">{vendor.completed}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {vendor.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{((vendor.total_value / totalPurchases) * 100).toFixed(1)}%</Badge>
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