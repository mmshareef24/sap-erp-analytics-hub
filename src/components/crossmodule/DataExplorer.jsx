import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Filter, Download, Plus, X } from "lucide-react";

const moduleFields = {
  salesOrders: {
    label: "Sales Orders",
    fields: ["order_number", "customer_name", "order_date", "net_value", "status", "region", "salesperson_name"]
  },
  purchaseOrders: {
    label: "Purchase Orders",
    fields: ["po_number", "vendor_name", "po_date", "net_value", "status", "material_group"]
  },
  inventory: {
    label: "Inventory",
    fields: ["material_number", "material_description", "plant", "quantity_on_hand", "value", "material_group"]
  },
  productionOrders: {
    label: "Production Orders",
    fields: ["order_number", "material_description", "plant", "planned_quantity", "confirmed_quantity", "status"]
  },
  suppliers: {
    label: "Suppliers",
    fields: ["supplier_code", "name", "category", "country", "lead_time_days", "rating", "status"]
  },
  shipments: {
    label: "Shipments",
    fields: ["shipment_number", "type", "origin", "destination", "carrier", "status", "freight_cost"]
  }
};

export default function DataExplorer({ data }) {
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedFields, setSelectedFields] = useState({});
  const [filters, setFilters] = useState([]);
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const toggleModule = (module) => {
    if (selectedModules.includes(module)) {
      setSelectedModules(selectedModules.filter(m => m !== module));
      const newFields = { ...selectedFields };
      delete newFields[module];
      setSelectedFields(newFields);
    } else {
      setSelectedModules([...selectedModules, module]);
      setSelectedFields({ ...selectedFields, [module]: moduleFields[module].fields.slice(0, 3) });
    }
  };

  const toggleField = (module, field) => {
    const moduleFields = selectedFields[module] || [];
    if (moduleFields.includes(field)) {
      setSelectedFields({
        ...selectedFields,
        [module]: moduleFields.filter(f => f !== field)
      });
    } else {
      setSelectedFields({
        ...selectedFields,
        [module]: [...moduleFields, field]
      });
    }
  };

  const addFilter = () => {
    setFilters([...filters, { module: "", field: "", operator: "equals", value: "" }]);
  };

  const updateFilter = (index, updates) => {
    setFilters(filters.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const combinedData = useMemo(() => {
    if (selectedModules.length === 0) return [];

    let result = [];

    selectedModules.forEach(module => {
      const moduleData = data[module] || [];
      const fields = selectedFields[module] || [];
      
      moduleData.forEach(item => {
        const row = { _module: moduleFields[module].label };
        fields.forEach(field => {
          row[`${module}.${field}`] = item[field];
        });
        result.push(row);
      });
    });

    // Apply filters
    filters.forEach(filter => {
      if (filter.module && filter.field && filter.value) {
        const key = `${filter.module}.${filter.field}`;
        result = result.filter(row => {
          const value = row[key];
          const filterVal = filter.value;
          
          switch (filter.operator) {
            case "equals":
              return String(value).toLowerCase() === filterVal.toLowerCase();
            case "contains":
              return String(value).toLowerCase().includes(filterVal.toLowerCase());
            case "greater":
              return Number(value) > Number(filterVal);
            case "less":
              return Number(value) < Number(filterVal);
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortOrder === "asc" 
          ? String(aVal || "").localeCompare(String(bVal || ""))
          : String(bVal || "").localeCompare(String(aVal || ""));
      });
    }

    return result;
  }, [data, selectedModules, selectedFields, filters, sortBy, sortOrder]);

  const allColumns = useMemo(() => {
    const cols = ["_module"];
    selectedModules.forEach(module => {
      (selectedFields[module] || []).forEach(field => {
        cols.push(`${module}.${field}`);
      });
    });
    return cols;
  }, [selectedModules, selectedFields]);

  const formatColumnName = (col) => {
    if (col === "_module") return "Source";
    const [module, field] = col.split(".");
    return `${moduleFields[module]?.label.split(" ")[0]} - ${field.replace(/_/g, " ")}`;
  };

  const exportCSV = () => {
    const headers = allColumns.map(formatColumnName);
    const rows = combinedData.map(row => allColumns.map(col => row[col] ?? ""));
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cross-module-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Module Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" /> Select Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(moduleFields).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedModules.includes(key) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleModule(key)}
              >
                {config.label}
                <Badge variant="secondary" className="ml-2">{data[key]?.length || 0}</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Field Selection */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedModules.map(module => (
                <div key={module} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{moduleFields[module].label}</h4>
                  <div className="space-y-1">
                    {moduleFields[module].fields.map(field => (
                      <div key={field} className="flex items-center gap-2">
                        <Checkbox
                          checked={(selectedFields[module] || []).includes(field)}
                          onCheckedChange={() => toggleField(module, field)}
                        />
                        <span className="text-sm">{field.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {selectedModules.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filters
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addFilter}>
                <Plus className="h-4 w-4 mr-1" /> Add Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No filters applied</p>
            ) : (
              <div className="space-y-2">
                {filters.map((filter, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded">
                    <Select value={filter.module} onValueChange={(v) => updateFilter(idx, { module: v, field: "" })}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Module" /></SelectTrigger>
                      <SelectContent>
                        {selectedModules.map(m => (
                          <SelectItem key={m} value={m}>{moduleFields[m].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {filter.module && (
                      <Select value={filter.field} onValueChange={(v) => updateFilter(idx, { field: v })}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Field" /></SelectTrigger>
                        <SelectContent>
                          {(selectedFields[filter.module] || []).map(f => (
                            <SelectItem key={f} value={f}>{f.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={filter.operator} onValueChange={(v) => updateFilter(idx, { operator: v })}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(idx, { value: e.target.value })}
                      placeholder="Value"
                      className="w-[120px]"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeFilter(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {combinedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Results ({combinedData.length} records)</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by..." /></SelectTrigger>
                  <SelectContent>
                    {allColumns.filter(c => c !== "_module").map(col => (
                      <SelectItem key={col} value={col}>{formatColumnName(col)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
                <Button size="sm" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {allColumns.map(col => (
                      <TableHead key={col} className="whitespace-nowrap">{formatColumnName(col)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedData.slice(0, 50).map((row, idx) => (
                    <TableRow key={idx}>
                      {allColumns.map(col => (
                        <TableCell key={col} className="whitespace-nowrap">
                          {col === "_module" ? (
                            <Badge variant="outline">{row[col]}</Badge>
                          ) : typeof row[col] === "number" ? (
                            row[col].toLocaleString()
                          ) : (
                            row[col] ?? "-"
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {combinedData.length > 50 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Showing 50 of {combinedData.length} records. Export for full data.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}