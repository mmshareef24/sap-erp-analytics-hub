import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, Truck, Package, Factory, ShoppingCart, 
  Users, AlertTriangle, CheckCircle, ArrowRight
} from "lucide-react";
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, ComposedChart, Area
} from "recharts";

export default function PrebuiltAnalytics({ data }) {
  const { salesOrders, purchaseOrders, inventory, productionOrders, suppliers, shipments } = data;
  const [selectedAnalysis, setSelectedAnalysis] = useState("sales-supplier");

  // Sales to Supplier Lead Time Correlation
  const supplierLeadTimeData = suppliers.filter(s => s.lead_time_days).map(supplier => {
    const supplierPOs = purchaseOrders.filter(po => po.vendor_name === supplier.name);
    const totalSpend = supplierPOs.reduce((sum, po) => sum + (po.net_value || 0), 0);
    const fulfilledPOs = supplierPOs.filter(po => po.status === "Fully Received").length;
    const fulfillmentRate = supplierPOs.length > 0 ? (fulfilledPOs / supplierPOs.length * 100) : 0;
    
    return {
      name: supplier.name,
      leadTime: supplier.lead_time_days,
      rating: supplier.rating || 3,
      spend: totalSpend,
      fulfillmentRate,
      poCount: supplierPOs.length
    };
  }).filter(s => s.poCount > 0);

  // Inventory vs Production Efficiency
  const plantData = productionOrders.reduce((acc, order) => {
    const plant = order.plant || "Unknown";
    if (!acc[plant]) {
      acc[plant] = { planned: 0, confirmed: 0, orders: 0 };
    }
    acc[plant].planned += order.planned_quantity || 0;
    acc[plant].confirmed += order.confirmed_quantity || 0;
    acc[plant].orders += 1;
    return acc;
  }, {});

  const inventoryProductionData = Object.entries(plantData).map(([plant, prod]) => {
    const plantInventory = inventory.filter(i => i.plant === plant);
    const totalStock = plantInventory.reduce((sum, i) => sum + (i.quantity_on_hand || 0), 0);
    const stockValue = plantInventory.reduce((sum, i) => sum + (i.value || 0), 0);
    const efficiency = prod.planned > 0 ? (prod.confirmed / prod.planned * 100) : 0;
    
    return {
      plant,
      stockLevel: totalStock,
      stockValue,
      efficiency,
      productionOrders: prod.orders
    };
  });

  // Sales Region to Shipment Performance
  const regionShipmentData = salesOrders.reduce((acc, order) => {
    const region = order.region || "Unknown";
    if (!acc[region]) {
      acc[region] = { revenue: 0, orders: 0 };
    }
    acc[region].revenue += order.net_value || 0;
    acc[region].orders += 1;
    return acc;
  }, {});

  const regionPerformanceData = Object.entries(regionShipmentData).map(([region, sales]) => {
    const regionShipments = shipments.filter(s => s.destination?.includes(region) || s.origin?.includes(region));
    const delivered = regionShipments.filter(s => s.status === "Delivered").length;
    const delayed = regionShipments.filter(s => s.status === "Delayed").length;
    const onTimeRate = regionShipments.length > 0 ? ((delivered - delayed) / regionShipments.length * 100) : 0;
    
    return {
      region,
      revenue: sales.revenue,
      orders: sales.orders,
      shipments: regionShipments.length,
      onTimeRate: Math.max(0, onTimeRate),
      avgOrderValue: sales.orders > 0 ? sales.revenue / sales.orders : 0
    };
  }).filter(r => r.orders > 0);

  // Order to Cash Cycle Analysis
  const monthlyFlowData = salesOrders.reduce((acc, order) => {
    const month = order.order_date?.substring(0, 7) || "Unknown";
    if (!acc[month]) {
      acc[month] = { salesValue: 0, salesCount: 0, purchaseValue: 0, purchaseCount: 0 };
    }
    acc[month].salesValue += order.net_value || 0;
    acc[month].salesCount += 1;
    return acc;
  }, {});

  purchaseOrders.forEach(po => {
    const month = po.po_date?.substring(0, 7) || "Unknown";
    if (!monthlyFlowData[month]) {
      monthlyFlowData[month] = { salesValue: 0, salesCount: 0, purchaseValue: 0, purchaseCount: 0 };
    }
    monthlyFlowData[month].purchaseValue += po.net_value || 0;
    monthlyFlowData[month].purchaseCount += 1;
  });

  const cashFlowData = Object.entries(monthlyFlowData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month,
      ...data,
      netFlow: data.salesValue - data.purchaseValue,
      margin: data.salesValue > 0 ? ((data.salesValue - data.purchaseValue) / data.salesValue * 100) : 0
    }));

  const analyses = [
    { id: "sales-supplier", label: "Sales & Supplier Performance", icon: Users },
    { id: "inventory-production", label: "Inventory & Production", icon: Factory },
    { id: "region-shipment", label: "Region & Shipment", icon: Truck },
    { id: "order-cash", label: "Order to Cash Flow", icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Analysis Selector */}
      <div className="flex flex-wrap gap-2">
        {analyses.map((analysis) => (
          <Button
            key={analysis.id}
            variant={selectedAnalysis === analysis.id ? "default" : "outline"}
            onClick={() => setSelectedAnalysis(analysis.id)}
            className="flex items-center gap-2"
          >
            <analysis.icon className="h-4 w-4" />
            {analysis.label}
          </Button>
        ))}
      </div>

      {/* Sales & Supplier Performance */}
      {selectedAnalysis === "sales-supplier" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier Lead Time vs Fulfillment Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="leadTime" 
                      name="Lead Time" 
                      unit=" days"
                      label={{ value: 'Lead Time (days)', position: 'bottom', offset: 0 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="fulfillmentRate" 
                      name="Fulfillment" 
                      unit="%"
                      label={{ value: 'Fulfillment Rate (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{d.name}</p>
                              <p className="text-sm">Lead Time: {d.leadTime} days</p>
                              <p className="text-sm">Fulfillment: {d.fulfillmentRate.toFixed(0)}%</p>
                              <p className="text-sm">Rating: {d.rating}/5</p>
                              <p className="text-sm">Spend: SAR {d.spend.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      data={supplierLeadTimeData} 
                      fill="#3b82f6"
                    >
                      {supplierLeadTimeData.map((entry, index) => (
                        <Cell 
                          key={index} 
                          fill={entry.rating >= 4 ? "#10b981" : entry.rating >= 3 ? "#f59e0b" : "#ef4444"}
                          r={Math.max(8, Math.min(20, entry.spend / 50000))}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full" /> Rating ≥4</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full" /> Rating 3</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full" /> Rating &lt;3</div>
                <span className="text-muted-foreground">| Bubble size = Spend</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {supplierLeadTimeData.slice(0, 3).map((supplier, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{supplier.name}</span>
                    <Badge variant={supplier.fulfillmentRate >= 80 ? "default" : "destructive"}>
                      {supplier.fulfillmentRate.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead Time</span>
                      <span>{supplier.leadTime} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Spend</span>
                      <span>SAR {supplier.spend.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inventory & Production */}
      {selectedAnalysis === "inventory-production" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Levels vs Production Efficiency by Plant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={inventoryProductionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plant" />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="stockLevel" fill="#3b82f6" name="Stock Level" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} name="Efficiency %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {inventoryProductionData.slice(0, 4).map((plant, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{plant.plant}</span>
                    <Badge className={plant.efficiency >= 80 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {plant.efficiency.toFixed(0)}% Efficiency
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock Level</p>
                      <p className="font-semibold">{plant.stockLevel.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock Value</p>
                      <p className="font-semibold">SAR {(plant.stockValue / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                  <Progress value={plant.efficiency} className="mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Region & Shipment */}
      {selectedAnalysis === "region-shipment" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regional Revenue vs On-Time Delivery Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="revenue" 
                      tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                      label={{ value: 'Revenue (SAR)', position: 'bottom', offset: 0 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="onTimeRate" 
                      domain={[0, 100]}
                      label={{ value: 'On-Time Rate (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ payload }) => {
                        if (payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{d.region}</p>
                              <p className="text-sm">Revenue: SAR {d.revenue.toLocaleString()}</p>
                              <p className="text-sm">On-Time: {d.onTimeRate.toFixed(0)}%</p>
                              <p className="text-sm">Orders: {d.orders}</p>
                              <p className="text-sm">Shipments: {d.shipments}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={regionPerformanceData} fill="#8b5cf6">
                      {regionPerformanceData.map((entry, index) => (
                        <Cell 
                          key={index} 
                          fill={entry.onTimeRate >= 80 ? "#10b981" : entry.onTimeRate >= 60 ? "#f59e0b" : "#ef4444"}
                          r={Math.max(10, Math.min(25, entry.orders / 2))}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order to Cash Flow */}
      {selectedAnalysis === "order-cash" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sales vs Purchase Flow & Net Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(v, name) => [
                      name.includes('margin') ? `${v.toFixed(1)}%` : `SAR ${v.toLocaleString()}`,
                      name
                    ]} />
                    <Area yAxisId="left" type="monotone" dataKey="salesValue" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" name="Sales" />
                    <Area yAxisId="left" type="monotone" dataKey="purchaseValue" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" name="Purchases" />
                    <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={3} name="Margin %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">
                  SAR {(cashFlowData.reduce((s, d) => s + d.salesValue, 0) / 1000).toFixed(0)}K
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-red-600">
                  SAR {(cashFlowData.reduce((s, d) => s + d.purchaseValue, 0) / 1000).toFixed(0)}K
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Net Flow</p>
                <p className="text-2xl font-bold text-green-600">
                  SAR {(cashFlowData.reduce((s, d) => s + d.netFlow, 0) / 1000).toFixed(0)}K
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(cashFlowData.reduce((s, d) => s + d.margin, 0) / cashFlowData.length).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}