import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  AlertTriangle, TrendingDown, Clock, Truck, Package, 
  Warehouse, DollarSign, Factory, ArrowRight, ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function CrossModuleAlerts({ 
  salesOrders = [], 
  purchaseOrders = [], 
  inventory = [], 
  shipments = [], 
  vendorInvoices = [], 
  productionOrders = [] 
}) {
  const today = moment();

  // Generate cross-module alerts
  const alerts = [];

  // Sales + Inventory: Orders at risk due to low stock
  const lowStockMaterials = new Set(
    inventory.filter(i => i.quantity_on_hand <= (i.reorder_point || 0)).map(i => i.material_number)
  );
  const ordersAtRisk = salesOrders.filter(o => 
    o.status === "Open" && lowStockMaterials.has(o.material_group)
  );
  if (ordersAtRisk.length > 0) {
    alerts.push({
      id: "orders-at-risk",
      priority: "critical",
      icon: ShoppingCart,
      title: "Orders at Risk",
      message: `${ordersAtRisk.length} open orders may be affected by low inventory`,
      module: "Sales",
      link: "Sales"
    });
  }

  // Delivery + Sales: Delayed shipments affecting sales
  const delayedShipments = shipments.filter(s => s.status === "Delayed");
  if (delayedShipments.length > 0) {
    alerts.push({
      id: "delayed-shipments",
      priority: "critical",
      icon: Truck,
      title: "Delivery Delays",
      message: `${delayedShipments.length} shipments delayed - customer impact expected`,
      module: "Deliveries",
      link: "Deliveries"
    });
  }

  // Finance + Purchase: Overdue invoices affecting vendor relationships
  const overdueInvoices = vendorInvoices.filter(i => 
    i.due_date && moment(i.due_date).isBefore(today) && i.status === "Posted"
  );
  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((s, i) => s + (i.gross_amount || 0), 0);
    alerts.push({
      id: "overdue-invoices",
      priority: "warning",
      icon: DollarSign,
      title: "Payment Overdue",
      message: `SAR ${(totalOverdue/1000).toFixed(0)}K in overdue vendor invoices`,
      module: "Finance",
      link: "Finance"
    });
  }

  // Production + Inventory: Production delays affecting stock
  const delayedProduction = productionOrders.filter(p => 
    p.end_date && moment(p.end_date).isBefore(today) && p.status !== "Completed" && p.status !== "Closed"
  );
  if (delayedProduction.length > 0) {
    alerts.push({
      id: "production-delays",
      priority: "warning",
      icon: Factory,
      title: "Production Behind",
      message: `${delayedProduction.length} production orders past completion date`,
      module: "Production",
      link: "Production"
    });
  }

  // Inventory critical: Out of stock items
  const outOfStock = inventory.filter(i => i.quantity_on_hand === 0);
  if (outOfStock.length > 0) {
    alerts.push({
      id: "out-of-stock",
      priority: "critical",
      icon: Warehouse,
      title: "Stock Out",
      message: `${outOfStock.length} materials with zero inventory`,
      module: "Inventory",
      link: "Inventory"
    });
  }

  // Purchase: Pending approvals
  const pendingApproval = purchaseOrders.filter(p => p.status === "Created");
  if (pendingApproval.length > 5) {
    alerts.push({
      id: "pending-po",
      priority: "info",
      icon: Package,
      title: "POs Pending",
      message: `${pendingApproval.length} purchase orders awaiting approval`,
      module: "Purchase",
      link: "Purchase"
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Cross-Module Alerts
          <Badge variant="outline" className="ml-auto">
            {alerts.filter(a => a.priority === "critical").length} Critical
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {alerts.slice(0, 6).map(alert => (
            <div 
              key={alert.id}
              className={cn(
                "p-3 rounded-lg border bg-white",
                alert.priority === "critical" && "border-red-300",
                alert.priority === "warning" && "border-orange-300",
                alert.priority === "info" && "border-blue-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  alert.priority === "critical" && "bg-red-100 text-red-600",
                  alert.priority === "warning" && "bg-orange-100 text-orange-600",
                  alert.priority === "info" && "bg-blue-100 text-blue-600"
                )}>
                  <alert.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{alert.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  <Link to={createPageUrl(alert.link)}>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs">
                      View in {alert.module} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}