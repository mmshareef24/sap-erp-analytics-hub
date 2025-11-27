import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Factory } from "lucide-react";

const statusColors = {
  "Created": "bg-gray-100 text-gray-800",
  "Released": "bg-blue-100 text-blue-800",
  "In Process": "bg-yellow-100 text-yellow-800",
  "Confirmed": "bg-purple-100 text-purple-800",
  "Completed": "bg-green-100 text-green-800",
  "Closed": "bg-slate-100 text-slate-800"
};

export default function ProductionOrdersList({ productionOrders }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = productionOrders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.material_description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Production Orders</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search order or material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Released">Released</SelectItem>
                  <SelectItem value="In Process">In Process</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Plant</TableHead>
                  <TableHead>Work Center</TableHead>
                  <TableHead className="text-right">Planned Qty</TableHead>
                  <TableHead className="text-right">Confirmed Qty</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.slice(0, 15).map((order) => {
                  const progress = order.planned_quantity > 0 
                    ? ((order.confirmed_quantity || 0) / order.planned_quantity) * 100 
                    : 0;
                  return (
                    <TableRow 
                      key={order.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.material_description}</p>
                          <p className="text-xs text-muted-foreground">{order.material_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.plant}</TableCell>
                      <TableCell>{order.work_center || "-"}</TableCell>
                      <TableCell className="text-right">{order.planned_quantity} {order.unit_of_measure}</TableCell>
                      <TableCell className="text-right">{order.confirmed_quantity || 0} {order.unit_of_measure}</TableCell>
                      <TableCell className="w-[100px]">
                        <Progress value={progress} className="h-2" />
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Order Details: {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Material</p>
                  <p className="font-medium">{selectedOrder.material_description}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.material_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedOrder.status]}>{selectedOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plant</p>
                  <p className="font-medium">{selectedOrder.plant}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Center</p>
                  <p className="font-medium">{selectedOrder.work_center || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{selectedOrder.start_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{selectedOrder.end_date}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Production Progress</span>
                  <span className="font-medium">
                    {selectedOrder.confirmed_quantity || 0} / {selectedOrder.planned_quantity} {selectedOrder.unit_of_measure}
                  </span>
                </div>
                <Progress 
                  value={selectedOrder.planned_quantity > 0 
                    ? ((selectedOrder.confirmed_quantity || 0) / selectedOrder.planned_quantity) * 100 
                    : 0} 
                  className="h-3" 
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}