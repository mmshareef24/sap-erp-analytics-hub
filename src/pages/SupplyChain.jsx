import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Users, BarChart3, Package, Loader2 } from "lucide-react";

import ShipmentsModule from "@/components/supplychain/ShipmentsModule";
import SuppliersModule from "@/components/supplychain/SuppliersModule";
import LogisticsAnalytics from "@/components/supplychain/LogisticsAnalytics";
import SupplyChainOverview from "@/components/supplychain/SupplyChainOverview";
import DateFilter, { filterDataByDate } from "@/components/common/DateFilter";

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState({ type: "all", startDate: null, endDate: null });

  const { data: shipments = [], isLoading: loadingShipments } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => base44.entities.Shipment.list()
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => base44.entities.Supplier.list()
  });

  const { data: purchaseOrders = [], isLoading: loadingPO } = useQuery({
    queryKey: ["sc-purchase-orders"],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: inventory = [], isLoading: loadingInv } = useQuery({
    queryKey: ["sc-inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });

  const isLoading = loadingShipments || loadingSuppliers || loadingPO || loadingInv;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Apply date filter
  const filteredShipments = filterDataByDate(shipments, dateFilter, "ship_date");
  const filteredPurchaseOrders = filterDataByDate(purchaseOrders, dateFilter, "po_date");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Chain Management</h1>
          <p className="text-muted-foreground">Monitor shipments, suppliers, and logistics performance</p>
        </div>
        <DateFilter onFilterChange={setDateFilter} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Shipments</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SupplyChainOverview 
            shipments={filteredShipments} 
            suppliers={suppliers} 
            purchaseOrders={filteredPurchaseOrders}
            inventory={inventory}
          />
        </TabsContent>

        <TabsContent value="shipments">
          <ShipmentsModule shipments={filteredShipments} />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersModule suppliers={suppliers} purchaseOrders={filteredPurchaseOrders} />
        </TabsContent>

        <TabsContent value="analytics">
          <LogisticsAnalytics shipments={filteredShipments} suppliers={suppliers} purchaseOrders={filteredPurchaseOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}