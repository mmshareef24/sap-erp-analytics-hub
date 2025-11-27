import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Star, MapPin, Package } from "lucide-react";

export default function SupplierNetwork({ suppliers, purchaseOrders }) {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const containerRef = useRef(null);

  // Group suppliers by category
  const categories = suppliers.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryColors = {
    "Raw Materials": { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
    "Components": { bg: "bg-green-100", border: "border-green-400", text: "text-green-700" },
    "Finished Goods": { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
    "Services": { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700" },
    "Packaging": { bg: "bg-pink-100", border: "border-pink-400", text: "text-pink-700" },
    "Other": { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-700" }
  };

  const getSupplierSpend = (supplierName) => {
    return purchaseOrders
      .filter(po => po.vendor_name === supplierName)
      .reduce((sum, po) => sum + (po.net_value || 0), 0);
  };

  const getSupplierPOCount = (supplierName) => {
    return purchaseOrders.filter(po => po.vendor_name === supplierName).length;
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Supplier Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative" ref={containerRef}>
            {/* Central Hub */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                <div className="text-center">
                  <Package className="h-6 w-6 mx-auto" />
                  <span className="text-xs">Your Org</span>
                </div>
              </div>
            </div>

            {/* Category Groups */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(categories).map(([category, categorySuppliers]) => {
                const colors = categoryColors[category] || categoryColors["Other"];
                const totalSpend = categorySuppliers.reduce((sum, s) => sum + getSupplierSpend(s.name), 0);
                
                return (
                  <div key={category} className={`${colors.bg} rounded-xl p-4 border-2 ${colors.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-semibold text-sm ${colors.text}`}>{category}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {categorySuppliers.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Total: SAR {(totalSpend / 1000).toFixed(0)}K
                    </p>
                    <div className="space-y-2">
                      {categorySuppliers.slice(0, 4).map((supplier) => {
                        const spend = getSupplierSpend(supplier.name);
                        const poCount = getSupplierPOCount(supplier.name);
                        
                        return (
                          <div
                            key={supplier.id}
                            className="bg-white rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedSupplier({ ...supplier, spend, poCount })}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate max-w-[100px]">{supplier.name}</span>
                              {supplier.rating && renderStars(supplier.rating)}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">{poCount} POs</span>
                              <span className="text-xs font-medium">SAR {(spend / 1000).toFixed(0)}K</span>
                            </div>
                          </div>
                        );
                      })}
                      {categorySuppliers.length > 4 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{categorySuppliers.length - 4} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{selectedSupplier.category}</Badge>
                {renderStars(selectedSupplier.rating)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-bold">SAR {selectedSupplier.spend?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Purchase Orders</p>
                  <p className="text-xl font-bold">{selectedSupplier.poCount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedSupplier.city}, {selectedSupplier.country}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Time</p>
                  <p className="font-medium">
                    {selectedSupplier.lead_time_days ? `${selectedSupplier.lead_time_days} days` : "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={
                  selectedSupplier.status === "Active" ? "bg-green-100 text-green-800" :
                  selectedSupplier.status === "Blocked" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }>
                  {selectedSupplier.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}