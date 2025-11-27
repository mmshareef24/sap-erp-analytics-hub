import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, Trash2, Database, Columns, ChevronDown, ChevronRight, 
  Search, Loader2, Info
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Common SAP tables for quick selection
const COMMON_SAP_TABLES = [
  { name: "VBAK", description: "Sales Document Header", columns: ["VBELN", "ERDAT", "ERZET", "ERNAM", "AUART", "NETWR", "WAERK", "VKORG", "VTWEG", "KUNNR"] },
  { name: "VBAP", description: "Sales Document Item", columns: ["VBELN", "POSNR", "MATNR", "ARKTX", "KWMENG", "MEINS", "NETWR", "WAERK", "WERKS"] },
  { name: "LIKP", description: "Delivery Header", columns: ["VBELN", "ERDAT", "ERZET", "LFART", "LDDAT", "WADAT", "KUNNR", "VSTEL"] },
  { name: "LIPS", description: "Delivery Item", columns: ["VBELN", "POSNR", "MATNR", "ARKTX", "LFIMG", "MEINS", "WERKS", "LGORT"] },
  { name: "EKKO", description: "Purchase Order Header", columns: ["EBELN", "BUKRS", "BSTYP", "BSART", "AEDAT", "ERNAM", "LIFNR", "EKORG", "EKGRP"] },
  { name: "EKPO", description: "Purchase Order Item", columns: ["EBELN", "EBELP", "MATNR", "TXZ01", "MENGE", "MEINS", "NETPR", "PEINH", "WERKS"] },
  { name: "MARA", description: "Material Master", columns: ["MATNR", "ERSDA", "ERNAM", "MTART", "MATKL", "MEINS", "BRGEW", "NTGEW", "GEWEI"] },
  { name: "MARD", description: "Storage Location Data", columns: ["MATNR", "WERKS", "LGORT", "LABST", "INSME", "SPEME", "EINME", "RETME"] },
  { name: "KNA1", description: "Customer Master", columns: ["KUNNR", "NAME1", "NAME2", "LAND1", "ORT01", "PSTLZ", "STRAS", "TELF1"] },
  { name: "LFA1", description: "Vendor Master", columns: ["LIFNR", "NAME1", "NAME2", "LAND1", "ORT01", "PSTLZ", "STRAS", "TELF1"] },
  { name: "BKPF", description: "Accounting Document Header", columns: ["BUKRS", "BELNR", "GJAHR", "BLART", "BLDAT", "BUDAT", "MONAT", "CPUDT", "USNAM"] },
  { name: "BSEG", description: "Accounting Document Segment", columns: ["BUKRS", "BELNR", "GJAHR", "BUZEI", "KOART", "SHKZG", "DMBTR", "WRBTR", "KOSTL"] },
  { name: "AFKO", description: "Production Order Header", columns: ["AUFNR", "STLBEZ", "GMEIN", "GAMNG", "GAPTS", "GLTRP", "GSTRP", "FTRMS"] },
  { name: "AFPO", description: "Production Order Item", columns: ["AUFNR", "POSNR", "MATNR", "MEINS", "PSMNG", "WEMNG", "AMEIN"] }
];

