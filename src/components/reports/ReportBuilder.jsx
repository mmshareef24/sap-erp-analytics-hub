import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, X, Save, Loader2 } from "lucide-react";

const moduleFields = {
  SalesOrder: [
    { key: "order_number", label: "Order Number", type: "string" },
    { key: "customer_name", label: "Customer Name", type: "string" },
    { key: "customer_code", label: "Customer Code", type: "string" },
    { key: "order_date", label: "Order Date", type: "date" },
    { key: "delivery_date", label: "Delivery Date", type: "date" },
    { key: "net_value", label: "Net Value", type: "number" },
    { key: "currency", label: "Currency", type: "string" },
    { key: "status", label: "Status", type: "enum", options: ["Open", "In Process", "Delivered", "Completed", "Cancelled"] },
    { key: "sales_org", label: "Sales Org", type: "string" },
    { key: "material_group", label: "Material Group", type: "string" },
    { key: "salesperson_name", label: "Salesperson", type: "string" },
    { key: "region", label: "Region", type: "string" },
    { key: "city", label: "City", type: "string" }
  ],
  SalesInvoice: [
    { key: "invoice_number", label: "Invoice Number", type: "string" },
    { key: "order_number", label: "Order Number", type: "string" },
    { key: "customer_name", label: "Customer Name", type: "string" },
    { key: "invoice_date", label: "Invoice Date", type: "date" },
    { key: "due_date", label: "Due Date", type: "date" },
    { key: "gross_amount", label: "Gross Amount", type: "number" },
    { key: "net_amount", label: "Net Amount", type: "number" },
    { key: "tax_amount", label: "Tax Amount", type: "number" },
    { key: "status", label: "Status", type: "enum", options: ["Open", "Paid", "Partially Paid", "Overdue", "Cancelled"] },
    { key: "salesperson_name", label: "Salesperson", type: "string" },
    { key: "region", label: "Region", type: "string" }
  ],
  PurchaseOrder: [
    { key: "po_number", label: "PO Number", type: "string" },
    { key: "vendor_name", label: "Vendor Name", type: "string" },
    { key: "vendor_code", label: "Vendor Code", type: "string" },
    { key: "po_date", label: "PO Date", type: "date" },
    { key: "delivery_date", label: "Delivery Date", type: "date" },
    { key: "net_value", label: "Net Value", type: "number" },
    { key: "currency", label: "Currency", type: "string" },
    { key: "status", label: "Status", type: "enum", options: ["Created", "Approved", "Partially Received", "Fully Received", "Cancelled"] },
    { key: "purchasing_org", label: "Purchasing Org", type: "string" },
    { key: "material_group", label: "Material Group", type: "string" }
  ],
  VendorInvoice: [
    { key: "invoice_number", label: "Invoice Number", type: "string" },
    { key: "vendor_name", label: "Vendor Name", type: "string" },
    { key: "invoice_date", label: "Invoice Date", type: "date" },
    { key: "due_date", label: "Due Date", type: "date" },
    { key: "gross_amount", label: "Gross Amount", type: "number" },
    { key: "net_amount", label: "Net Amount", type: "number" },
    { key: "tax_amount", label: "Tax Amount", type: "number" },
    { key: "status", label: "Status", type: "enum", options: ["Posted", "Paid", "Partially Paid", "Blocked", "Cancelled"] },
    { key: "po_reference", label: "PO Reference", type: "string" }
  ],
  Inventory: [
    { key: "material_number", label: "Material Number", type: "string" },
    { key: "material_description", label: "Material Description", type: "string" },
    { key: "plant", label: "Plant", type: "string" },
    { key: "storage_location", label: "Storage Location", type: "string" },
    { key: "quantity_on_hand", label: "Quantity On Hand", type: "number" },
    { key: "unit_of_measure", label: "Unit of Measure", type: "string" },
    { key: "value", label: "Value", type: "number" },
    { key: "material_group", label: "Material Group", type: "string" },
    { key: "reorder_point", label: "Reorder Point", type: "number" },
    { key: "safety_stock", label: "Safety Stock", type: "number" }
  ],
  ProductionOrder: [
    { key: "order_number", label: "Order Number", type: "string" },
    { key: "material_number", label: "Material Number", type: "string" },
    { key: "material_description", label: "Material Description", type: "string" },
    { key: "plant", label: "Plant", type: "string" },
    { key: "order_type", label: "Order Type", type: "string" },
    { key: "planned_quantity", label: "Planned Quantity", type: "number" },
    { key: "confirmed_quantity", label: "Confirmed Quantity", type: "number" },
    { key: "start_date", label: "Start Date", type: "date" },
    { key: "end_date", label: "End Date", type: "date" },
    { key: "status", label: "Status", type: "enum", options: ["Created", "Released", "In Process", "Confirmed", "Completed", "Closed"] },
    { key: "work_center", label: "Work Center", type: "string" }
  ],
  FinancialEntry: [
    { key: "document_number", label: "Document Number", type: "string" },
    { key: "company_code", label: "Company Code", type: "string" },
    { key: "fiscal_year", label: "Fiscal Year", type: "string" },
    { key: "posting_date", label: "Posting Date", type: "date" },
    { key: "document_type", label: "Document Type", type: "string" },
    { key: "gl_account", label: "G/L Account", type: "string" },
    { key: "gl_account_name", label: "G/L Account Name", type: "string" },
    { key: "debit_amount", label: "Debit Amount", type: "number" },
    { key: "credit_amount", label: "Credit Amount", type: "number" },
    { key: "cost_center", label: "Cost Center", type: "string" },
    { key: "profit_center", label: "Profit Center", type: "string" }
  ]
};

