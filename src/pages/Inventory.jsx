import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Warehouse, BarChart3, RefreshCw, DollarSign, AlertTriangle, Loader2, Package } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import DataTable from "@/components/dashboard/DataTable";
import InventoryValuationTrend from "@/components/inventory/InventoryValuationTrend";
import StockTurnoverRate from "@/components/inventory/StockTurnoverRate";
import TopValueItems from "@/components/inventory/TopValueItems";
import LowStockAlerts from "@/components/inventory/LowStockAlerts";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0);
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter(i => (i.quantity_on_hand || 0) <= (i.reorder_point || 0)).length;
  const criticalCount = inventory.filter(i => (i.quantity_on_hand || 0) <= (i.safety_stock || 0)).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Monitor stock levels, valuations, and turnover rates</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Inventory Value"
            value={`SAR ${(totalValue / 1000).toFixed(0)}K`}
            subtitle={`${totalItems} materials`}
            icon={DollarSign}
          />
          <KPICard
            title="Total SKUs"
            value={totalItems}
            subtitle="Active materials"
            icon={Package}
          />
          <KPICard
            title="Low Stock Items"
            value={lowStockCount}
            subtitle="Below reorder point"
            icon={AlertTriangle}
            className={lowStockCount > 0 ? "border-yellow-200 bg-yellow-50" : ""}
          />
          <KPICard
            title="Critical Stock"
            value={criticalCount}
            subtitle="Below safety stock"
            icon={AlertTriangle}
            className={criticalCount > 0 ? "border-red-200 bg-red-50" : ""}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="overview" className="gap-2 py-2">
              <Warehouse className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="valuation" className="gap-2 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Valuation Trend</span>
            </TabsTrigger>
            <TabsTrigger value="turnover" className="gap-2 py-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Turnover Rate</span>
            </TabsTrigger>
            <TabsTrigger value="top-items" className="gap-2 py-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Top Value Items</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Stock Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InventoryValuationTrend inventory={inventory} />
              <LowStockAlerts inventory={inventory} />
            </div>
            <DataTable
              title="Stock Overview"
              columns={[
                { key: "material_number", label: "Material #" },
                { key: "material_description", label: "Description" },
                { key: "plant", label: "Plant" },
                { key: "quantity_on_hand", label: "Qty", format: (v) => v?.toLocaleString() },
                { key: "unit_of_measure", label: "UoM" },
                { key: "value", label: "Value", format: (v) => `SAR ${v?.toLocaleString()}` }
              ]}
              data={inventory}
              maxRows={10}
            />
          </TabsContent>

          <TabsContent value="valuation">
            <InventoryValuationTrend inventory={inventory} />
          </TabsContent>

          <TabsContent value="turnover">
            <StockTurnoverRate inventory={inventory} />
          </TabsContent>

          <TabsContent value="top-items">
            <TopValueItems inventory={inventory} topN={10} />
          </TabsContent>

          <TabsContent value="alerts">
            <LowStockAlerts inventory={inventory} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}