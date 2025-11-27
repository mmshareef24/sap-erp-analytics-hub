import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, FileText, BarChart3, Crown, Package, User, MapPin, TrendingUp, Loader2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import SalesOrdersList from "@/components/sales/SalesOrdersList";
import SalesInvoicesList from "@/components/sales/SalesInvoicesList";
import TopCustomersReport from "@/components/sales/TopCustomersReport";
import ItemsWiseReport from "@/components/sales/ItemsWiseReport";
import SalesmanWiseReport from "@/components/sales/SalesmanWiseReport";
import LocationWiseReport from "@/components/sales/LocationWiseReport";
import MonthlyTrendReport from "@/components/sales/MonthlyTrendReport";

export default function Sales() {
  const [activeTab, setActiveTab] = useState("orders");

  const { data: salesOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => base44.entities.SalesOrder.list()
  });

  const { data: salesOrderItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["salesOrderItems"],
    queryFn: () => base44.entities.SalesOrderItem.list()
  });

  const { data: salesInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["salesInvoices"],
    queryFn: () => base44.entities.SalesInvoice.list()
  });

  const isLoading = loadingOrders || loadingItems || loadingInvoices;

  const totalSalesValue = salesOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
  const totalInvoiceValue = salesInvoices.reduce((sum, i) => sum + (i.gross_amount || 0), 0);
  const openOrders = salesOrders.filter(o => o.status === "Open").length;
  const openInvoices = salesInvoices.filter(i => i.status === "Open").length;

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Module</h1>
          <p className="text-muted-foreground mt-1">Manage orders, invoices, and analyze sales performance</p>
        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Sales Value"
            value={`SAR ${(totalSalesValue / 1000000).toFixed(2)}M`}
            subtitle={`${salesOrders.length} orders`}
            icon={ShoppingCart}
          />
          <KPICard
            title="Open Orders"
            value={openOrders}
            subtitle="Pending processing"
            icon={ShoppingCart}
          />
          <KPICard
            title="Invoice Value"
            value={`SAR ${(totalInvoiceValue / 1000000).toFixed(2)}M`}
            subtitle={`${salesInvoices.length} invoices`}
            icon={FileText}
          />
          <KPICard
            title="Open Invoices"
            value={openInvoices}
            subtitle="Awaiting payment"
            icon={FileText}
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-7 gap-2 h-auto p-1">
            <TabsTrigger value="orders" className="gap-2 py-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Sales Orders</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
              <span className="sm:hidden">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="top-customers" className="gap-2 py-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Top Customers</span>
              <span className="sm:hidden">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2 py-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Items Wise</span>
              <span className="sm:hidden">Items</span>
            </TabsTrigger>
            <TabsTrigger value="salesman" className="gap-2 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Salesman Wise</span>
              <span className="sm:hidden">Salesman</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-2 py-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Location Wise</span>
              <span className="sm:hidden">Location</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Monthly Trends</span>
              <span className="sm:hidden">Trends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <SalesOrdersList salesOrders={salesOrders} salesOrderItems={salesOrderItems} />
          </TabsContent>

          <TabsContent value="invoices">
            <SalesInvoicesList salesInvoices={salesInvoices} />
          </TabsContent>

          <TabsContent value="top-customers">
            <TopCustomersReport salesOrders={salesOrders} />
          </TabsContent>

          <TabsContent value="items">
            <ItemsWiseReport salesOrderItems={salesOrderItems} />
          </TabsContent>

          <TabsContent value="salesman">
            <SalesmanWiseReport salesOrders={salesOrders} />
          </TabsContent>

          <TabsContent value="location">
            <LocationWiseReport salesOrders={salesOrders} />
          </TabsContent>

          <TabsContent value="trends">
            <MonthlyTrendReport salesOrders={salesOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}