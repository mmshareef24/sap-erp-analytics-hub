import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, GripVertical } from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { WIDGET_CATALOG } from "./WidgetCatalog";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function WidgetRenderer({ 
  widget, 
  data, 
  onRemove, 
  isEditing = false,
  dragHandleProps = {}
}) {
  const widgetConfig = WIDGET_CATALOG.find(w => w.id === widget.widgetId);
  if (!widgetConfig) return null;

  const { salesOrders = [], inventory = [], shipments = [] } = data;

  // Calculate data based on widget type
  const renderContent = () => {
    switch (widget.widgetId) {
      // Sales KPIs
      case "sales-revenue-kpi": {
        const value = salesOrders.reduce((sum, o) => sum + (o.net_value || 0), 0);
        return <KPIDisplay label="Total Revenue" value={`SAR ${(value / 1000).toFixed(0)}K`} />;
      }
      case "sales-orders-kpi":
        return <KPIDisplay label="Total Orders" value={salesOrders.length} />;
      case "sales-avg-order-kpi": {
        const avg = salesOrders.length > 0 
          ? salesOrders.reduce((sum, o) => sum + (o.net_value || 0), 0) / salesOrders.length 
          : 0;
        return <KPIDisplay label="Avg Order Value" value={`SAR ${avg.toFixed(0)}`} />;
      }
      case "sales-open-orders-kpi": {
        const open = salesOrders.filter(o => o.status === "Open").length;
        return <KPIDisplay label="Open Orders" value={open} />;
      }
      case "sales-trend-chart": {
        const monthly = getMonthlyData(salesOrders, "order_date", "net_value");
        return <LineChartWidget data={monthly} dataKey="value" />;
      }
      case "sales-status-pie": {
        const statusData = getStatusDistribution(salesOrders);
        return <PieChartWidget data={statusData} />;
      }
      case "sales-top-customers": {
        const customers = getTopItems(salesOrders, "customer_name", "net_value", 5);
        return <TableWidget data={customers} labelKey="name" valueKey="value" valuePrefix="SAR " />;
      }
      case "sales-by-region": {
        const regions = getTopItems(salesOrders, "region", "net_value", 5);
        return <BarChartWidget data={regions} />;
      }

      // Inventory KPIs
      case "inventory-value-kpi": {
        const value = inventory.reduce((sum, i) => sum + (i.value || 0), 0);
        return <KPIDisplay label="Inventory Value" value={`SAR ${(value / 1000).toFixed(0)}K`} />;
      }
      case "inventory-skus-kpi":
        return <KPIDisplay label="Total SKUs" value={inventory.length} />;
      case "inventory-low-stock-kpi": {
        const low = inventory.filter(i => (i.quantity_on_hand || 0) <= (i.reorder_point || 0)).length;
        return <KPIDisplay label="Low Stock" value={low} alert={low > 0} />;
      }
      case "inventory-critical-kpi": {
        const critical = inventory.filter(i => (i.quantity_on_hand || 0) <= (i.safety_stock || 0)).length;
        return <KPIDisplay label="Critical Stock" value={critical} alert={critical > 0} />;
      }
      case "inventory-by-group": {
        const groups = getTopItems(inventory, "material_group", "value", 5);
        return <PieChartWidget data={groups} />;
      }
      case "inventory-alerts": {
        const alerts = inventory
          .filter(i => (i.quantity_on_hand || 0) <= (i.reorder_point || 0))
          .slice(0, 5)
          .map(i => ({ name: i.material_description, value: i.quantity_on_hand }));
        return <TableWidget data={alerts} labelKey="name" valueKey="value" valueSuffix=" units" />;
      }
      case "inventory-valuation": {
        const groups = getTopItems(inventory, "material_group", "value", 6);
        return <BarChartWidget data={groups} />;
      }

      // Delivery KPIs
      case "delivery-total-kpi":
        return <KPIDisplay label="Total Shipments" value={shipments.length} />;
      case "delivery-delivered-kpi": {
        const delivered = shipments.filter(s => s.status === "Delivered").length;
        return <KPIDisplay label="Delivered" value={delivered} />;
      }
      case "delivery-ontime-kpi": {
        const delivered = shipments.filter(s => s.status === "Delivered");
        const onTime = delivered.filter(s => 
          s.actual_delivery && s.expected_delivery && 
          new Date(s.actual_delivery) <= new Date(s.expected_delivery)
        ).length;
        const rate = delivered.length > 0 ? (onTime / delivered.length * 100) : 0;
        return <KPIDisplay label="On-Time Rate" value={`${rate.toFixed(1)}%`} />;
      }
      case "delivery-delayed-kpi": {
        const delayed = shipments.filter(s => s.status === "Delayed").length;
        return <KPIDisplay label="Delayed" value={delayed} alert={delayed > 0} />;
      }
      case "delivery-trend": {
        const monthly = getMonthlyData(shipments, "ship_date", null, true);
        return <LineChartWidget data={monthly} dataKey="value" />;
      }
      case "delivery-status-pie": {
        const statusData = getStatusDistribution(shipments);
        return <PieChartWidget data={statusData} />;
      }
      case "delivery-by-carrier": {
        const carriers = getTopItems(shipments, "carrier", "freight_cost", 5);
        return <BarChartWidget data={carriers} />;
      }
      case "delivery-delayed-list": {
        const delayed = shipments
          .filter(s => s.status === "Delayed")
          .slice(0, 5)
          .map(s => ({ name: s.shipment_number, value: s.destination }));
        return <TableWidget data={delayed} labelKey="name" valueKey="value" />;
      }

      default:
        return <p className="text-muted-foreground text-sm">Widget not found</p>;
    }
  };

  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-1 md:col-span-2",
    large: "col-span-1 md:col-span-2 lg:col-span-3"
  };

  return (
    <Card className={`${sizeClasses[widgetConfig.size]} ${isEditing ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing && (
            <div {...dragHandleProps} className="cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <CardTitle className="text-sm font-medium">{widgetConfig.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">{widgetConfig.category}</Badge>
          {isEditing && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

// Helper components
function KPIDisplay({ label, value, alert = false }) {
  return (
    <div className={`py-2 ${alert ? 'text-red-600' : ''}`}>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function LineChartWidget({ data, dataKey }) {
  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChartWidget({ data }) {
  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartWidget({ data }) {
  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TableWidget({ data, labelKey, valueKey, valuePrefix = "", valueSuffix = "" }) {
  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground truncate">{item[labelKey]}</span>
          <span className="font-medium">{valuePrefix}{typeof item[valueKey] === 'number' ? item[valueKey].toLocaleString() : item[valueKey]}{valueSuffix}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-muted-foreground text-sm text-center py-2">No data</p>}
    </div>
  );
}

// Helper functions
function getMonthlyData(items, dateKey, valueKey, countOnly = false) {
  const monthly = items.reduce((acc, item) => {
    const month = item[dateKey]?.substring(0, 7) || "Unknown";
    if (!acc[month]) acc[month] = { name: month, value: 0 };
    acc[month].value += countOnly ? 1 : (item[valueKey] || 0);
    return acc;
  }, {});
  return Object.values(monthly).sort((a, b) => a.name.localeCompare(b.name)).slice(-6);
}

function getStatusDistribution(items) {
  const dist = items.reduce((acc, item) => {
    const status = item.status || "Unknown";
    if (!acc[status]) acc[status] = { name: status, value: 0 };
    acc[status].value += 1;
    return acc;
  }, {});
  return Object.values(dist);
}

function getTopItems(items, groupKey, valueKey, limit = 5) {
  const grouped = items.reduce((acc, item) => {
    const key = item[groupKey] || "Unknown";
    if (!acc[key]) acc[key] = { name: key, value: 0 };
    acc[key].value += valueKey ? (item[valueKey] || 0) : 1;
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => b.value - a.value).slice(0, limit);
}