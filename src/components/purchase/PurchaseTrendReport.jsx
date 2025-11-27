import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Package, DollarSign } from "lucide-react";
import moment from "moment";

export default function PurchaseTrendReport({ purchaseOrders }) {
  const monthlyData = purchaseOrders.reduce((acc, po) => {
    const month = moment(po.po_date).format('YYYY-MM');
    const monthLabel = moment(po.po_date).format('MMM YYYY');
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.total_value += po.net_value || 0;
      existing.order_count += 1;
    } else {
      acc.push({
        month,
        monthLabel,
        total_value: po.net_value || 0,
        order_count: 1
      });
    }
    return acc;
  }, []);

  const sortedMonths = monthlyData.sort((a, b) => a.month.localeCompare(b.month));

  // Calculate growth
  sortedMonths.forEach((month, idx) => {
    if (idx > 0) {
      const prev = sortedMonths[idx - 1].total_value;
      month.growth = prev > 0 ? ((month.total_value - prev) / prev) * 100 : 0;
    } else {
      month.growth = 0;
    }
    month.avg_po_value = month.total_value / month.order_count;
  });

  const totalPurchases = sortedMonths.reduce((sum, m) => sum + m.total_value, 0);
  const totalOrders = sortedMonths.reduce((sum, m) => sum + m.order_count, 0);
  const avgMonthlySpend = sortedMonths.length > 0 ? totalPurchases / sortedMonths.length : 0;

  const latestMonth = sortedMonths[sortedMonths.length - 1];
  const previousMonth = sortedMonths[sortedMonths.length - 2];
  const momGrowth = latestMonth && previousMonth && previousMonth.total_value > 0
    ? ((latestMonth.total_value - previousMonth.total_value) / previousMonth.total_value) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-xl font-bold">SAR {(totalPurchases / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total POs</p>
                <p className="text-xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Monthly Spend</p>
            <p className="text-xl font-bold">SAR {(avgMonthlySpend / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {momGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">MoM Growth</p>
                <p className={`text-xl font-bold ${momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Value & Order Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sortedMonths}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(v, name) => [name === "order_count" ? v : `SAR ${v.toLocaleString()}`, name === "order_count" ? "PO Count" : "Value"]} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="total_value" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" name="Purchase Value" />
                <Bar yAxisId="right" dataKey="order_count" fill="#3b82f6" name="PO Count" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Purchase Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">PO Count</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Avg PO Value</TableHead>
                <TableHead className="text-right">Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sortedMonths].reverse().map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.monthLabel}</TableCell>
                  <TableCell className="text-right">{month.order_count}</TableCell>
                  <TableCell className="text-right font-semibold">SAR {month.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">SAR {month.avg_po_value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={month.growth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                    </Badge>
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