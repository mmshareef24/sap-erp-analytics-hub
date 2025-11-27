import { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Define permissions for each role
const ROLE_PERMISSIONS = {
  "Admin": {
    modules: ["Dashboard", "CustomDashboard", "Sales", "Purchase", "Inventory", "Production", "Finance", "Insights", "SupplyChain", "Deliveries", "CrossModuleAnalytics", "Reports"],
    actions: {
      sales: ["view", "create", "edit", "delete"],
      inventory: ["view", "create", "edit", "delete"],
      deliveries: ["view", "create", "edit", "delete"],
      purchase: ["view", "create", "edit", "delete"],
      production: ["view", "create", "edit", "delete"],
      finance: ["view", "create", "edit", "delete"],
      dashboards: ["view", "create", "edit", "delete"],
      reports: ["view", "create", "edit", "delete"]
    }
  },
  "Sales Manager": {
    modules: ["Dashboard", "CustomDashboard", "Sales", "Insights", "Reports"],
    actions: {
      sales: ["view", "create", "edit"],
      inventory: ["view"],
      deliveries: ["view"],
      purchase: [],
      production: [],
      finance: [],
      dashboards: ["view", "create", "edit"],
      reports: ["view", "create"]
    }
  },
  "Inventory Clerk": {
    modules: ["Dashboard", "CustomDashboard", "Inventory", "Purchase", "Production", "Reports"],
    actions: {
      sales: ["view"],
      inventory: ["view", "create", "edit"],
      deliveries: ["view"],
      purchase: ["view", "create"],
      production: ["view"],
      finance: [],
      dashboards: ["view", "create"],
      reports: ["view"]
    }
  },
  "Logistics Coordinator": {
    modules: ["Dashboard", "CustomDashboard", "Deliveries", "SupplyChain", "Inventory", "Reports"],
    actions: {
      sales: ["view"],
      inventory: ["view"],
      deliveries: ["view", "create", "edit"],
      purchase: ["view"],
      production: [],
      finance: [],
      dashboards: ["view", "create"],
      reports: ["view"]
    }
  }
};

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const getRole = () => {
    if (!user) return null;
    // Admin role from built-in takes precedence
    if (user.role === "admin") return "Admin";
    return user.custom_role || "Sales Manager";
  };

  const getPermissions = () => {
    const role = getRole();
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Sales Manager"];
  };

  const canAccessModule = (moduleName) => {
    const permissions = getPermissions();
    return permissions.modules.includes(moduleName);
  };

  const canPerformAction = (module, action) => {
    const permissions = getPermissions();
    const moduleActions = permissions.actions[module] || [];
    return moduleActions.includes(action);
  };

  const isAdmin = () => {
    return getRole() === "Admin";
  };

  return (
    <PermissionsContext.Provider value={{
      user,
      loading,
      role: getRole(),
      permissions: getPermissions(),
      canAccessModule,
      canPerformAction,
      isAdmin
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return context;
}

export { ROLE_PERMISSIONS };