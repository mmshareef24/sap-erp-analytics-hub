import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import moment from "moment";

export default function ProfitLossReport({ financialEntries }) {
  // Group by month
  const monthlyData = financialEntries.reduce((acc, entry) => {
    const month = moment(entry.posting_date).format('YYYY-MM');
    const monthLabel = moment(entry.posting_date).format('MMM YYYY');
    const existing = acc.find(m => m.month === month);
    
    // Simple P&L categorization based on GL account ranges
    const isRevenue = entry.gl_account?.startsWith('4');
    const isExpense = entry.gl_account?.startsWith('5') || entry.gl_account?.startsWith('6');
    
    if (existing) {
      if (isRevenue) existing.revenue += entry.credit_amount || 0;
      if (isExpense) existing.expenses += entry.debit_amount || 0;
    } else {
      acc.push({
        month,
        monthLabel,
        revenue: isRevenue ? (entry.credit_amount || 0) : 0,
        expenses: isExpense ? (entry.debit_amount || 0) : 0
      });
    }
    return acc;
  }, []);

  const sortedMonths = monthlyData
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, profit: m.revenue - m.expenses }));

  const totalRevenue = sortedMonths.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = sortedMonths.reduce((sum, m) => sum + m.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">SAR {(totalRevenue / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">SAR {(totalExpenses / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={netProfit >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                <DollarSign className={`h-5 w-5 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  SAR {(netProfit / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Profit Margin</p>
            <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sortedMonths}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Net Profit" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Profit/Loss</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sortedMonths].reverse().map((month) => {
                const margin = month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0;
                return (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.monthLabel}</TableCell>
                    <TableCell className="text-right text-green-600">SAR {month.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-600">SAR {month.expenses.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={month.profit >= 0 ? "text-green-600" : "text-red-600"}>
                        SAR {month.profit.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={margin >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}