const filterOperators = {
  string: [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts With" }
  ],
  number: [
    { value: "equals", label: "Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "between", label: "Between" }
  ],
  date: [
    { value: "equals", label: "Equals" },
    { value: "after", label: "After" },
    { value: "before", label: "Before" },
    { value: "between", label: "Between" }
  ],
  enum: [
    { value: "equals", label: "Equals" },
    { value: "in", label: "Is One Of" }
  ]
};

export default function ReportBuilder({ report, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: report?.name || "",
    description: report?.description || "",
    module: report?.module || "",
    selected_fields: report?.selected_fields || [],
    filters: report?.filters || [],
    group_by: report?.group_by || "",
    sort_by: report?.sort_by || "",
    sort_order: report?.sort_order || "desc",
    is_scheduled: report?.is_scheduled || false,
    schedule_frequency: report?.schedule_frequency || "weekly",
    schedule_email: report?.schedule_email || ""
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (report?.id) {
        return base44.entities.CustomReport.update(report.id, data);
      }
      return base44.entities.CustomReport.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-reports"] });
      onClose();
    }
  });

  const fields = moduleFields[formData.module] || [];

  const toggleField = (fieldKey) => {
    setFormData(prev => ({
      ...prev,
      selected_fields: prev.selected_fields.includes(fieldKey)
        ? prev.selected_fields.filter(f => f !== fieldKey)
        : [...prev.selected_fields, fieldKey]
    }));
  };

  const addFilter = () => {
    setFormData(prev => ({
      ...prev,
      filters: [...prev.filters, { field: "", operator: "equals", value: "", value2: "" }]
    }));
  };

  const updateFilter = (index, updates) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => i === index ? { ...f, ...updates } : f)
    }));
  };

  const removeFilter = (index) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{report ? "Edit Report" : "Create Custom Report"}</h1>
          <p className="text-muted-foreground">Configure your report settings</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Report"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Report description..."
                rows={2}
              />
            </div>
            <div>
              <Label>Data Module *</Label>
              <Select
                value={formData.module}
                onValueChange={(v) => setFormData({ ...formData, module: v, selected_fields: [], filters: [], group_by: "", sort_by: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SalesOrder">Sales Orders</SelectItem>
                  <SelectItem value="SalesInvoice">Sales Invoices</SelectItem>
                  <SelectItem value="PurchaseOrder">Purchase Orders</SelectItem>
                  <SelectItem value="VendorInvoice">Vendor Invoices</SelectItem>
                  <SelectItem value="Inventory">Inventory</SelectItem>
                  <SelectItem value="ProductionOrder">Production Orders</SelectItem>
                  <SelectItem value="FinancialEntry">Financial Entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Field Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Fields</CardTitle>
          </CardHeader>
          <CardContent>
            {!formData.module ? (
              <p className="text-sm text-muted-foreground">Select a module first</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.selected_fields.includes(field.key)}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                    <span className="text-sm">{field.label}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{field.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grouping & Sorting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grouping & Sorting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Group By</Label>
              <Select
                value={formData.group_by}
                onValueChange={(v) => setFormData({ ...formData, group_by: v })}
                disabled={!formData.module}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No grouping</SelectItem>
                  {fields.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort By</Label>
              <Select
                value={formData.sort_by}
                onValueChange={(v) => setFormData({ ...formData, sort_by: v })}
                disabled={!formData.module}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Select
                value={formData.sort_order}
                onValueChange={(v) => setFormData({ ...formData, sort_order: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button size="sm" variant="outline" onClick={addFilter} disabled={!formData.module}>
              <Plus className="h-4 w-4 mr-1" /> Add Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.filters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No filters added</p>
          ) : (
            <div className="space-y-3">
              {formData.filters.map((filter, idx) => {
                const field = fields.find(f => f.key === filter.field);
                const operators = field ? filterOperators[field.type] || filterOperators.string : [];
                return (
                  <div key={idx} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Select
                      value={filter.field}
                      onValueChange={(v) => updateFilter(idx, { field: v, operator: "equals", value: "" })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((f) => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filter.operator}
                      onValueChange={(v) => updateFilter(idx, { operator: v })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field?.type === "enum" && filter.operator === "equals" ? (
                      <Select
                        value={filter.value}
                        onValueChange={(v) => updateFilter(idx, { value: v })}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(idx, { value: e.target.value })}
                        placeholder="Value"
                        className="w-[150px]"
                        type={field?.type === "number" ? "number" : field?.type === "date" ? "date" : "text"}
                      />
                    )}
                    {filter.operator === "between" && (
                      <Input
                        value={filter.value2}
                        onChange={(e) => updateFilter(idx, { value2: e.target.value })}
                        placeholder="To value"
                        className="w-[150px]"
                        type={field?.type === "number" ? "number" : field?.type === "date" ? "date" : "text"}
                      />
                    )}
                    <Button size="icon" variant="ghost" onClick={() => removeFilter(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schedule Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Enable Scheduled Delivery</p>
              <p className="text-sm text-muted-foreground">Automatically send this report via email</p>
            </div>
            <Switch
              checked={formData.is_scheduled}
              onCheckedChange={(v) => setFormData({ ...formData, is_scheduled: v })}
            />
          </div>
          {formData.is_scheduled && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.schedule_frequency}
                  onValueChange={(v) => setFormData({ ...formData, schedule_frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.schedule_email}
                  onChange={(e) => setFormData({ ...formData, schedule_email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          disabled={!formData.name || !formData.module || formData.selected_fields.length === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Report
        </Button>
      </div>
    </div>
  );
}