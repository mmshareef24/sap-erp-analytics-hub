import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { LayoutDashboard, ShoppingCart, Package, Warehouse, DollarSign, Factory, Menu, X, Lightbulb, FileText, Truck, GitBranch, PackageCheck, LayoutGrid } from "lucide-react";
import GlobalSearch from "@/components/layout/GlobalSearch";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "My Dashboards", icon: LayoutGrid, page: "CustomDashboard" },
  { name: "Sales", icon: ShoppingCart, page: "Sales" },
  { name: "Purchase", icon: Package, page: "Purchase" },
  { name: "Inventory", icon: Warehouse, page: "Inventory" },
  { name: "Production", icon: Factory, page: "Production" },
  { name: "Finance", icon: DollarSign, page: "Finance" },
  { name: "Insights", icon: Lightbulb, page: "Insights" },
  { name: "Supply Chain", icon: Truck, page: "SupplyChain" },
  { name: "Deliveries", icon: PackageCheck, page: "Deliveries" },
  { name: "Cross-Module", icon: GitBranch, page: "CrossModuleAnalytics" },
  { name: "Reports", icon: FileText, page: "Reports" },
];

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-50",
        "md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold text-gray-900">SAP Analytics</span>
          </div>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-end">
            <GlobalSearch />
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}