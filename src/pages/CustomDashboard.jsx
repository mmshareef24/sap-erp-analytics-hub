import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Loader2, LayoutDashboard, ChevronDown, Edit2, 
  Trash2, Star, MoreVertical 
} from "lucide-react";
import { toast } from "sonner";
import DashboardEditor from "@/components/customdashboard/DashboardEditor";
import WidgetRenderer from "@/components/customdashboard/WidgetRenderer";

export default function CustomDashboard() {
  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch dashboards
  const { data: dashboards = [], isLoading: loadingDashboards } = useQuery({
    queryKey: ["custom-dashboards"],
    queryFn: () => base44.entities.Dashboard.list()
  });

  // Fetch data for widgets
  const { data: salesOrders = [], isLoading: l1 } = useQuery({
    queryKey: ["cd-sales"],
    queryFn: () => base44.entities.SalesOrder.list()
  });
  const { data: inventory = [], isLoading: l2 } = useQuery({
    queryKey: ["cd-inventory"],
    queryFn: () => base44.entities.Inventory.list()
  });
  const { data: shipments = [], isLoading: l3 } = useQuery({
    queryKey: ["cd-shipments"],
    queryFn: () => base44.entities.Shipment.list()
  });

  const widgetData = { salesOrders, inventory, shipments };
  const isLoading = loadingDashboards || l1 || l2 || l3;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Dashboard.create(data),
    onSuccess: (newDashboard) => {
      queryClient.invalidateQueries({ queryKey: ["custom-dashboards"] });
      setSelectedDashboardId(newDashboard.id);
      setIsCreating(false);
      setIsEditing(false);
      toast.success("Dashboard created");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dashboard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-dashboards"] });
      setIsEditing(false);
      toast.success("Dashboard saved");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Dashboard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-dashboards"] });
      setSelectedDashboardId(null);
      toast.success("Dashboard deleted");
    }
  });

  // Get current dashboard
  const currentDashboard = selectedDashboardId 
    ? dashboards.find(d => d.id === selectedDashboardId)
    : dashboards.find(d => d.is_default) || dashboards[0];

  const handleSave = (data) => {
    if (isCreating) {
      createMutation.mutate(data);
    } else if (currentDashboard) {
      updateMutation.mutate({ id: currentDashboard.id, data });
    }
  };

  const handleSetDefault = async (dashboard) => {
    // Unset other defaults
    for (const d of dashboards.filter(d => d.is_default && d.id !== dashboard.id)) {
      await base44.entities.Dashboard.update(d.id, { is_default: false });
    }
    await base44.entities.Dashboard.update(dashboard.id, { is_default: true });
    queryClient.invalidateQueries({ queryKey: ["custom-dashboards"] });
    toast.success("Default dashboard updated");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show editor when creating or editing
  if (isCreating || isEditing) {
    return (
      <div className="p-6">
        <DashboardEditor
          dashboard={isCreating ? null : currentDashboard}
          data={widgetData}
          onSave={handleSave}
          onCancel={() => { setIsEditing(false); setIsCreating(false); }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboards</h1>
          
          {dashboards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {currentDashboard?.name || "Select Dashboard"}
                  {currentDashboard?.is_default && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {dashboards.map(dashboard => (
                  <DropdownMenuItem 
                    key={dashboard.id}
                    onClick={() => setSelectedDashboardId(dashboard.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{dashboard.name}</span>
                    {dashboard.is_default && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create New
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentDashboard && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSetDefault(currentDashboard)}>
                    <Star className="h-4 w-4 mr-2" /> Set as Default
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(currentDashboard.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Dashboard
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      {currentDashboard ? (
        <div className="space-y-4">
          {currentDashboard.description && (
            <p className="text-muted-foreground">{currentDashboard.description}</p>
          )}
          
          {currentDashboard.widgets?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentDashboard.widgets.map((widget, idx) => (
                <WidgetRenderer
                  key={`${widget.widgetId}-${idx}`}
                  widget={widget}
                  data={widgetData}
                  isEditing={false}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">This dashboard has no widgets</p>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Add Widgets
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutDashboard className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Dashboards Yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first custom dashboard by selecting widgets for sales, inventory, and delivery analytics.
            </p>
            <Button onClick={() => setIsCreating(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" /> Create Your First Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}