export default function SapTableConfig({ tables = [], onChange }) {
  const [newTableName, setNewTableName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [expandedTables, setExpandedTables] = useState({});
  const [showCommonTables, setShowCommonTables] = useState(false);
  const [searchCommon, setSearchCommon] = useState("");

  const addTable = (tableName, columns = []) => {
    if (!tableName.trim()) return;
    const upperName = tableName.trim().toUpperCase();
    if (tables.find(t => t.name === upperName)) return;
    
    onChange([...tables, { name: upperName, columns, enabled: true }]);
    setNewTableName("");
    setExpandedTables({ ...expandedTables, [upperName]: true });
  };

  const removeTable = (tableName) => {
    onChange(tables.filter(t => t.name !== tableName));
  };

  const toggleTable = (tableName) => {
    onChange(tables.map(t => 
      t.name === tableName ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const addColumn = (tableName) => {
    if (!newColumnName.trim()) return;
    const upperCol = newColumnName.trim().toUpperCase();
    onChange(tables.map(t => {
      if (t.name === tableName && !t.columns.includes(upperCol)) {
        return { ...t, columns: [...t.columns, upperCol] };
      }
      return t;
    }));
    setNewColumnName("");
  };

  const removeColumn = (tableName, columnName) => {
    onChange(tables.map(t => {
      if (t.name === tableName) {
        return { ...t, columns: t.columns.filter(c => c !== columnName) };
      }
      return t;
    }));
  };

  const toggleColumnFromCommon = (tableName, columnName, checked) => {
    onChange(tables.map(t => {
      if (t.name === tableName) {
        if (checked && !t.columns.includes(columnName)) {
          return { ...t, columns: [...t.columns, columnName] };
        } else if (!checked) {
          return { ...t, columns: t.columns.filter(c => c !== columnName) };
        }
      }
      return t;
    }));
  };

  const addCommonTable = (commonTable) => {
    addTable(commonTable.name, [...commonTable.columns]);
    setShowCommonTables(false);
  };

  const filteredCommonTables = COMMON_SAP_TABLES.filter(t => 
    !tables.find(et => et.name === t.name) &&
    (t.name.toLowerCase().includes(searchCommon.toLowerCase()) ||
     t.description.toLowerCase().includes(searchCommon.toLowerCase()))
  );

  const getCommonTableInfo = (tableName) => {
    return COMMON_SAP_TABLES.find(t => t.name === tableName);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Database className="h-4 w-4" /> SAP Tables & Columns
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Select specific SAP tables and columns to sync. This optimizes data transfer and reduces load on the SAP system.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Add Table Section */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter SAP table name (e.g., VBAK)"
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value.toUpperCase())}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && addTable(newTableName)}
        />
        <Button onClick={() => addTable(newTableName)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCommonTables(!showCommonTables)}
        >
          Browse Common
        </Button>
      </div>

      {/* Common Tables Browser */}
      {showCommonTables && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search common SAP tables..."
                value={searchCommon}
                onChange={(e) => setSearchCommon(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCommonTables.map((table) => (
                <div 
                  key={table.name}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => addCommonTable(table)}
                >
                  <div>
                    <span className="font-mono font-medium text-sm">{table.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">- {table.description}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {table.columns.length} columns
                  </Badge>
                </div>
              ))}
              {filteredCommonTables.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No matching tables found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Tables */}
      {tables.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="p-6 text-center">
            <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No tables configured. Add SAP tables to sync specific data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tables.map((table) => {
            const commonInfo = getCommonTableInfo(table.name);
            const isExpanded = expandedTables[table.name];

            return (
              <Collapsible 
                key={table.name} 
                open={isExpanded}
                onOpenChange={(open) => setExpandedTables({ ...expandedTables, [table.name]: open })}
              >
                <Card className={!table.enabled ? "opacity-60" : ""}>
                  <CardContent className="p-3">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Checkbox
                            checked={table.enabled}
                            onClick={(e) => { e.stopPropagation(); toggleTable(table.name); }}
                          />
                          <div className="text-left">
                            <span className="font-mono font-medium">{table.name}</span>
                            {commonInfo && (
                              <span className="text-sm text-muted-foreground ml-2">
                                - {commonInfo.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Columns className="h-3 w-3 mr-1" />
                            {table.columns.length} columns
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            onClick={(e) => { e.stopPropagation(); removeTable(table.name); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="pt-3">
                      <div className="border-t pt-3 space-y-3">
                        {/* Add Column */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add column name"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value.toUpperCase())}
                            className="h-8 text-sm"
                            onKeyDown={(e) => e.key === "Enter" && addColumn(table.name)}
                          />
                          <Button size="sm" className="h-8" onClick={() => addColumn(table.name)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Common Columns Selector */}
                        {commonInfo && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Common columns:</p>
                            <div className="flex flex-wrap gap-1">
                              {commonInfo.columns.map((col) => (
                                <Badge
                                  key={col}
                                  variant={table.columns.includes(col) ? "default" : "outline"}
                                  className="cursor-pointer text-xs"
                                  onClick={() => toggleColumnFromCommon(
                                    table.name, 
                                    col, 
                                    !table.columns.includes(col)
                                  )}
                                >
                                  {col}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Selected Columns */}
                        {table.columns.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Selected columns:</p>
                            <div className="flex flex-wrap gap-1">
                              {table.columns.map((col) => (
                                <Badge
                                  key={col}
                                  variant="secondary"
                                  className="text-xs group"
                                >
                                  {col}
                                  <button
                                    className="ml-1 hover:text-red-500"
                                    onClick={() => removeColumn(table.name, col)}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {tables.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {tables.filter(t => t.enabled).length} of {tables.length} tables enabled • 
          {tables.reduce((sum, t) => sum + t.columns.length, 0)} total columns selected
        </p>
      )}
    </div>
  );
}