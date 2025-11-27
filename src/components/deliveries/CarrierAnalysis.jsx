import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Truck, Star, DollarSign, Clock, TrendingUp } from "lucide-react";

export default function CarrierAnalysis({ shipments }) {
  const [selectedCarrier, setSelectedCarrier] = useState(null);

  // Aggregate carrier data
  const carrierData = shipments.reduce((acc, s) => {
    const carrier = s.carrier || "Unknown";
    if (!acc[carrier]) {
      acc[carrier] = {
        name: carrier,
        total: 0,
        delivered: 0,
        onTime: 0,
        delayed: 0,
        totalFreight: 0,
        shipments: []
      };
    }
    acc[carrier].total += 1;
    acc[carrier].totalFreight += s.freight_cost || 0;
    acc[carrier].shipments.push(s);
    
    if (s.status === "Delivered") {
      acc[carrier].delivered += 1;
      if (s.actual_delivery && s.expected_delivery && 
          new Date(s.actual_delivery) <= new Date(s.expected_delivery)) {
        acc[carrier].onTime += 1;
      }
    }
    if (s.status === "Delayed") {
      acc[carrier].delayed += 1;
    }
    return acc;
  }, {});

  const carriers = Object.values(carrierData).map(c => ({
    ...c,
    onTimeRate: c.delivered > 0 ? (c.onTime / c.delivered * 100) : 0,
    delayRate: c.total > 0 ? (c.delayed / c.total * 100) : 0,
    avgFreight: c.total > 0 ? c.totalFreight / c.total : 0,
    deliveryRate: c.total > 0 ? (c.delivered / c.total * 100) : 0,
    // Calculate a score (0-100)
    score: c.delivered > 0 
      ? ((c.onTime / c.delivered * 50) + ((1 - c.delayed / c.total) * 30) + (c.delivered / c.total * 20))
      : 0
  })).sort((a, b) => b.total - a.total);

  // Cost efficiency data
  const costData = carriers.map(c => ({
    name: c.name,
    avgCost: c.avgFreight,
    onTimeRate: c.onTimeRate,
    total: c.total
  }));

  // Radar chart data for top carriers
  const radarData = carriers.slice(0, 5).map(c => ({
    carrier: c.name.substring(0, 10),
    "On-Time": c.onTimeRate,
    "Delivery": c.deliveryRate,
    "Reliability": 100 - c.delayRate,
    "Volume": (c.total / Math.max(...carriers.map(x => x.total))) * 100,
    "Cost Eff.": 100 - (c.avgFreight / Math.max(...carriers.map(x => x.avgFreight))) * 100
  }));

  return (
    <div className="space-y-6">
      {/* Carrier Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" /> Carrier Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carriers.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="total" fill="#3b82f6" name="Total Shipments" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="delivered" fill="#10b981" name="Delivered" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="onTimeRate" fill="#f59e0b" name="On-Time %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cost vs Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Cost vs Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="avgCost" 
                    name="Avg Cost"
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="onTimeRate" 
                    name="On-Time %"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-sm">Avg Cost: SAR {d.avgCost.toFixed(0)}</p>
                            <p className="text-sm">On-Time: {d.onTimeRate.toFixed(0)}%</p>
                            <p className="text-sm">Shipments: {d.total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={costData}>
                    {costData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.onTimeRate >= 80 ? "#10b981" : entry.onTimeRate >= 60 ? "#f59e0b" : "#ef4444"}
                        r={Math.max(8, Math.min(20, entry.total / 2))}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full" /> ≥80% On-Time</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full" /> 60-79%</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full" /> &lt;60%</div>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Carriers Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="carrier" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="On-Time" dataKey="On-Time" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="Reliability" dataKey="Reliability" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrier Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {carriers.slice(0, 6).map((carrier) => (
          <Card 
            key={carrier.name} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedCarrier(carrier)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <span className="font-semibold">{carrier.name}</span>
                </div>
                <Badge className={
                  carrier.score >= 70 ? "bg-green-100 text-green-800" :
                  carrier.score >= 50 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }>
                  Score: {carrier.score.toFixed(0)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground">Shipments</p>
                  <p className="font-medium">{carrier.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivered</p>
                  <p className="font-medium">{carrier.delivered}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">On-Time</p>
                  <p className="font-medium text-green-600">{carrier.onTimeRate.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Freight</p>
                  <p className="font-medium">SAR {carrier.avgFreight.toFixed(0)}</p>
                </div>
              </div>
              <Progress value={carrier.onTimeRate} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carrier Detail Dialog */}
      <Dialog open={!!selectedCarrier} onOpenChange={() => setSelectedCarrier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> {selectedCarrier?.name} Details
            </DialogTitle>
          </DialogHeader>
          {selectedCarrier && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{selectedCarrier.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">On-Time</p>
                  <p className="text-xl font-bold text-green-600">{selectedCarrier.onTimeRate.toFixed(0)}%</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Delayed</p>
                  <p className="text-xl font-bold text-red-600">{selectedCarrier.delayed}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Total Freight</p>
                  <p className="text-xl font-bold">SAR {(selectedCarrier.totalFreight / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Freight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCarrier.shipments.slice(0, 10).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.shipment_number}</TableCell>
                        <TableCell>{s.origin} → {s.destination}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.status}</Badge>
                        </TableCell>
                        <TableCell>SAR {(s.freight_cost || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}