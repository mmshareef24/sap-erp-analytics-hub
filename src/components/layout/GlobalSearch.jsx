import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, ShoppingCart, Package, FileText, Warehouse, DollarSign, Factory, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const moduleConfig = {
  SalesOrder: { icon: ShoppingCart, color: "bg-blue-100 text-blue-800", label: "Sales Order", page: "Sales" },
  PurchaseOrder: { icon: Package, color: "bg-purple-100 text-purple-800", label: "Purchase Order", page: "Dashboard" },
  VendorInvoice: { icon: FileText, color: "bg-orange-100 text-orange-800", label: "Vendor Invoice", page: "Dashboard" },
  SalesInvoice: { icon: FileText, color: "bg-green-100 text-green-800", label: "Sales Invoice", page: "Sales" },
  Inventory: { icon: Warehouse, color: "bg-cyan-100 text-cyan-800", label: "Inventory", page: "Inventory" },
  FinancialEntry: { icon: DollarSign, color: "bg-emerald-100 text-emerald-800", label: "Financial Entry", page: "Dashboard" },
  ProductionOrder: { icon: Factory, color: "bg-pink-100 text-pink-800", label: "Production Order", page: "Dashboard" }
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: salesOrders = [] } = useQuery({ queryKey: ["search-sales"], queryFn: () => base44.entities.SalesOrder.list() });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["search-po"], queryFn: () => base44.entities.PurchaseOrder.list() });
  const { data: vendorInvoices = [] } = useQuery({ queryKey: ["search-vinv"], queryFn: () => base44.entities.VendorInvoice.list() });
  const { data: salesInvoices = [] } = useQuery({ queryKey: ["search-sinv"], queryFn: () => base44.entities.SalesInvoice.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ["search-inv"], queryFn: () => base44.entities.Inventory.list() });
  const { data: financialEntries = [] } = useQuery({ queryKey: ["search-fin"], queryFn: () => base44.entities.FinancialEntry.list() });
  const { data: productionOrders = [] } = useQuery({ queryKey: ["search-prod"], queryFn: () => base44.entities.ProductionOrder.list() });

  const searchResults = debouncedQuery.length >= 2 ? {
    SalesOrder: salesOrders.filter(o => 
      o.order_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(o => ({ id: o.id, primary: o.order_number, secondary: o.customer_name, tertiary: `SAR ${o.net_value?.toLocaleString()}`, status: o.status })),
    
    PurchaseOrder: purchaseOrders.filter(o => 
      o.po_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      o.vendor_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(o => ({ id: o.id, primary: o.po_number, secondary: o.vendor_name, tertiary: `SAR ${o.net_value?.toLocaleString()}`, status: o.status })),
    
    VendorInvoice: vendorInvoices.filter(i => 
      i.invoice_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      i.vendor_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(i => ({ id: i.id, primary: i.invoice_number, secondary: i.vendor_name, tertiary: `SAR ${i.gross_amount?.toLocaleString()}`, status: i.status })),
    
    SalesInvoice: salesInvoices.filter(i => 
      i.invoice_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      i.customer_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(i => ({ id: i.id, primary: i.invoice_number, secondary: i.customer_name, tertiary: `SAR ${i.gross_amount?.toLocaleString()}`, status: i.status })),
    
    Inventory: inventory.filter(i => 
      i.material_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      i.material_description?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(i => ({ id: i.id, primary: i.material_number, secondary: i.material_description, tertiary: `${i.quantity_on_hand} ${i.unit_of_measure}` })),
    
    FinancialEntry: financialEntries.filter(e => 
      e.document_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      e.gl_account_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(e => ({ id: e.id, primary: e.document_number, secondary: e.gl_account_name, tertiary: e.posting_date })),
    
    ProductionOrder: productionOrders.filter(o => 
      o.order_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      o.material_description?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5).map(o => ({ id: o.id, primary: o.order_number, secondary: o.material_description, tertiary: `${o.planned_quantity} ${o.unit_of_measure}`, status: o.status }))
  } : {};

  const hasResults = Object.values(searchResults).some(arr => arr.length > 0);
  const totalResults = Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div ref={containerRef} className="relative">
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
        onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
      >
        <Search className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-500 hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] text-gray-500">
          ⌘K
        </kbd>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 md:left-0 w-[90vw] md:w-[500px] bg-white rounded-lg shadow-xl border z-50">
          <div className="flex items-center gap-2 p-3 border-b">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, invoices, inventory..."
              className="border-0 focus-visible:ring-0 p-0 h-auto text-sm"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {debouncedQuery.length < 2 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Type at least 2 characters to search
              </div>
            ) : !hasResults ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No results found for "{debouncedQuery}"
              </div>
            ) : (
              <div className="p-2">
                <p className="text-xs text-gray-500 px-2 mb-2">{totalResults} results found</p>
                {Object.entries(searchResults).map(([module, items]) => {
                  if (items.length === 0) return null;
                  const config = moduleConfig[module];
                  const Icon = config.icon;
                  return (
                    <div key={module} className="mb-3">
                      <div className="flex items-center gap-2 px-2 py-1">
                        <Icon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">{config.label}s</span>
                        <Badge variant="secondary" className="text-[10px] h-4">{items.length}</Badge>
                      </div>
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          to={createPageUrl(config.page)}
                          onClick={() => { setIsOpen(false); setQuery(""); }}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.primary}</p>
                            <p className="text-xs text-gray-500 truncate">{item.secondary}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-xs text-gray-500">{item.tertiary}</span>
                            {item.status && (
                              <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}