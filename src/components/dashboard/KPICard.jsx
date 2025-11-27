import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, className }) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className={cn(
                "flex items-center text-xs font-medium",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}>
                {trend === "up" ? "↑" : "↓"} {trendValue}
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}