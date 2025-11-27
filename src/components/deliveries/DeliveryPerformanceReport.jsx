import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Area
} from "recharts";
import { Clock, TrendingUp, Calendar, CheckCircle, AlertTriangle } from "lucide-react";

export default function DeliveryPerformanceReport({ shipments }) {
  // Calculate delivery times
  const deliveredShipments = shipments.filter(s => s.status === "Delivered" && s.ship_date && s.actual_delivery);
  
  const deliveryTimes = deliveredShipments.map(s => {
    const shipDate = new Date(s.ship_date);
    const deliveryDate = new Date(s.actual_delivery);
    const days = Math.ceil((deliveryDate - shipDate) / (1000 * 60 * 60 * 24));
    return { ...s, deliveryDays: days };
  });

  const avgDeliveryTime = deliveryTimes.length > 0 
    ? deliveryTimes.reduce((sum, s) => sum + s.deliveryDays, 0) / deliveryTimes.length 
    : 0;

  // On-time vs late analysis
  const onTimeDeliveries = shipments.filter(s => 
    s.status === "Delivered" && s.actual_delivery && s.expected_delivery &&
    new Date(s.actual_delivery) <= new Date(s.expected_delivery)
  );
  const lateDeliveries = shipments.filter(s => 
    s.status === "Delivered" && s.actual_delivery && s.expected_delivery &&
    new Date(s.actual_delivery) > new Date(s.expected_delivery)
  );

  // Performance by type
  const typePerformance = ["Inbound", "Outbound", "Transfer"].map(type => {
    const typeShipments = shipments.filter(s => s.type === type);
    const typeDelivered = typeShipments.filter(s => s.status === "Delivered").length;
    const typeOnTime = typeShipments.filter(s => 
      s.status === "Delivered" && s.actual_delivery && s.expected_delivery &&
      new Date(s.actual_delivery) <= new Date(s.expected_delivery)
    ).length;
    
    return {
      type,
      total: typeShipments.length,
      delivered: typeDelivered,
      onTimeRate: typeDelivered > 0 ? (typeOnTime / typeDelivered * 100) : 0,
      avgFreight: typeShipments.length > 0 
        ? typeShipments.reduce((sum, s) => sum + (s.freight_cost || 0), 0) / typeShipments.length 
        : 0
    };
  });

  // Weekly performance (last 8 weeks)
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekShipments = shipments.filter(s => {
      if (!s.ship_date) return false;
      const shipDate = new Date(s.ship_date);
      return shipDate >= weekStart && shipDate <= weekEnd;
    });

    const weekDelivered = weekShipments.filter(s => s.status === "Delivered").length;
    const weekOnTime = weekShipments.filter(s => 
      s.status === "Delivered" && s.actual_delivery && s.expected_delivery &&
      new Date(s.actual_delivery) <= new Date(s.expected_delivery)
    ).length;

    weeklyData.push({
      week: `W${8 - i}`,
      shipments: weekShipments.length,
      delivered: weekDelivered,
      onTimeRate: weekDelivered > 0 ? (weekOnTime / weekDelivered * 100) : 0
    });
  }

  // Destination performance
  const destinationData = shipments.reduce((acc, s) => {
    const dest = s.destination || "Unknown";
    if (!acc[dest]) {
      acc[dest] = { destination: dest, total: 0, delivered: 0, onTime: 0 };
    }
    acc[dest].total += 1;
    if (s.status === "Delivered") {
      acc[dest].delivered += 1;
      if (s.actual_delivery && s.expected_delivery && new Date(s.actual_delivery) <= new Date(s.expected_delivery)) {
        acc[dest].onTime += 1;
      }
    }
    return acc;
  }, {});

  const topDestinations = Object.values(destinationData)
    .map(d => ({
      ...d,
      onTimeRate: d.delivered > 0 ? (d.onTime / d.delivered * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                <p className="text-2xl font-bold">{avgDeliveryTime.toFixed(1)} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">On-Time Deliveries</p>
                <p className="text-2xl font-bold">{onTimeDeliveries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Late Deliveries</p>
                <p className="text-2xl font-bold">{lateDeliveries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {deliveredShipments.length > 0 
                    ? ((onTimeDeliveries.length / deliveredShipments.length) * 100).toFixed(0) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Weekly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="shipments" fill="#3b82f6" name="Shipments" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="delivered" fill="#10b981" name="Delivered" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="onTimeRate" stroke="#f59e0b" strokeWidth={2} name="On-Time %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typePerformance.map((t) => (
                <div key={t.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{t.total} shipments</Badge>
                      <Badge className={t.onTimeRate >= 80 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                        {t.onTimeRate.toFixed(0)}% on-time
                      </Badge>
                    </div>
                  </div>
                  <Progress value={t.onTimeRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Avg freight: SAR {t.avgFreight.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDestinations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="destination" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}