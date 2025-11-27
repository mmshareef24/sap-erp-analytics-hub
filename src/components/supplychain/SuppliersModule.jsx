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
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Star, MapPin, Phone, Mail } from "lucide-react";

const statusColors = {
  "Active": "bg-green-100 text-green-800",
  "Inactive": "bg-gray-100 text-gray-800",
  "Blocked": "bg-red-100 text-red-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800"
};

export default function SuppliersModule({ suppliers, purchaseOrders }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    supplier_code: "",
    name: "",
    category: "Raw Materials",
    country: "",
    city: "",
    contact_person: "",
    email: "",
    phone: "",
    lead_time_days: "",
    payment_terms: "",
    status: "Active"
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      supplier_code: "",
      name: "",
      category: "Raw Materials",
      country: "",
      city: "",
      contact_person: "",
      email: "",
      phone: "",
      lead_time_days: "",
      payment_terms: "",
      status: "Active"
    });
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.country?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate supplier spend from POs
  const getSupplierSpend = (supplierName) => {
    return purchaseOrders
      .filter(po => po.vendor_name === supplierName)
      .reduce((sum, po) => sum + (po.net_value || 0), 0);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      lead_time_days: formData.lead_time_days ? Number(formData.lead_time_days) : undefined
    };
    createMutation.mutate(data);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= (rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg">Suppliers</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                  <SelectItem value="Components">Components</SelectItem>
                  <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Packaging">Packaging</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Supplier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow 
                    key={supplier.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">{supplier.supplier_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{supplier.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {supplier.city}, {supplier.country}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.lead_time_days ? `${supplier.lead_time_days} days` : "-"}</TableCell>
                    <TableCell>{renderStars(supplier.rating)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[supplier.status]}>{supplier.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      SAR {getSupplierSpend(supplier.name).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </p>
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier Code</Label>
                <Input
                  value={formData.supplier_code}
                  onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value })}
                  placeholder="SUP-001"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                    <SelectItem value="Components">Components</SelectItem>
                    <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Supplier Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Supplier name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Time (days)</Label>
                <Input
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Input
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="Net 30"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              Create Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier Details Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[selectedSupplier.status]}>{selectedSupplier.status}</Badge>
                {renderStars(selectedSupplier.rating)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier Code</p>
                  <p className="font-medium">{selectedSupplier.supplier_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedSupplier.category}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedSupplier.city}, {selectedSupplier.country}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{selectedSupplier.contact_person || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">{selectedSupplier.lead_time_days ? `${selectedSupplier.lead_time_days} days` : "-"}</p>
                </div>
              </div>
              {selectedSupplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSupplier.email}</span>
                </div>
              )}
              {selectedSupplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedSupplier.phone}</span>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-xl font-bold">SAR {getSupplierSpend(selectedSupplier.name).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}