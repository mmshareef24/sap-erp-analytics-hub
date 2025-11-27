import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Filter, Truck, MapPin, Calendar } from "lucide-react";

const statusColors = {
  "Pending": "bg-gray-100 text-gray-800",
  "In Transit": "bg-blue-100 text-blue-800",
  "Delivered": "bg-green-100 text-green-800",
  "Delayed": "bg-red-100 text-red-800",
  "Cancelled": "bg-gray-100 text-gray-500"
};

export default function ShipmentsModule({ shipments }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    shipment_number: "",
    type: "Outbound",
    origin: "",
    destination: "",
    carrier: "",
    ship_date: "",
    expected_delivery: "",
    status: "Pending",
    reference_type: "",
    reference_number: "",
    weight: "",
    freight_cost: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Shipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      setShowDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      shipment_number: "",
      type: "Outbound",
      origin: "",
      destination: "",
      carrier: "",
      ship_date: "",
      expected_delivery: "",
      status: "Pending",
      reference_type: "",
      reference_number: "",
      weight: "",
      freight_cost: ""
    });
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.shipment_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.origin?.toLowerCase().includes(search.toLowerCase()) ||
      s.destination?.toLowerCase().includes(search.toLowerCase()) ||
      s.carrier?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesType = typeFilter === "all" || s.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = () => {
    const data = {
      ...formData,
      weight: formData.weight ? Number(formData.weight) : undefined,
      freight_cost: formData.freight_cost ? Number(formData.freight_cost) : undefined
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg">Shipments</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Inbound">Inbound</SelectItem>
                  <SelectItem value="Outbound">Outbound</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Shipment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Ship Date</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Freight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow 
                    key={shipment.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <TableCell className="font-medium">{shipment.shipment_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{shipment.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {shipment.origin} → {shipment.destination}
                      </div>
                    </TableCell>
                    <TableCell>{shipment.carrier}</TableCell>
                    <TableCell>{shipment.ship_date}</TableCell>
                    <TableCell>{shipment.expected_delivery}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[shipment.status]}>{shipment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.freight_cost ? `SAR ${shipment.freight_cost.toLocaleString()}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredShipments.length} of {shipments.length} shipments
          </p>
        </CardContent>
      </Card>

      {/* Add Shipment Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Shipment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shipment Number</Label>
                <Input
                  value={formData.shipment_number}
                  onChange={(e) => setFormData({ ...formData, shipment_number: e.target.value })}
                  placeholder="SHP-001"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origin</Label>
                <Input
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Origin location"
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Destination location"
                />
              </div>
            </div>
            <div>
              <Label>Carrier</Label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                placeholder="Carrier name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ship Date</Label>
                <Input
                  type="date"
                  value={formData.ship_date}
                  onChange={(e) => setFormData({ ...formData, ship_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div>
                <Label>Freight Cost (SAR)</Label>
                <Input
                  type="number"
                  value={formData.freight_cost}
                  onChange={(e) => setFormData({ ...formData, freight_cost: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              Create Shipment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Details Dialog */}
      <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {selectedShipment?.shipment_number}
            </DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedShipment.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedShipment.status]}>{selectedShipment.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="font-medium">{selectedShipment.origin} → {selectedShipment.destination}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium">{selectedShipment.carrier || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Freight Cost</p>
                  <p className="font-medium">
                    {selectedShipment.freight_cost ? `SAR ${selectedShipment.freight_cost.toLocaleString()}` : "-"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ship Date</p>
                  <p className="font-medium">{selectedShipment.ship_date || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{selectedShipment.expected_delivery || "-"}</p>
                </div>
              </div>
              {selectedShipment.reference_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="font-medium">{selectedShipment.reference_type}: {selectedShipment.reference_number}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}