import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, AlertCircle, CheckCircle2, Package } from "lucide-react";

export default function LowStockAlerts({ inventory }) {
  const itemsWithStatus = inventory.map(item => {
    const qty = item.quantity_on_hand || 0;
    const reorder = item.reorder_point || 0;
    const safety = item.safety_stock || 0;
    
    let status, severity, color;
    if (qty <= safety) {
      status = 'Critical';
      severity = 3;
      color = 'red';
    } else if (qty <= reorder) {
      status = 'Low';
      severity = 2;
      color = 'yellow';
    } else if (qty <= reorder * 1.2) {
      status = 'Warning';
      severity = 1;
      color = 'orange';
    } else {
      status = 'OK';
      severity = 0;
      color = 'green';
    }
    
    const stockLevel = reorder > 0 ? Math.min((qty / reorder) * 100, 100) : 100;
    
    return { ...item, status, severity, color, stockLevel };
  });

  const criticalItems = itemsWithStatus.filter(i => i.severity === 3);
  const lowItems = itemsWithStatus.filter(i => i.severity === 2);
  const warningItems = itemsWithStatus.filter(i => i.severity === 1);
  const okItems = itemsWithStatus.filter(i => i.severity === 0);

  const alertItems = [...criticalItems, ...lowItems, ...warningItems].sort((a, b) => b.severity - a.severity);

  const statusConfig = {
    'Critical': { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    'Low': { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    'Warning': { icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
    'OK': { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Stock Level Alerts
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-600">Critical</p>
            <p className="text-xl font-bold text-red-700">{criticalItems.length}</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-600">Low</p>
            <p className="text-xl font-bold text-yellow-700">{lowItems.length}</p>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-600">Warning</p>
            <p className="text-xl font-bold text-orange-700">{warningItems.length}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600">OK</p>
            <p className="text-xl font-bold text-green-700">{okItems.length}</p>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {alertItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>All stock levels are healthy!</p>
            </div>
          ) : (
            alertItems.map((item) => {
              const config = statusConfig[item.status];
              const Icon = config.icon;
              return (
                <div 
                  key={item.material_number} 
                  className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Icon className={`h-5 w-5 mt-0.5 ${config.text}`} />
                      <div>
                        <p className="font-medium text-sm">{item.material_description}</p>
                        <p className="text-xs text-muted-foreground">{item.material_number} • {item.plant}</p>
                      </div>
                    </div>
                    <Badge className={config.badge}>{item.status}</Badge>
                  </div>
                  <div className="mt-2 ml-7">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Current: <strong>{item.quantity_on_hand}</strong> {item.unit_of_measure}</span>
                      <span>Reorder: {item.reorder_point} | Safety: {item.safety_stock}</span>
                    </div>
                    <Progress 
                      value={item.stockLevel} 
                      className="h-2"
                      style={{ 
                        '--progress-background': item.severity === 3 ? '#ef4444' : item.severity === 2 ? '#eab308' : '#f97316'
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}