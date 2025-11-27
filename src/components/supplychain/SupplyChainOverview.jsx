import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Users, Package, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import SupplierNetwork from "@/components/charts/SupplierNetwork";
import DrillDownPieChart from "@/components/charts/DrillDownPieChart";
import InteractiveTrendChart from "@/components/charts/InteractiveTrendChart";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function SupplyChainOverview({ shipments, suppliers, purchaseOrders, inventory }) {
  // Shipment metrics
  const inTransit = shipments.filter(s => s.status === "In Transit").length;
  const delivered = shipments.filter(s => s.status === "Delivered").length;
  const delayed = shipments.filter(s => s.status === "Delayed").length;
  const pending = shipments.filter(s => s.status === "Pending").length;

  const onTimeDeliveries = shipments.filter(s => 
    s.status === "Delivered" && s.actual_delivery && s.expected_delivery &&
    new Date(s.actual_delivery) <= new Date(s.expected_delivery)
  ).length;
  const onTimeRate = delivered > 0 ? (onTimeDeliveries / delivered * 100) : 0;

  // Supplier metrics
  const activeSuppliers = suppliers.filter(s => s.status === "Active").length;
  const avgRating = suppliers.length > 0 
    ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.filter(s => s.rating).length 
    : 0;

  // Freight costs
  const totalFreight = shipments.reduce((sum, s) => sum + (s.freight_cost || 0), 0);

  // PO fulfillment
  const fulfilledPOs = purchaseOrders.filter(p => p.status === "Fully Received").length;
  const fulfillmentRate = purchaseOrders.length > 0 ? (fulfilledPOs / purchaseOrders.length * 100) : 0;

  // Low stock items
  const lowStockItems = inventory.filter(i => i.reorder_point && i.quantity_on_hand <= i.reorder_point);

  const shipmentStatusData = [
    { name: "Delivered", value: delivered, color: "#10b981" },
    { name: "In Transit", value: inTransit, color: "#3b82f6" },
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Delayed", value: delayed, color: "#ef4444" }
  ].filter(s => s.value > 0);

  // Shipment trend by month
  const shipmentTrend = shipments.reduce((acc, s) => {
    const month = s.ship_date?.substring(0, 7) || "Unknown";
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.shipments += 1;
      existing.freight += s.freight_cost || 0;
      if (s.status === "Delivered") existing.delivered += 1;
    } else {
      acc.push({ 
        month, 
        shipments: 1, 
        freight: s.freight_cost || 0,
        delivered: s.status === "Delivered" ? 1 : 0
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(m => ({
    ...m,
    onTimeRate: m.shipments > 0 ? (m.delivered / m.shipments * 100) : 0
  }));

  // Carrier distribution for drill-down
  const carrierData = shipments.reduce((acc, s) => {
    const carrier = s.carrier || "Unknown";
    const existing = acc.find(c => c.name === carrier);
    if (existing) {
      existing.value += s.freight_cost || 0;
    } else {
      acc.push({ name: carrier, value: s.freight_cost || 0 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Shipments</p>
                <p className="text-2xl font-bold">{inTransit + pending}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{inTransit} in transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On-Time Delivery</p>
                <p className="text-2xl font-bold">{onTimeRate.toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={onTimeRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{activeSuppliers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Avg rating: {avgRating.toFixed(1)}/5</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Freight Cost</p>
                <p className="text-2xl font-bold">SAR {(totalFreight / 1000).toFixed(0)}K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{shipments.length} shipments</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Trend Chart */}
      <InteractiveTrendChart
        data={shipmentTrend}
        title="Shipment & Freight Trend"
        bars={[
          { dataKey: "shipments", color: "#3b82f6", name: "Shipments", yAxisId: "left" }
        ]}
        lines={[
          { dataKey: "freight", color: "#10b981", name: "Freight Cost (SAR)", yAxisId: "right" },
          { dataKey: "onTimeRate", color: "#f59e0b", name: "On-Time %", yAxisId: "right" }
        ]}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Carrier Distribution */}
        <DrillDownPieChart
          data={carrierData}
          title="Freight Cost by Carrier"
          valueKey="value"
          nameKey="name"
          formatValue={(v) => `SAR ${v.toLocaleString()}`}
        />

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Supply Chain Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {delayed > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Delayed Shipments</span>
                  </div>
                  <Badge variant="destructive">{delayed}</Badge>
                </div>
              )}
              {lowStockItems.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Low Stock Items</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">{lowStockItems.length}</Badge>
                </div>
              )}
              {suppliers.filter(s => s.status === "Blocked").length > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Blocked Suppliers</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {suppliers.filter(s => s.status === "Blocked").length}
                  </Badge>
                </div>
              )}
              {delayed === 0 && lowStockItems.length === 0 && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  No critical alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Network */}
      <SupplierNetwork suppliers={suppliers} purchaseOrders={purchaseOrders} />

      {/* Recent Shipments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shipments.slice(0, 5).map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{shipment.shipment_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {shipment.origin} → {shipment.destination}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={
                    shipment.status === "Delivered" ? "default" :
                    shipment.status === "Delayed" ? "destructive" :
                    "outline"
                  }>
                    {shipment.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{shipment.carrier}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}