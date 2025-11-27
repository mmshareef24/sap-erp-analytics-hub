import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, GitBranch, BarChart3, Layers } from "lucide-react";

import CorrelationBuilder from "@/components/crossmodule/CorrelationBuilder";
import PrebuiltAnalytics from "@/components/crossmodule/PrebuiltAnalytics";
import DataExplorer from "@/components/crossmodule/DataExplorer";
import AISummaryCard from "@/components/common/AISummaryCard";

export default function CrossModuleAnalytics() {
  const [activeTab, setActiveTab] = useState("prebuilt");

  const { data: salesOrders = [], isLoading: l1 } = useQuery({
    queryKey: ["cm-sales"], queryFn: () => base44.entities.SalesOrder.list()
  });
  const { data: salesInvoices = [], isLoading: l2 } = useQuery({
    queryKey: ["cm-invoices"], queryFn: () => base44.entities.SalesInvoice.list()
  });
  const { data: purchaseOrders = [], isLoading: l3 } = useQuery({
    queryKey: ["cm-po"], queryFn: () => base44.entities.PurchaseOrder.list()
  });
  const { data: inventory = [], isLoading: l4 } = useQuery({
    queryKey: ["cm-inventory"], queryFn: () => base44.entities.Inventory.list()
  });
  const { data: productionOrders = [], isLoading: l5 } = useQuery({
    queryKey: ["cm-production"], queryFn: () => base44.entities.ProductionOrder.list()
  });
  const { data: suppliers = [], isLoading: l6 } = useQuery({
    queryKey: ["cm-suppliers"], queryFn: () => base44.entities.Supplier.list()
  });
  const { data: shipments = [], isLoading: l7 } = useQuery({
    queryKey: ["cm-shipments"], queryFn: () => base44.entities.Shipment.list()
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7;

  const allData = {
    salesOrders,
    salesInvoices,
    purchaseOrders,
    inventory,
    productionOrders,
    suppliers,
    shipments
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate summary metrics for AI
  const totalSalesRevenue = salesOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
  const totalPOValue = purchaseOrders.reduce((sum, p) => sum + (p.net_value || 0), 0);
  const inventoryValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0);
  const activeSuppliers = suppliers.filter(s => s.status === "Active").length;
  const deliveredShipments = shipments.filter(s => s.status === "Delivered").length;
  const completedProduction = productionOrders.filter(p => p.status === "Completed").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cross-Module Analytics</h1>
        <p className="text-muted-foreground">Analyze correlations and patterns across different business modules</p>
      </div>

      {/* AI Cross-Module Summary */}
      <AISummaryCard 
        title="Cross-Module Intelligence Summary"
        promptTemplate={`Analyze this cross-module business data and identify key patterns and correlations:

SALES: ${salesOrders.length} orders worth SAR ${totalSalesRevenue.toLocaleString()}, ${salesInvoices.length} invoices
PROCUREMENT: ${purchaseOrders.length} POs worth SAR ${totalPOValue.toLocaleString()}, ${activeSuppliers} active suppliers
INVENTORY: ${inventory.length} SKUs valued at SAR ${inventoryValue.toLocaleString()}
PRODUCTION: ${productionOrders.length} orders, ${completedProduction} completed
LOGISTICS: ${shipments.length} shipments, ${deliveredShipments} delivered

Provide: 1) A headline about overall business health, 2) 3-4 key cross-module metrics with trends, 3) Top correlations or patterns across modules, 4) Any anomalies requiring attention, 5) Strategic recommendations. Be concise and insightful.`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="prebuilt" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Pre-built Analytics
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Correlation Builder
          </TabsTrigger>
          <TabsTrigger value="explorer" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Data Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prebuilt">
          <PrebuiltAnalytics data={allData} />
        </TabsContent>

        <TabsContent value="correlation">
          <CorrelationBuilder data={allData} />
        </TabsContent>

        <TabsContent value="explorer">
          <DataExplorer data={allData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}