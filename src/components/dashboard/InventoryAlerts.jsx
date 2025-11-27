import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default function InventoryAlerts({ inventory }) {
  const lowStockItems = inventory.filter(item => 
    item.quantity_on_hand <= item.reorder_point
  );

  const criticalItems = inventory.filter(item => 
    item.quantity_on_hand <= item.safety_stock
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Inventory Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Critical Stock ({criticalItems.length})
            </h4>
            {criticalItems.map((item) => (
              <div key={item.material_number} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{item.material_description}</p>
                  <p className="text-xs text-muted-foreground">{item.material_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{item.quantity_on_hand} {item.unit_of_measure}</p>
                  <p className="text-xs text-muted-foreground">Safety: {item.safety_stock}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {lowStockItems.filter(i => !criticalItems.includes(i)).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Low Stock ({lowStockItems.filter(i => !criticalItems.includes(i)).length})
            </h4>
            {lowStockItems.filter(i => !criticalItems.includes(i)).map((item) => (
              <div key={item.material_number} className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{item.material_description}</p>
                  <p className="text-xs text-muted-foreground">{item.material_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-600">{item.quantity_on_hand} {item.unit_of_measure}</p>
                  <p className="text-xs text-muted-foreground">Reorder: {item.reorder_point}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {lowStockItems.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            All inventory levels are healthy
          </p>
        )}
      </CardContent>
    </Card>
  );
}