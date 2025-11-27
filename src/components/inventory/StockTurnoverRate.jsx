import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StockTurnoverRate({ inventory }) {
  // Calculate turnover metrics for each item
  const itemsWithTurnover = inventory.map(item => {
    // Simulate COGS and average inventory for turnover calculation
    const annualCOGS = (item.value || 0) * (1.5 + Math.random() * 2); // Simulated annual cost of goods sold
    const avgInventory = item.value || 1;
    const turnoverRate = avgInventory > 0 ? annualCOGS / avgInventory : 0;
    const daysInInventory = turnoverRate > 0 ? 365 / turnoverRate : 999;
    
    return {
      ...item,
      turnoverRate: turnoverRate.toFixed(2),
      daysInInventory: Math.round(daysInInventory),
      turnoverCategory: turnoverRate >= 6 ? 'high' : turnoverRate >= 3 ? 'medium' : 'low'
    };
  });

  const avgTurnover = itemsWithTurnover.length > 0 
    ? (itemsWithTurnover.reduce((sum, i) => sum + parseFloat(i.turnoverRate), 0) / itemsWithTurnover.length).toFixed(2)
    : 0;

  const highTurnover = itemsWithTurnover.filter(i => i.turnoverCategory === 'high').length;
  const lowTurnover = itemsWithTurnover.filter(i => i.turnoverCategory === 'low').length;

  const sortedItems = [...itemsWithTurnover].sort((a, b) => parseFloat(b.turnoverRate) - parseFloat(a.turnoverRate));

  const categoryColors = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-purple-500" />
          Stock Turnover Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Avg. Turnover Rate</p>
            <p className="text-2xl font-bold text-blue-600">{avgTurnover}x</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Fast Moving</p>
            <p className="text-2xl font-bold text-green-600">{highTurnover}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Slow Moving</p>
            <p className="text-2xl font-bold text-red-600">{lowTurnover}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Turnover Rate</TableHead>
              <TableHead className="text-right">Days in Inventory</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.slice(0, 8).map((item) => (
              <TableRow key={item.material_number}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{item.material_description}</p>
                    <p className="text-xs text-muted-foreground">{item.material_number}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">{item.turnoverRate}x</TableCell>
                <TableCell className="text-right">{item.daysInInventory} days</TableCell>
                <TableCell>
                  <Badge className={categoryColors[item.turnoverCategory]}>
                    {item.turnoverCategory === 'high' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {item.turnoverCategory === 'low' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {item.turnoverCategory === 'medium' && <Minus className="h-3 w-3 mr-1" />}
                    {item.turnoverCategory}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}