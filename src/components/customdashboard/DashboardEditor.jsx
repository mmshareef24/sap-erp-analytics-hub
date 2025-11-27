import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Save, X, LayoutGrid } from "lucide-react";
import WidgetCatalog from "./WidgetCatalog";
import WidgetRenderer from "./WidgetRenderer";

export default function DashboardEditor({ 
  dashboard, 
  data, 
  onSave, 
  onCancel, 
  isSaving 
}) {
  const [name, setName] = useState(dashboard?.name || "");
  const [description, setDescription] = useState(dashboard?.description || "");
  const [widgets, setWidgets] = useState(dashboard?.widgets || []);
  const [isDefault, setIsDefault] = useState(dashboard?.is_default || false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const handleAddWidget = (widget) => {
    setWidgets([...widgets, { 
      widgetId: widget.id, 
      order: widgets.length 
    }]);
    setCatalogOpen(false);
  };

  const handleRemoveWidget = (index) => {
    setWidgets(widgets.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      widgets,
      is_default: isDefault
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Dashboard name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold w-64"
          />
          <div className="flex items-center gap-2">
            <Switch id="default" checked={isDefault} onCheckedChange={setIsDefault} />
            <Label htmlFor="default" className="text-sm">Set as default</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
              </DialogHeader>
              <WidgetCatalog onAddWidget={handleAddWidget} existingWidgets={widgets} />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name || isSaving}>
            <Save className="h-4 w-4 mr-2" /> Save Dashboard
          </Button>
        </div>
      </div>

      <Input 
        placeholder="Dashboard description (optional)" 
        value={description} 
        onChange={(e) => setDescription(e.target.value)}
        className="max-w-md"
      />

      {/* Widget Grid */}
      {widgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {widgets.map((widget, idx) => (
            <WidgetRenderer
              key={`${widget.widgetId}-${idx}`}
              widget={widget}
              data={data}
              isEditing={true}
              onRemove={() => handleRemoveWidget(idx)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No widgets added yet</p>
            <Button variant="outline" onClick={() => setCatalogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Widget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}