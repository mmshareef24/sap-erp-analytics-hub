import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Calendar, Package } from "lucide-react";

const statusColors = {
  "Created": "bg-gray-100 text-gray-800",
  "Approved": "bg-blue-100 text-blue-800",
  "Partially Received": "bg-yellow-100 text-yellow-800",
  "Fully Received": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800"
};

export default function PurchaseOrdersList({ purchaseOrders }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPO, setSelectedPO] = useState(null);

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      po.vendor_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Purchase Orders</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PO or vendor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Partially Received">Partially Received</SelectItem>
                  <SelectItem value="Fully Received">Fully Received</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>PO Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Material Group</TableHead>
                  <TableHead className="text-right">Net Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.slice(0, 15).map((po) => (
                  <TableRow 
                    key={po.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedPO(po)}
                  >
                    <TableCell className="font-mono font-medium">{po.po_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{po.vendor_name}</p>
                        <p className="text-xs text-muted-foreground">{po.vendor_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{po.po_date}</TableCell>
                    <TableCell>{po.delivery_date}</TableCell>
                    <TableCell>{po.material_group || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {po.currency || "SAR"} {po.net_value?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[po.status]}>{po.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Showing {Math.min(15, filteredOrders.length)} of {filteredOrders.length} orders
          </p>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              PO Details: {selectedPO?.po_number}
            </DialogTitle>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedPO.vendor_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPO.vendor_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedPO.status]}>{selectedPO.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PO Date</p>
                  <p className="font-medium">{selectedPO.po_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">{selectedPO.delivery_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchasing Org</p>
                  <p className="font-medium">{selectedPO.purchasing_org || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Material Group</p>
                  <p className="font-medium">{selectedPO.material_group || "-"}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Net Value</p>
                <p className="text-2xl font-bold">{selectedPO.currency || "SAR"} {selectedPO.net_value?.toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}