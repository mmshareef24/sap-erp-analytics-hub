import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Users, Package, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Shipment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {shipmentStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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