import { usePermissions } from "./PermissionsContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PermissionButton({ 
  module, 
  action, 
  children, 
  showDisabled = false,
  ...props 
}) {
  const { canPerformAction } = usePermissions();
  
  const hasPermission = canPerformAction(module, action);

  if (!hasPermission && !showDisabled) {
    return null;
  }

  if (!hasPermission && showDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button {...props} disabled>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don't have permission to {action} {module}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <Button {...props}>{children}</Button>;
}