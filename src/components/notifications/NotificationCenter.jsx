import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, AlertTriangle, CheckCircle, Info, Clock, 
  ShoppingCart, Package, Warehouse, Truck, DollarSign, Factory,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

const PRIORITY_COLORS = {
  critical: "bg-red-500",
  warning: "bg-orange-500",
  info: "bg-blue-500",
  success: "bg-green-500"
};

const PRIORITY_ICONS = {
  critical: AlertTriangle,
  warning: Clock,
  info: Info,
  success: CheckCircle
};

const MODULE_ICONS = {
  sales: ShoppingCart,
  purchase: Package,
  inventory: Warehouse,
  deliveries: Truck,
  finance: DollarSign,
  production: Factory
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem("dismissedNotifications");
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch data from all modules
  const { data: salesOrders = [] } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => base44.entities.SalesOrder.list()
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => base44.entities.PurchaseOrder.list()
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => base44.entities.Shipment.list()
  });

  const { data: vendorInvoices = [] } = useQuery({
    queryKey: ["vendorInvoices"],
    queryFn: () => base44.entities.VendorInvoice.list()
  });

  const { data: productionOrders = [] } = useQuery({
    queryKey: ["productionOrders"],
    queryFn: () => base44.entities.ProductionOrder.list()
  });

  // Generate notifications from all modules
  const generateNotifications = () => {
    const notifications = [];
    const today = moment();

    // Sales Alerts
    const openSales = salesOrders.filter(o => o.status === "Open");
    if (openSales.length > 10) {
      notifications.push({
        id: "sales-open-high",
        module: "sales",
        priority: "warning",
        title: "High Open Orders",
        message: `${openSales.length} sales orders pending processing`,
        timestamp: new Date()
      });
    }

    const overdueSales = salesOrders.filter(o => 
      o.delivery_date && moment(o.delivery_date).isBefore(today) && o.status !== "Delivered" && o.status !== "Completed"
    );
    if (overdueSales.length > 0) {
      notifications.push({
        id: "sales-overdue",
        module: "sales",
        priority: "critical",
        title: "Overdue Deliveries",
        message: `${overdueSales.length} sales orders past delivery date`,
        timestamp: new Date()
      });
    }

    // Inventory Alerts
    const lowStock = inventory.filter(i => 
      i.quantity_on_hand <= (i.reorder_point || 0) && i.quantity_on_hand > 0
    );
    if (lowStock.length > 0) {
      notifications.push({
        id: "inventory-low",
        module: "inventory",
        priority: "warning",
        title: "Low Stock Alert",
        message: `${lowStock.length} items below reorder point`,
        timestamp: new Date()
      });
    }

    const outOfStock = inventory.filter(i => i.quantity_on_hand === 0);
    if (outOfStock.length > 0) {
      notifications.push({
        id: "inventory-out",
        module: "inventory",
        priority: "critical",
        title: "Out of Stock",
        message: `${outOfStock.length} items with zero stock`,
        timestamp: new Date()
      });
    }

    // Delivery Alerts
    const delayedShipments = shipments.filter(s => s.status === "Delayed");
    if (delayedShipments.length > 0) {
      notifications.push({
        id: "delivery-delayed",
        module: "deliveries",
        priority: "critical",
        title: "Delayed Shipments",
        message: `${delayedShipments.length} shipments are delayed`,
        timestamp: new Date()
      });
    }

    const inTransit = shipments.filter(s => s.status === "In Transit");
    if (inTransit.length > 0) {
      notifications.push({
        id: "delivery-transit",
        module: "deliveries",
        priority: "info",
        title: "Shipments In Transit",
        message: `${inTransit.length} shipments currently in transit`,
        timestamp: new Date()
      });
    }

    // Purchase Alerts
    const pendingPOs = purchaseOrders.filter(p => p.status === "Created");
    if (pendingPOs.length > 0) {
      notifications.push({
        id: "purchase-pending",
        module: "purchase",
        priority: "info",
        title: "POs Awaiting Approval",
        message: `${pendingPOs.length} purchase orders need approval`,
        timestamp: new Date()
      });
    }

    // Finance Alerts
    const overdueInvoices = vendorInvoices.filter(i => 
      i.due_date && moment(i.due_date).isBefore(today) && i.status === "Posted"
    );
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((s, i) => s + (i.gross_amount || 0), 0);
      notifications.push({
        id: "finance-overdue",
        module: "finance",
        priority: "critical",
        title: "Overdue Invoices",
        message: `${overdueInvoices.length} invoices overdue (SAR ${(totalOverdue/1000).toFixed(0)}K)`,
        timestamp: new Date()
      });
    }

    const blockedInvoices = vendorInvoices.filter(i => i.status === "Blocked");
    if (blockedInvoices.length > 0) {
      notifications.push({
        id: "finance-blocked",
        module: "finance",
        priority: "warning",
        title: "Blocked Invoices",
        message: `${blockedInvoices.length} invoices are blocked`,
        timestamp: new Date()
      });
    }

    // Production Alerts
    const delayedProduction = productionOrders.filter(p => 
      p.end_date && moment(p.end_date).isBefore(today) && p.status !== "Completed" && p.status !== "Closed"
    );
    if (delayedProduction.length > 0) {
      notifications.push({
        id: "production-delayed",
        module: "production",
        priority: "warning",
        title: "Production Delays",
        message: `${delayedProduction.length} orders past end date`,
        timestamp: new Date()
      });
    }

    const activeProduction = productionOrders.filter(p => p.status === "In Process");
    if (activeProduction.length > 0) {
      notifications.push({
        id: "production-active",
        module: "production",
        priority: "info",
        title: "Active Production",
        message: `${activeProduction.length} orders currently in process`,
        timestamp: new Date()
      });
    }

    return notifications.filter(n => !dismissedIds.includes(n.id));
  };

  const notifications = generateNotifications();
  const criticalCount = notifications.filter(n => n.priority === "critical").length;
  const warningCount = notifications.filter(n => n.priority === "warning").length;

  const dismissNotification = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissedNotifications", JSON.stringify(newDismissed));
  };

  const clearAllDismissed = () => {
    setDismissedIds([]);
    localStorage.removeItem("dismissedNotifications");
  };

  const getNotificationsByModule = (module) => {
    return notifications.filter(n => n.module === module);
  };

  const allModules = ["sales", "purchase", "inventory", "deliveries", "finance", "production"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white flex items-center justify-center",
              criticalCount > 0 ? "bg-red-500" : warningCount > 0 ? "bg-orange-500" : "bg-blue-500"
            )}>
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </h3>
          {dismissedIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllDismissed} className="text-xs">
              Show Dismissed
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start px-2 h-auto flex-wrap">
            <TabsTrigger value="all" className="text-xs px-2 py-1">
              All ({notifications.length})
            </TabsTrigger>
            {allModules.map(module => {
              const count = getNotificationsByModule(module).length;
              if (count === 0) return null;
              const Icon = MODULE_ICONS[module];
              return (
                <TabsTrigger key={module} value={module} className="text-xs px-2 py-1 gap-1">
                  <Icon className="h-3 w-3" /> {count}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <ScrollArea className="h-80">
            <TabsContent value="all" className="m-0 p-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All clear! No alerts at this time.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications
                    .sort((a, b) => {
                      const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map(notification => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onDismiss={dismissNotification}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            {allModules.map(module => (
              <TabsContent key={module} value={module} className="m-0 p-2">
                <div className="space-y-2">
                  {getNotificationsByModule(module).map(notification => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onDismiss={dismissNotification}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification, onDismiss }) {
  const PriorityIcon = PRIORITY_ICONS[notification.priority];
  const ModuleIcon = MODULE_ICONS[notification.module];

  return (
    <div className={cn(
      "p-3 rounded-lg border relative group",
      notification.priority === "critical" && "bg-red-50 border-red-200",
      notification.priority === "warning" && "bg-orange-50 border-orange-200",
      notification.priority === "info" && "bg-blue-50 border-blue-200",
      notification.priority === "success" && "bg-green-50 border-green-200"
    )}>
      <button 
        onClick={() => onDismiss(notification.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-1.5 rounded-full",
          PRIORITY_COLORS[notification.priority]
        )}>
          <PriorityIcon className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{notification.title}</span>
            <Badge variant="outline" className="text-xs capitalize">
              <ModuleIcon className="h-3 w-3 mr-1" />
              {notification.module}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
        </div>
      </div>
    </div>
  );
}