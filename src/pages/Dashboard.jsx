import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Package, FileText, Warehouse, DollarSign, Factory, Loader2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import SalesChart from "@/components/dashboard/SalesChart";
import StatusPieChart from "@/components/dashboard/StatusPieChart";
import DataTable from "@/components/dashboard/DataTable";
import InventoryAlerts from "@/components/dashboard/InventoryAlerts";
import SyncStatus from "@/components/dashboard/SyncStatus";
import CrossModuleAlerts from "@/components/dashboard/CrossModuleAlerts";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncInterval, setSyncInterval] = useState(() => {
    const saved = localStorage.getItem("sapSyncInterval");
    return saved ? JSON.parse(saved) : 300000; // Default 5 minutes
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, [queryClient]);

  const handleIntervalChange = (interval) => {
    setSyncInterval(interval);
    localStorage.setItem("sapSyncInterval", JSON.stringify(interval));
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!syncInterval) return;
    
    const intervalId = setInterval(() => {
      handleRefresh();
    }, syncInterval);

    return () => clearInterval(intervalId);
  }, [syncInterval, handleRefresh]);

  // Set initial lastUpdated when data loads
  useEffect(() => {
    if (!lastUpdated) {
      setLastUpdated(new Date());
    }
  }, []);

  const { data: salesOrders = [], isLoading: loadingSales } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => base44.entities.SalesOrder.list()
  });

  const { data: purchaseOrders = [], isLoading: loadingPO } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: vendorInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["vendorInvoices"],
    queryFn: () => base44.entities.VendorInvoice.list()
  });

  const { data: inventory = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });

  const { data: financialEntries = [], isLoading: loadingFinance } = useQuery({
    queryKey: ["financialEntries"],
    queryFn: () => base44.entities.FinancialEntry.list()
  });

  const { data: productionOrders = [], isLoading: loadingProduction } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: () => base44.entities.ProductionOrder.list()
  });

  const { data: shipments = [], isLoading: loadingShipments } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => base44.entities.Shipment.list()
  });

  const isLoading = loadingSales || loadingPO || loadingInvoices || loadingInventory || loadingFinance || loadingProduction || loadingShipments;

  // Calculate KPIs
  const totalSalesValue = salesOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
  const openSalesOrders = salesOrders.filter(o => o.status === "Open").length;
  const totalPOValue = purchaseOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
  const pendingInvoices = vendorInvoices.filter(i => i.status === "Posted").length;
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.value || 0), 0);
  const totalRevenue = financialEntries.filter(e => e.gl_account === "400000").reduce((sum, e) => sum + e.credit_amount, 0);
  const activeProduction = productionOrders.filter(p => p.status === "In Process").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">JASCO Analytics Dashboard</h1>
            <p className="text-muted-foreground italic mt-1">Turning data into decisions.</p>
          </div>
          <SyncStatus 
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
            syncInterval={syncInterval}
            onIntervalChange={handleIntervalChange}
          />
        </div>

        {/* Cross-Module Alerts */}
        <CrossModuleAlerts 
          salesOrders={salesOrders}
          purchaseOrders={purchaseOrders}
          inventory={inventory}
          shipments={shipments}
          vendorInvoices={vendorInvoices}
          productionOrders={productionOrders}
        />

        {/* Overview KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Sales Value"
            value={`SAR ${(totalSalesValue / 1000000).toFixed(2)}M`}
            subtitle={`${salesOrders.length} orders`}
            icon={ShoppingCart}
            trend="up"
            trendValue="12% vs last month"
          />
          <KPICard
            title="Open Purchase Orders"
            value={purchaseOrders.filter(p => p.status !== "Fully Received").length}
            subtitle={`SAR ${(totalPOValue / 1000000).toFixed(2)}M total`}
            icon={Package}
          />
          <KPICard
            title="Pending Invoices"
            value={pendingInvoices}
            subtitle={`SAR ${(vendorInvoices.filter(i => i.status === "Posted").reduce((s, i) => s + i.gross_amount, 0) / 1000).toFixed(0)}K`}
            icon={FileText}
          />
          <KPICard
            title="Inventory Value"
            value={`SAR ${(totalInventoryValue / 1000).toFixed(0)}K`}
            subtitle={`${inventory.length} materials`}
            icon={Warehouse}
          />
        </div>

        {/* Module Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="sales" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="purchase" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Purchase</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Warehouse className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2">
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Production</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
          </TabsList>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SalesChart data={salesOrders} />
              </div>
              <StatusPieChart title="Sales Order Status" data={salesOrders} dataKey="status" />
            </div>
            <DataTable
              title="Recent Sales Orders"
              columns={[
                { key: "order_number", label: "Order #" },
                { key: "customer_name", label: "Customer" },
                { key: "order_date", label: "Date" },
                { key: "net_value", label: "Value", format: (v) => `SAR ${v?.toLocaleString()}` },
                { key: "status", label: "Status" }
              ]}
              data={salesOrders}
              maxRows={5}
            />
          </TabsContent>

          {/* Purchase Tab */}
          <TabsContent value="purchase" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Total PO Value" value={`SAR ${(totalPOValue / 1000).toFixed(0)}K`} icon={Package} />
              <KPICard title="Pending Approval" value={purchaseOrders.filter(p => p.status === "Created").length} />
              <KPICard title="Awaiting Delivery" value={purchaseOrders.filter(p => p.status === "Approved").length} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StatusPieChart title="PO Status Distribution" data={purchaseOrders} dataKey="status" />
              <DataTable
                title="Recent Purchase Orders"
                columns={[
                  { key: "po_number", label: "PO #" },
                  { key: "vendor_name", label: "Vendor" },
                  { key: "net_value", label: "Value", format: (v) => `SAR ${v?.toLocaleString()}` },
                  { key: "status", label: "Status" }
                ]}
                data={purchaseOrders}
              />
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Total Stock Value" value={`SAR ${(totalInventoryValue / 1000).toFixed(0)}K`} icon={Warehouse} />
              <KPICard title="Total Materials" value={inventory.length} />
              <KPICard title="Low Stock Items" value={inventory.filter(i => i.quantity_on_hand <= i.reorder_point).length} trend="down" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InventoryAlerts inventory={inventory} />
              <DataTable
                title="Stock Overview"
                columns={[
                  { key: "material_number", label: "Material #" },
                  { key: "material_description", label: "Description" },
                  { key: "quantity_on_hand", label: "Qty", format: (v) => v?.toLocaleString() },
                  { key: "value", label: "Value", format: (v) => `SAR ${v?.toLocaleString()}` }
                ]}
                data={inventory}
              />
            </div>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Total Revenue" value={`SAR ${(totalRevenue / 1000).toFixed(0)}K`} icon={DollarSign} trend="up" />
              <KPICard title="Vendor Payables" value={`SAR ${(financialEntries.filter(e => e.gl_account === "300000").reduce((s, e) => s + e.credit_amount, 0) / 1000).toFixed(0)}K`} />
              <KPICard title="FI Documents" value={financialEntries.length} />
            </div>
            <DataTable
              title="Recent Financial Entries"
              columns={[
                { key: "document_number", label: "Doc #" },
                { key: "posting_date", label: "Date" },
                { key: "gl_account_name", label: "Account" },
                { key: "debit_amount", label: "Debit", format: (v) => v > 0 ? `SAR ${v?.toLocaleString()}` : "-" },
                { key: "credit_amount", label: "Credit", format: (v) => v > 0 ? `SAR ${v?.toLocaleString()}` : "-" }
              ]}
              data={financialEntries}
              maxRows={7}
            />
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Active Orders" value={activeProduction} icon={Factory} />
              <KPICard title="Completed" value={productionOrders.filter(p => p.status === "Completed").length} trend="up" />
              <KPICard title="Pending Release" value={productionOrders.filter(p => p.status === "Created").length} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StatusPieChart title="Production Status" data={productionOrders} dataKey="status" />
              <DataTable
                title="Production Orders"
                columns={[
                  { key: "order_number", label: "Order #" },
                  { key: "material_description", label: "Material" },
                  { key: "planned_quantity", label: "Planned" },
                  { key: "confirmed_quantity", label: "Actual" },
                  { key: "status", label: "Status" }
                ]}
                data={productionOrders}
              />
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Total Invoices" value={vendorInvoices.length} icon={FileText} />
              <KPICard title="Pending Payment" value={`SAR ${(vendorInvoices.filter(i => i.status === "Posted").reduce((s, i) => s + i.gross_amount, 0) / 1000).toFixed(0)}K`} />
              <KPICard title="Blocked" value={vendorInvoices.filter(i => i.status === "Blocked").length} trend="down" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StatusPieChart title="Invoice Status" data={vendorInvoices} dataKey="status" />
              <DataTable
                title="Vendor Invoices"
                columns={[
                  { key: "invoice_number", label: "Invoice #" },
                  { key: "vendor_name", label: "Vendor" },
                  { key: "gross_amount", label: "Amount", format: (v) => `SAR ${v?.toLocaleString()}` },
                  { key: "due_date", label: "Due Date" },
                  { key: "status", label: "Status" }
                ]}
                data={vendorInvoices}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}