import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, AlertCircle } from "lucide-react";
import moment from "moment";

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function PayablesReceivables({ vendorInvoices, salesInvoices }) {
  // Payables Analysis
  const totalPayables = vendorInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  const overduePayables = vendorInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled" && moment(i.due_date).isBefore(moment()))
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  // Receivables Analysis
  const totalReceivables = salesInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  const overdueReceivables = salesInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled" && moment(i.due_date).isBefore(moment()))
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  // Aging buckets
  const getAgingBucket = (dueDate) => {
    const days = moment().diff(moment(dueDate), 'days');
    if (days <= 0) return 'Current';
    if (days <= 30) return '1-30 Days';
    if (days <= 60) return '31-60 Days';
    return '60+ Days';
  };

  const payablesAging = vendorInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((acc, inv) => {
      const bucket = getAgingBucket(inv.due_date);
      const existing = acc.find(a => a.name === bucket);
      if (existing) existing.value += inv.gross_amount || 0;
      else acc.push({ name: bucket, value: inv.gross_amount || 0 });
      return acc;
    }, []);

  const receivablesAging = salesInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((acc, inv) => {
      const bucket = getAgingBucket(inv.due_date);
      const existing = acc.find(a => a.name === bucket);
      if (existing) existing.value += inv.gross_amount || 0;
      else acc.push({ name: bucket, value: inv.gross_amount || 0 });
      return acc;
    }, []);

  const bucketOrder = ['Current', '1-30 Days', '31-60 Days', '60+ Days'];
  payablesAging.sort((a, b) => bucketOrder.indexOf(a.name) - bucketOrder.indexOf(b.name));
  receivablesAging.sort((a, b) => bucketOrder.indexOf(a.name) - bucketOrder.indexOf(b.name));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Receivables</p>
                <p className="text-xl font-bold text-green-600">SAR {(totalReceivables / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueReceivables > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue Receivables</p>
                <p className="text-xl font-bold text-red-600">SAR {(overdueReceivables / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Payables</p>
                <p className="text-xl font-bold text-orange-600">SAR {(totalPayables / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={overduePayables > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue Payables</p>
                <p className="text-xl font-bold text-red-600">SAR {(overduePayables / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
              Receivables Aging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={receivablesAging} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                    {receivablesAging.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {receivablesAging.map((bucket, idx) => (
                <div key={bucket.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-sm">{bucket.name}</span>
                  </div>
                  <span className="text-sm font-medium">SAR {bucket.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-orange-500" />
              Payables Aging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payablesAging} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                    {payablesAging.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {payablesAging.map((bucket, idx) => (
                <div key={bucket.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-sm">{bucket.name}</span>
                  </div>
                  <span className="text-sm font-medium">SAR {bucket.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}