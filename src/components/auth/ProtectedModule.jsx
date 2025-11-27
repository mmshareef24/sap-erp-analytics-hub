import { usePermissions } from "./PermissionsContext";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

export default function ProtectedModule({ module, action = "view", children, fallback }) {
  const { canAccessModule, canPerformAction, loading } = usePermissions();

  if (loading) {
    return null;
  }

  // Check module access
  if (module && !canAccessModule(module)) {
    return fallback || (
      <Card className="m-6">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-center">
            You don't have permission to access this module.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check action permission
  if (action && module) {
    const moduleKey = module.toLowerCase();
    if (!canPerformAction(moduleKey, action)) {
      return fallback || null;
    }
  }

  return children;
}