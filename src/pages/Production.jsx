import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, Cpu, Building, TrendingUp, Box, Loader2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import ProductionOrdersList from "@/components/production/ProductionOrdersList";
import WorkCenterAnalysis from "@/components/production/WorkCenterAnalysis";
import PlantAnalysis from "@/components/production/PlantAnalysis";
import ProductionTrendReport from "@/components/production/ProductionTrendReport";
import MaterialProductionReport from "@/components/production/MaterialProductionReport";

export default function Production() {
  const [activeTab, setActiveTab] = useState("orders");

  const { data: productionOrders = [], isLoading } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: () => base44.entities.ProductionOrder.list()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOrders = productionOrders.length;
  const inProcess = productionOrders.filter(o => o.status === "In Process").length;
  const completed = productionOrders.filter(o => o.status === "Completed" || o.status === "Closed").length;
  const totalPlanned = productionOrders.reduce((sum, o) => sum + (o.planned_quantity || 0), 0);
  const totalConfirmed = productionOrders.reduce((sum, o) => sum + (o.confirmed_quantity || 0), 0);
  const efficiency = totalPlanned > 0 ? ((totalConfirmed / totalPlanned) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Module</h1>
          <p className="text-muted-foreground mt-1">Production orders, work centers, and manufacturing analytics</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Orders"
            value={totalOrders}
            subtitle="All production orders"
            icon={Factory}
          />
          <KPICard
            title="In Process"
            value={inProcess}
            subtitle="Currently running"
            icon={Cpu}
          />
          <KPICard
            title="Completed"
            value={completed}
            subtitle="Finished orders"
            icon={Factory}
          />
          <KPICard
            title="Efficiency"
            value={`${efficiency}%`}
            subtitle="Confirmed vs Planned"
            icon={TrendingUp}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="orders" className="gap-2 py-2">
              <Factory className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="work-centers" className="gap-2 py-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Work Centers</span>
            </TabsTrigger>
            <TabsTrigger value="plants" className="gap-2 py-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Plants</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 py-2">
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <ProductionOrdersList productionOrders={productionOrders} />
          </TabsContent>

          <TabsContent value="work-centers">
            <WorkCenterAnalysis productionOrders={productionOrders} />
          </TabsContent>

          <TabsContent value="plants">
            <PlantAnalysis productionOrders={productionOrders} />
          </TabsContent>

          <TabsContent value="materials">
            <MaterialProductionReport productionOrders={productionOrders} />
          </TabsContent>

          <TabsContent value="trends">
            <ProductionTrendReport productionOrders={productionOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}