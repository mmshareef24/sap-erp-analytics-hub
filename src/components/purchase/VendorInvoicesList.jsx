import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, AlertCircle } from "lucide-react";
import moment from "moment";

const statusColors = {
  "Posted": "bg-blue-100 text-blue-800",
  "Paid": "bg-green-100 text-green-800",
  "Partially Paid": "bg-yellow-100 text-yellow-800",
  "Blocked": "bg-red-100 text-red-800",
  "Cancelled": "bg-gray-100 text-gray-800"
};

export default function VendorInvoicesList({ vendorInvoices }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = vendorInvoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendor_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOpen = vendorInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  const overdueCount = vendorInvoices
    .filter(i => i.status !== "Paid" && i.status !== "Cancelled" && moment(i.due_date).isBefore(moment()))
    .length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Vendor Invoices</CardTitle>
            <div className="flex gap-4 mt-2 text-sm">
              <span>Open: <strong>SAR {(totalOpen / 1000).toFixed(0)}K</strong></span>
              {overdueCount > 0 && (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {overdueCount} overdue
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice or vendor..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Posted">Posted</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>PO Reference</TableHead>
                <TableHead className="text-right">Gross Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.slice(0, 15).map((inv) => {
                const isOverdue = inv.status !== "Paid" && inv.status !== "Cancelled" && moment(inv.due_date).isBefore(moment());
                return (
                  <TableRow key={inv.id} className={isOverdue ? "bg-red-50" : ""}>
                    <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inv.vendor_name}</p>
                        <p className="text-xs text-muted-foreground">{inv.vendor_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{inv.invoice_date}</TableCell>
                    <TableCell className={isOverdue ? "text-red-600 font-medium" : ""}>
                      {inv.due_date}
                      {isOverdue && <AlertCircle className="inline h-4 w-4 ml-1" />}
                    </TableCell>
                    <TableCell>{inv.po_reference || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {inv.currency || "SAR"} {inv.gross_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}