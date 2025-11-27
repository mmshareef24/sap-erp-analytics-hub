import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";

const fieldLabels = {
  order_number: "Order Number",
  customer_name: "Customer Name",
  customer_code: "Customer Code",
  order_date: "Order Date",
  delivery_date: "Delivery Date",
  net_value: "Net Value",
  currency: "Currency",
  status: "Status",
  sales_org: "Sales Org",
  material_group: "Material Group",
  salesperson_name: "Salesperson",
  region: "Region",
  city: "City",
  invoice_number: "Invoice Number",
  invoice_date: "Invoice Date",
  due_date: "Due Date",
  gross_amount: "Gross Amount",
  net_amount: "Net Amount",
  tax_amount: "Tax Amount",
  po_number: "PO Number",
  vendor_name: "Vendor Name",
  vendor_code: "Vendor Code",
  po_date: "PO Date",
  purchasing_org: "Purchasing Org",
  po_reference: "PO Reference",
  material_number: "Material Number",
  material_description: "Material Description",
  plant: "Plant",
  storage_location: "Storage Location",
  quantity_on_hand: "Quantity On Hand",
  unit_of_measure: "Unit",
  value: "Value",
  reorder_point: "Reorder Point",
  safety_stock: "Safety Stock",
  order_type: "Order Type",
  planned_quantity: "Planned Qty",
  confirmed_quantity: "Confirmed Qty",
  start_date: "Start Date",
  end_date: "End Date",
  work_center: "Work Center",
  document_number: "Document Number",
  company_code: "Company Code",
  fiscal_year: "Fiscal Year",
  posting_date: "Posting Date",
  document_type: "Document Type",
  gl_account: "G/L Account",
  gl_account_name: "G/L Account Name",
  debit_amount: "Debit Amount",
  credit_amount: "Credit Amount",
  cost_center: "Cost Center",
  profit_center: "Profit Center"
};

export default function ReportViewer({ report, onBack }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: rawData = [], isLoading, refetch } = useQuery({
    queryKey: ["report-data", report.module, refreshKey],
    queryFn: () => base44.entities[report.module].list()
  });

  const filteredData = useMemo(() => {
    let result = [...rawData];

    // Apply filters
    if (report.filters?.length > 0) {
      result = result.filter(item => {
        return report.filters.every(filter => {
          const value = item[filter.field];
          const filterValue = filter.value;
          const filterValue2 = filter.value2;

          switch (filter.operator) {
            case "equals":
              return String(value).toLowerCase() === String(filterValue).toLowerCase();
            case "contains":
              return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case "starts_with":
              return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case "greater_than":
              return Number(value) > Number(filterValue);
            case "less_than":
              return Number(value) < Number(filterValue);
            case "after":
              return new Date(value) > new Date(filterValue);
            case "before":
              return new Date(value) < new Date(filterValue);
            case "between":
              if (typeof value === "number") {
                return Number(value) >= Number(filterValue) && Number(value) <= Number(filterValue2);
              }
              return new Date(value) >= new Date(filterValue) && new Date(value) <= new Date(filterValue2);
            case "in":
              return filterValue.split(",").map(v => v.trim().toLowerCase()).includes(String(value).toLowerCase());
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (report.sort_by) {
      result.sort((a, b) => {
        const aVal = a[report.sort_by];
        const bVal = b[report.sort_by];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return report.sort_order === "asc" ? aVal - bVal : bVal - aVal;
        }
        const comparison = String(aVal || "").localeCompare(String(bVal || ""));
        return report.sort_order === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [rawData, report]);

  const groupedData = useMemo(() => {
    if (!report.group_by) return null;

    const groups = {};
    filteredData.forEach(item => {
      const key = item[report.group_by] || "Other";
      if (!groups[key]) {
        groups[key] = { items: [], totals: {} };
      }
      groups[key].items.push(item);
    });

    // Calculate totals for numeric fields
    Object.keys(groups).forEach(key => {
      report.selected_fields.forEach(field => {
        const values = groups[key].items.map(i => i[field]).filter(v => typeof v === "number");
        if (values.length > 0) {
          groups[key].totals[field] = values.reduce((a, b) => a + b, 0);
        }
      });
    });

    return groups;
  }, [filteredData, report]);

  const formatValue = (value, field) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      if (field.includes("amount") || field.includes("value") || field === "value") {
        return `SAR ${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const exportToCSV = () => {
    const headers = report.selected_fields.map(f => fieldLabels[f] || f);
    const rows = filteredData.map(item => 
      report.selected_fields.map(f => item[f] ?? "")
    );
    
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{report.name}</h1>
            <p className="text-muted-foreground">{report.description || "Custom report"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setRefreshKey(k => k + 1); refetch(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Report Results</CardTitle>
            <Badge variant="outline">{filteredData.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groupedData ? (
            <div className="space-y-6">
              {Object.entries(groupedData).map(([groupName, group]) => (
                <div key={groupName} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-semibold flex items-center justify-between">
                    <span>{fieldLabels[report.group_by] || report.group_by}: {groupName}</span>
                    <Badge>{group.items.length} items</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {report.selected_fields.filter(f => f !== report.group_by).map(field => (
                            <TableHead key={field}>{fieldLabels[field] || field}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item, idx) => (
                          <TableRow key={idx}>
                            {report.selected_fields.filter(f => f !== report.group_by).map(field => (
                              <TableCell key={field}>
                                {field === "status" ? (
                                  <Badge variant="outline">{item[field]}</Badge>
                                ) : (
                                  formatValue(item[field], field)
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        {Object.keys(group.totals).length > 0 && (
                          <TableRow className="bg-gray-50 font-semibold">
                            {report.selected_fields.filter(f => f !== report.group_by).map((field, idx) => (
                              <TableCell key={field}>
                                {idx === 0 ? "Subtotal" : group.totals[field] !== undefined ? formatValue(group.totals[field], field) : ""}
                              </TableCell>
                            ))}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.selected_fields.map(field => (
                      <TableHead key={field}>{fieldLabels[field] || field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 100).map((item, idx) => (
                    <TableRow key={idx}>
                      {report.selected_fields.map(field => (
                        <TableCell key={field}>
                          {field === "status" ? (
                            <Badge variant="outline">{item[field]}</Badge>
                          ) : (
                            formatValue(item[field], field)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData.length > 100 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Showing first 100 of {filteredData.length} records. Export to CSV for full data.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}