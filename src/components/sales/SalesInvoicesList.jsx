import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, AlertCircle } from "lucide-react";
import moment from "moment";

const statusColors = {
  "Open": "bg-blue-100 text-blue-800",
  "Paid": "bg-green-100 text-green-800",
  "Partially Paid": "bg-yellow-100 text-yellow-800",
  "Overdue": "bg-red-100 text-red-800",
  "Cancelled": "bg-gray-100 text-gray-800"
};

export default function SalesInvoicesList({ salesInvoices }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = salesInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isOverdue = (invoice) => {
    if (invoice.status === "Paid" || invoice.status === "Cancelled") return false;
    return moment(invoice.due_date).isBefore(moment(), 'day');
  };

  const totalOpen = salesInvoices.filter(i => i.status === "Open").reduce((s, i) => s + i.gross_amount, 0);
  const totalOverdue = salesInvoices.filter(i => isOverdue(i)).reduce((s, i) => s + i.gross_amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{salesInvoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open Amount</p>
            <p className="text-2xl font-bold text-blue-600">SAR {(totalOpen / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Overdue Amount
            </p>
            <p className="text-2xl font-bold text-red-600">SAR {(totalOverdue / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid This Month</p>
            <p className="text-2xl font-bold text-green-600">
              {salesInvoices.filter(i => i.status === "Paid").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Sales Invoices</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Gross Amount</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.slice(0, 20).map((invoice) => (
                  <TableRow key={invoice.id} className={isOverdue(invoice) ? "bg-red-50" : ""}>
                    <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.order_number || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{invoice.customer_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.invoice_date}</TableCell>
                    <TableCell className={isOverdue(invoice) ? "text-red-600 font-medium" : ""}>
                      {invoice.due_date}
                      {isOverdue(invoice) && <span className="ml-1 text-xs">(Overdue)</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {invoice.currency || "SAR"} {invoice.gross_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {invoice.currency || "SAR"} {invoice.tax_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={isOverdue(invoice) ? statusColors["Overdue"] : statusColors[invoice.status]}>
                        {isOverdue(invoice) ? "Overdue" : invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Showing {Math.min(20, filteredInvoices.length)} of {filteredInvoices.length} invoices
          </p>
        </CardContent>
      </Card>
    </div>
  );
}