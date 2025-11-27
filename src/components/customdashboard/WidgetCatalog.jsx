import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, DollarSign, ShoppingCart, Package, Truck, TrendingUp, 
  BarChart3, PieChart, AlertTriangle, Users, Clock, Warehouse
} from "lucide-react";

export const WIDGET_CATALOG = [
  // Sales Widgets
  { id: "sales-revenue-kpi", name: "Sales Revenue", category: "Sales", type: "kpi", icon: DollarSign, size: "small" },
  { id: "sales-orders-kpi", name: "Total Orders", category: "Sales", type: "kpi", icon: ShoppingCart, size: "small" },
  { id: "sales-avg-order-kpi", name: "Avg Order Value", category: "Sales", type: "kpi", icon: TrendingUp, size: "small" },
  { id: "sales-open-orders-kpi", name: "Open Orders", category: "Sales", type: "kpi", icon: Clock, size: "small" },
  { id: "sales-trend-chart", name: "Sales Trend", category: "Sales", type: "chart", icon: BarChart3, size: "large" },
  { id: "sales-status-pie", name: "Order Status", category: "Sales", type: "chart", icon: PieChart, size: "medium" },
  { id: "sales-top-customers", name: "Top Customers", category: "Sales", type: "table", icon: Users, size: "medium" },
  { id: "sales-by-region", name: "Sales by Region", category: "Sales", type: "chart", icon: BarChart3, size: "medium" },
  
  // Inventory Widgets
  { id: "inventory-value-kpi", name: "Inventory Value", category: "Inventory", type: "kpi", icon: DollarSign, size: "small" },
  { id: "inventory-skus-kpi", name: "Total SKUs", category: "Inventory", type: "kpi", icon: Package, size: "small" },
  { id: "inventory-low-stock-kpi", name: "Low Stock Items", category: "Inventory", type: "kpi", icon: AlertTriangle, size: "small" },
  { id: "inventory-critical-kpi", name: "Critical Stock", category: "Inventory", type: "kpi", icon: AlertTriangle, size: "small" },
  { id: "inventory-by-group", name: "Stock by Group", category: "Inventory", type: "chart", icon: PieChart, size: "medium" },
  { id: "inventory-alerts", name: "Stock Alerts", category: "Inventory", type: "table", icon: AlertTriangle, size: "medium" },
  { id: "inventory-valuation", name: "Valuation Trend", category: "Inventory", type: "chart", icon: BarChart3, size: "large" },
  
  // Delivery Widgets
  { id: "delivery-total-kpi", name: "Total Shipments", category: "Deliveries", type: "kpi", icon: Truck, size: "small" },
  { id: "delivery-delivered-kpi", name: "Delivered", category: "Deliveries", type: "kpi", icon: Package, size: "small" },
  { id: "delivery-ontime-kpi", name: "On-Time Rate", category: "Deliveries", type: "kpi", icon: Clock, size: "small" },
  { id: "delivery-delayed-kpi", name: "Delayed", category: "Deliveries", type: "kpi", icon: AlertTriangle, size: "small" },
  { id: "delivery-trend", name: "Delivery Trend", category: "Deliveries", type: "chart", icon: BarChart3, size: "large" },
  { id: "delivery-status-pie", name: "Status Distribution", category: "Deliveries", type: "chart", icon: PieChart, size: "medium" },
  { id: "delivery-by-carrier", name: "By Carrier", category: "Deliveries", type: "chart", icon: BarChart3, size: "medium" },
  { id: "delivery-delayed-list", name: "Delayed Shipments", category: "Deliveries", type: "table", icon: AlertTriangle, size: "medium" },
];

const categoryColors = {
  Sales: "bg-blue-100 text-blue-800",
  Inventory: "bg-green-100 text-green-800",
  Deliveries: "bg-purple-100 text-purple-800"
};

export default function WidgetCatalog({ onAddWidget, existingWidgets = [] }) {
  const categories = [...new Set(WIDGET_CATALOG.map(w => w.category))];
  
  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">{category}</h3>
            <div className="grid grid-cols-2 gap-2">
              {WIDGET_CATALOG.filter(w => w.category === category).map(widget => {
                const isAdded = existingWidgets.some(ew => ew.widgetId === widget.id);
                const Icon = widget.icon;
                return (
                  <Card 
                    key={widget.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${isAdded ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{widget.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs py-0">
                                {widget.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          disabled={isAdded}
                          onClick={() => onAddWidget(widget)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}