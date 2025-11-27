import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, Package, Clock, CheckCircle, AlertTriangle, Search, 
  Download, TrendingUp, Calendar, MapPin, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import KPICard from "@/components/dashboard/KPICard";
import InteractiveTrendChart from "@/components/charts/InteractiveTrendChart";
import DrillDownPieChart from "@/components/charts/DrillDownPieChart";
import DeliveryPerformanceReport from "@/components/deliveries/DeliveryPerformanceReport";
import CarrierAnalysis from "@/components/deliveries/CarrierAnalysis";

const statusColors = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "In Transit": "bg-blue-100 text-blue-800",
  "Delivered": "bg-green-100 text-green-800",
  "Delayed": "bg-red-100 text-red-800",
  "Cancelled": "bg-gray-100 text-gray-800"
};

export default function Deliveries() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => base44.entities.Shipment.list()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // KPI Calculations
  const totalDeliveries = shipments.length;
  const delivered = shipments.filter(s => s.status === "Delivered").length;
  const inTransit = shipments.filter(s => s.status === "In Transit").length;
  const delayed = shipments.filter(s => s.status === "Delayed").length;
  const pending = shipments.filter(s => s.status === "Pending").length;

  const onTimeDeliveries = shipments.filter(s => 
    s.status === "Delivered" && s.actual_delivery && s.expected_delivery &&
    new Date(s.actual_delivery) <= new Date(s.expected_delivery)
  ).length;
  const onTimeRate = delivered > 0 ? (onTimeDeliveries / delivered * 100) : 0;

  const totalFreight = shipments.reduce((sum, s) => sum + (s.freight_cost || 0), 0);
  const avgFreight = totalDeliveries > 0 ? totalFreight / totalDeliveries : 0;

  // Get unique carriers
  const carriers = [...new Set(shipments.map(s => s.carrier).filter(Boolean))];

  // Filtered shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch = !search || 
      s.shipment_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.origin?.toLowerCase().includes(search.toLowerCase()) ||
      s.destination?.toLowerCase().includes(search.toLowerCase()) ||
      s.carrier?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesType = typeFilter === "all" || s.type === typeFilter;
    const matchesCarrier = carrierFilter === "all" || s.carrier === carrierFilter;
    return matchesSearch && matchesStatus && matchesType && matchesCarrier;
  });

  // Monthly trend data
  const monthlyTrend = shipments.reduce((acc, s) => {
    const month = s.ship_date?.substring(0, 7) || "Unknown";
    if (!acc[month]) {
      acc[month] = { month, total: 0, delivered: 0, delayed: 0, freight: 0 };
    }
    acc[month].total += 1;
    if (s.status === "Delivered") acc[month].delivered += 1;
    if (s.status === "Delayed") acc[month].delayed += 1;
    acc[month].freight += s.freight_cost || 0;
    return acc;
  }, {});

  const trendData = Object.values(monthlyTrend)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map(m => ({
      ...m,
      onTimeRate: m.total > 0 ? ((m.delivered - m.delayed) / m.total * 100) : 0
    }));

  // Status distribution
  const statusData = [
    { name: "Delivered", value: delivered },
    { name: "In Transit", value: inTransit },
    { name: "Pending", value: pending },
    { name: "Delayed", value: delayed }
  ].filter(s => s.value > 0);

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Shipment #", "Type", "Origin", "Destination", "Carrier", "Status", "Ship Date", "Expected", "Actual", "Freight Cost"];
    const rows = filteredShipments.map(s => [
      s.shipment_number,
      s.type,
      s.origin,
      s.destination,
      s.carrier,
      s.status,
      s.ship_date,
      s.expected_delivery,
      s.actual_delivery || "",
      s.freight_cost || 0
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deliveries-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries Report</h1>
          <p className="text-muted-foreground">Complete delivery and shipment analytics</p>
        </div>
        <Button onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Total Shipments"
          value={totalDeliveries}
          icon={Package}
          subtitle={`${inTransit} in transit`}
        />
        <KPICard
          title="Delivered"
          value={delivered}
          icon={CheckCircle}
          subtitle={`${((delivered / totalDeliveries) * 100).toFixed(0)}% of total`}
          className="border-green-200"
        />
        <KPICard
          title="On-Time Rate"
          value={`${onTimeRate.toFixed(1)}%`}
          icon={Clock}
          trend={onTimeRate >= 80 ? "up" : "down"}
          trendValue={onTimeRate >= 80 ? "Good" : "Needs attention"}
        />
        <KPICard
          title="Delayed"
          value={delayed}
          icon={AlertTriangle}
          subtitle={`${((delayed / totalDeliveries) * 100).toFixed(1)}% of total`}
          className="border-red-200"
        />
        <KPICard
          title="Total Freight"
          value={`SAR ${(totalFreight / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          subtitle={`Avg: SAR ${avgFreight.toFixed(0)}`}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="carriers">Carrier Analysis</TabsTrigger>
          <TabsTrigger value="details">Detailed List</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Trend Chart */}
          <InteractiveTrendChart
            data={trendData}
            title="Delivery Trend"
            bars={[
              { dataKey: "total", color: "#3b82f6", name: "Total Shipments", yAxisId: "left" },
              { dataKey: "delivered", color: "#10b981", name: "Delivered", yAxisId: "left" }
            ]}
            lines={[
              { dataKey: "onTimeRate", color: "#f59e0b", name: "On-Time %", yAxisId: "right" }
            ]}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <DrillDownPieChart
              data={statusData}
              title="Status Distribution"
              valueKey="value"
              nameKey="name"
              formatValue={(v) => `${v} shipments`}
            />

            {/* Recent Delayed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Delayed Shipments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shipments.filter(s => s.status === "Delayed").slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{s.shipment_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.origin} → {s.destination}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{s.carrier}</p>
                        <p className="text-xs text-muted-foreground">
                          Expected: {s.expected_delivery}
                        </p>
                      </div>
                    </div>
                  ))}
                  {delayed === 0 && (
                    <p className="text-center text-muted-foreground py-4">No delayed shipments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <DeliveryPerformanceReport shipments={shipments} />
        </TabsContent>

        <TabsContent value="carriers">
          <CarrierAnalysis shipments={shipments} />
        </TabsContent>

        <TabsContent value="details">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shipments..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    {carriers.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="mt-4">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Ship Date</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Freight</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.slice(0, 50).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.shipment_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {s.origin} → {s.destination}
                          </div>
                        </TableCell>
                        <TableCell>{s.carrier}</TableCell>
                        <TableCell>{s.ship_date}</TableCell>
                        <TableCell>{s.expected_delivery}</TableCell>
                        <TableCell>{s.actual_delivery || "-"}</TableCell>
                        <TableCell>SAR {(s.freight_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[s.status]}>{s.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredShipments.length > 50 && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Showing 50 of {filteredShipments.length} records
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}