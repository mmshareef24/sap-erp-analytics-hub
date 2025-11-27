import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Package, Warehouse, Factory, DollarSign, Loader2 } from "lucide-react";

import SalesInsights from "@/components/insights/SalesInsights";
import PurchaseInsights from "@/components/insights/PurchaseInsights";
import InventoryInsights from "@/components/insights/InventoryInsights";
import ProductionInsights from "@/components/insights/ProductionInsights";
import FinanceInsights from "@/components/insights/FinanceInsights";

export default function Insights() {
  const [activeTab, setActiveTab] = useState("sales");

  const { data: salesOrders = [], isLoading: loadingSales } = useQuery({
    queryKey: ["insights-sales-orders"],
    queryFn: () => base44.entities.SalesOrder.list()
  });

  const { data: salesInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["insights-sales-invoices"],
    queryFn: () => base44.entities.SalesInvoice.list()
  });

  const { data: purchaseOrders = [], isLoading: loadingPO } = useQuery({
    queryKey: ["insights-purchase-orders"],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: vendorInvoices = [], isLoading: loadingVI } = useQuery({
    queryKey: ["insights-vendor-invoices"],
    queryFn: () => base44.entities.VendorInvoice.list()
  });

  const { data: inventory = [], isLoading: loadingInv } = useQuery({
    queryKey: ["insights-inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });

  const { data: productionOrders = [], isLoading: loadingProd } = useQuery({
    queryKey: ["insights-production"],
    queryFn: () => base44.entities.ProductionOrder.list()
  });

  const { data: financialEntries = [], isLoading: loadingFin } = useQuery({
    queryKey: ["insights-finance"],
    queryFn: () => base44.entities.FinancialEntry.list()
  });

  const isLoading = loadingSales || loadingInvoices || loadingPO || loadingVI || loadingInv || loadingProd || loadingFin;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Insights</h1>
        <p className="text-muted-foreground">AI-powered analytics and recommendations for decision making</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Purchase</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            <span className="hidden sm:inline">Production</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesInsights salesOrders={salesOrders} salesInvoices={salesInvoices} />
        </TabsContent>

        <TabsContent value="purchase">
          <PurchaseInsights purchaseOrders={purchaseOrders} vendorInvoices={vendorInvoices} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryInsights inventory={inventory} />
        </TabsContent>

        <TabsContent value="production">
          <ProductionInsights productionOrders={productionOrders} />
        </TabsContent>

        <TabsContent value="finance">
          <FinanceInsights financialEntries={financialEntries} salesInvoices={salesInvoices} vendorInvoices={vendorInvoices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}