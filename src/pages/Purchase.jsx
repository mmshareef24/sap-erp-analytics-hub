import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FileText, Users, Layers, TrendingUp, Loader2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import PurchaseOrdersList from "@/components/purchase/PurchaseOrdersList";
import VendorInvoicesList from "@/components/purchase/VendorInvoicesList";
import TopVendorsReport from "@/components/purchase/TopVendorsReport";
import MaterialGroupAnalysis from "@/components/purchase/MaterialGroupAnalysis";
import PurchaseTrendReport from "@/components/purchase/PurchaseTrendReport";
import DateFilter, { filterDataByDate } from "@/components/common/DateFilter";

export default function Purchase() {
  const [activeTab, setActiveTab] = useState("orders");
  const [dateFilter, setDateFilter] = useState({ type: "all", startDate: null, endDate: null });

  const { data: purchaseOrders = [], isLoading: loadingPO } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: vendorInvoices = [], isLoading: loadingInv } = useQuery({
    queryKey: ["vendorInvoices"],
    queryFn: () => base44.entities.VendorInvoice.list()
  });

  const isLoading = loadingPO || loadingInv;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Apply date filter
  const filteredPurchaseOrders = filterDataByDate(purchaseOrders, dateFilter, "po_date");
  const filteredVendorInvoices = filterDataByDate(vendorInvoices, dateFilter, "invoice_date");

  const totalPOValue = filteredPurchaseOrders.reduce((sum, po) => sum + (po.net_value || 0), 0);
  const openPOs = filteredPurchaseOrders.filter(po => po.status !== "Fully Received" && po.status !== "Cancelled").length;
  const totalInvoiceValue = filteredVendorInvoices.reduce((sum, inv) => sum + (inv.gross_amount || 0), 0);
  const openInvoices = filteredVendorInvoices.filter(inv => inv.status !== "Paid" && inv.status !== "Cancelled").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Module</h1>
            <p className="text-muted-foreground mt-1">Purchase orders, vendor invoices, and procurement analytics</p>
          </div>
          <DateFilter onFilterChange={setDateFilter} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total PO Value"
            value={`SAR ${(totalPOValue / 1000).toFixed(0)}K`}
            subtitle={`${filteredPurchaseOrders.length} orders`}
            icon={Package}
          />
          <KPICard
            title="Open POs"
            value={openPOs}
            subtitle="Pending receipt"
            icon={Package}
          />
          <KPICard
            title="Invoice Value"
            value={`SAR ${(totalInvoiceValue / 1000).toFixed(0)}K`}
            subtitle={`${filteredVendorInvoices.length} invoices`}
            icon={FileText}
          />
          <KPICard
            title="Open Invoices"
            value={openInvoices}
            subtitle="Pending payment"
            icon={FileText}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="orders" className="gap-2 py-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Purchase Orders</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Vendor Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Top Vendors</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 py-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Material Groups</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <PurchaseOrdersList purchaseOrders={filteredPurchaseOrders} />
          </TabsContent>

          <TabsContent value="invoices">
            <VendorInvoicesList vendorInvoices={filteredVendorInvoices} />
          </TabsContent>

          <TabsContent value="vendors">
            <TopVendorsReport purchaseOrders={filteredPurchaseOrders} />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialGroupAnalysis purchaseOrders={filteredPurchaseOrders} />
          </TabsContent>

          <TabsContent value="trends">
            <PurchaseTrendReport purchaseOrders={filteredPurchaseOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}