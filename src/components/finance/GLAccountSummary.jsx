import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen } from "lucide-react";

export default function GLAccountSummary({ financialEntries }) {
  const glAccountData = financialEntries.reduce((acc, entry) => {
    const key = entry.gl_account;
    const existing = acc.find(a => a.gl_account === key);
    if (existing) {
      existing.debit_total += entry.debit_amount || 0;
      existing.credit_total += entry.credit_amount || 0;
      existing.entry_count += 1;
    } else {
      acc.push({
        gl_account: key,
        gl_account_name: entry.gl_account_name,
        debit_total: entry.debit_amount || 0,
        credit_total: entry.credit_amount || 0,
        entry_count: 1
      });
    }
    return acc;
  }, []);

  const sortedAccounts = glAccountData
    .map(a => ({ ...a, net_balance: a.debit_total - a.credit_total }))
    .sort((a, b) => Math.abs(b.net_balance) - Math.abs(a.net_balance));

  const chartData = sortedAccounts.slice(0, 8).map(a => ({
    name: a.gl_account,
    debit: a.debit_total,
    credit: a.credit_total
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            G/L Account Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                <Bar dataKey="debit" fill="#22c55e" name="Debit" />
                <Bar dataKey="credit" fill="#ef4444" name="Credit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>G/L Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>G/L Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Total Debit</TableHead>
                <TableHead className="text-right">Total Credit</TableHead>
                <TableHead className="text-right">Net Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAccounts.slice(0, 10).map((account) => (
                <TableRow key={account.gl_account}>
                  <TableCell className="font-mono font-medium">{account.gl_account}</TableCell>
                  <TableCell>{account.gl_account_name}</TableCell>
                  <TableCell className="text-right">{account.entry_count}</TableCell>
                  <TableCell className="text-right text-green-600">SAR {account.debit_total.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">SAR {account.credit_total.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={account.net_balance >= 0 ? "text-green-600" : "text-red-600"}>
                      SAR {account.net_balance.toLocaleString()}
                    </span>
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