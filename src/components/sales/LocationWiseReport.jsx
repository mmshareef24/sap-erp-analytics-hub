import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2 } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function LocationWiseReport({ salesOrders }) {
  // Region-wise aggregation
  const regionData = salesOrders.reduce((acc, order) => {
    const region = order.region || "Unassigned";
    const existing = acc.find(r => r.region === region);
    if (existing) {
      existing.total_value += order.net_value || 0;
      existing.order_count += 1;
      existing.customer_count = new Set([...existing.customers, order.customer_code]).size;
      existing.customers.add(order.customer_code);
    } else {
      acc.push({
        region,
        total_value: order.net_value || 0,
        order_count: 1,
        customers: new Set([order.customer_code]),
        customer_count: 1
      });
    }
    return acc;
  }, []);

  // City-wise aggregation
  const cityData = salesOrders.reduce((acc, order) => {
    const city = order.city || "Unknown";
    const existing = acc.find(c => c.city === city);
    if (existing) {
      existing.total_value += order.net_value || 0;
      existing.order_count += 1;
    } else {
      acc.push({
        city,
        region: order.region,
        total_value: order.net_value || 0,
        order_count: 1
      });
    }
    return acc;
  }, []);

  const sortedRegions = regionData.sort((a, b) => b.total_value - a.total_value);
  const sortedCities = cityData.sort((a, b) => b.total_value - a.total_value).slice(0, 10);
  const totalRevenue = sortedRegions.reduce((sum, r) => sum + r.total_value, 0);

  const pieData = sortedRegions.map(region => ({
    name: region.region,
    value: region.total_value
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Revenue by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Top 10 Cities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedCities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="city" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="total_value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Region-Wise Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Customers</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">% Share</TableHead>
                <TableHead className="text-right">Avg. Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRegions.map((region, idx) => (
                <TableRow key={region.region}>
                  <TableCell>
                    <Badge variant={idx < 3 ? "default" : "secondary"} style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                      #{idx + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{region.region}</TableCell>
                  <TableCell className="text-right">{region.customer_count}</TableCell>
                  <TableCell className="text-right">{region.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {region.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{((region.total_value / totalRevenue) * 100).toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    SAR {(region.total_value / region.order_count).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>City-Wise Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCities.map((city) => (
                <TableRow key={city.city}>
                  <TableCell className="font-medium">{city.city}</TableCell>
                  <TableCell>{city.region || "-"}</TableCell>
                  <TableCell className="text-right">{city.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {city.total_value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}