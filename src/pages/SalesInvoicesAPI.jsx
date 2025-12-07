import { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, FileText, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SalesInvoicesAPI() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseInfo, setResponseInfo] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('getSalesInvoices');
      
      if (response.data.success) {
        setInvoices(response.data.data);
        setResponseInfo({ count: response.data.count, success: response.data.success });
      } else {
        setError("Failed to fetch invoices");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const exportToJSON = () => {
    const dataStr = JSON.stringify(invoices, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales_invoices.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusColors = {
    "Open": "bg-blue-100 text-blue-800",
    "Paid": "bg-green-100 text-green-800",
    "Partially Paid": "bg-yellow-100 text-yellow-800",
    "Overdue": "bg-red-100 text-red-800",
    "Cancelled": "bg-gray-100 text-gray-800"
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Sales Invoices API
            </h1>
            <p className="text-muted-foreground mt-1">
              Data fetched from backend function: getSalesInvoices
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToJSON} variant="outline" disabled={loading || invoices.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={fetchInvoices} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {responseInfo && (
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <Badge variant="outline">
              Total Records: {responseInfo.count}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Status: Success
            </Badge>
          </div>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Loading sales invoices...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Records ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Gross Amount</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Region</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{invoice.invoice_date}</TableCell>
                        <TableCell>{invoice.due_date}</TableCell>
                        <TableCell className="text-right">
                          {invoice.gross_amount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.net_amount?.toLocaleString()}
                        </TableCell>
                        <TableCell>{invoice.currency}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[invoice.status] || "bg-gray-100 text-gray-800"}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{invoice.region}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}