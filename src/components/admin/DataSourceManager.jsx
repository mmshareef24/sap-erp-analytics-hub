import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Database, Server, Plus, RefreshCw, Settings, Trash2, 
  CheckCircle, XCircle, AlertCircle, Clock, Loader2, Plug
} from "lucide-react";
import { toast } from "sonner";

const DATA_SOURCE_TYPES = [
  { value: "sap_erp", label: "SAP ERP", icon: "🏢" },
  { value: "sql_server", label: "SQL Server", icon: "🗄️" },
  { value: "mysql", label: "MySQL", icon: "🐬" },
  { value: "postgresql", label: "PostgreSQL", icon: "🐘" },
  { value: "oracle", label: "Oracle", icon: "🔶" },
  { value: "rest_api", label: "REST API", icon: "🔌" },
  { value: "csv_import", label: "CSV Import", icon: "📄" }
];

const STATUS_CONFIG = {
  connected: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  disconnected: { color: "bg-gray-100 text-gray-800", icon: XCircle },
  error: { color: "bg-red-100 text-red-800", icon: AlertCircle },
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock }
};

export default function DataSourceManager() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "sap_erp",
    host: "",
    port: "",
    database: "",
    username: "",
    sync_frequency: "manual",
    enabled: true,
    tables_to_sync: []
  });
  const [testingConnection, setTestingConnection] = useState(false);

  const queryClient = useQueryClient();

  const { data: dataSources = [], isLoading } = useQuery({
    queryKey: ["dataSources"],
    queryFn: () => base44.entities.DataSource.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DataSource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      setShowAddDialog(false);
      resetForm();
      toast.success("Data source added successfully");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataSource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      setEditingSource(null);
      resetForm();
      toast.success("Data source updated successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataSource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Data source deleted");
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "sap_erp",
      host: "",
      port: "",
      database: "",
      username: "",
      sync_frequency: "manual",
      enabled: true,
      tables_to_sync: []
    });
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      name: source.name || "",
      type: source.type || "sap_erp",
      host: source.host || "",
      port: source.port || "",
      database: source.database || "",
      username: source.username || "",
      sync_frequency: source.sync_frequency || "manual",
      enabled: source.enabled !== false,
      tables_to_sync: source.tables_to_sync || []
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.type) {
      toast.error("Please fill in required fields");
      return;
    }

    if (editingSource) {
      updateMutation.mutate({ id: editingSource.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, status: "pending" });
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    // Simulate connection test - in real implementation, this would call a backend function
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTestingConnection(false);
    toast.info("Connection test completed - Backend function required for actual testing");
  };

  const handleSync = async (source) => {
    toast.info(`Syncing ${source.name}... Backend function required for actual sync`);
    // In real implementation, this would call a backend function
  };

  const getTypeInfo = (type) => DATA_SOURCE_TYPES.find(t => t.value === type) || { label: type, icon: "📁" };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" /> Data Sources
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect and manage external data sources including SAP ERP, databases, and APIs
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingSource(null); setShowAddDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Data Source
        </Button>
      </div>

      {/* Data Sources List */}
      {dataSources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Sources Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first data source to start syncing data from external systems
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Data Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dataSources.map((source) => {
            const typeInfo = getTypeInfo(source.type);
            const statusConfig = STATUS_CONFIG[source.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={source.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{typeInfo.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{source.name}</h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {source.status}
                          </Badge>
                          {!source.enabled && (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {typeInfo.label} • {source.host || "No host configured"}
                          {source.database && ` • ${source.database}`}
                        </p>
                        {source.last_sync && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last synced: {new Date(source.last_sync).toLocaleString()}
                          </p>
                        )}
                        {source.error_message && (
                          <p className="text-xs text-red-600 mt-1">{source.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSync(source)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Sync
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(source)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMutation.mutate(source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSource ? "Edit Data Source" : "Add New Data Source"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., SAP Production"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Host / IP Address</Label>
                <Input
                  placeholder="192.168.1.100"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  placeholder="1433"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Database Name</Label>
                <Input
                  placeholder="SAP_PROD"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  placeholder="readonly_user"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sync Frequency</Label>
                <Select 
                  value={formData.sync_frequency} 
                  onValueChange={(v) => setFormData({ ...formData, sync_frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Enabled</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <p className="text-yellow-800">
                <strong>Note:</strong> Database passwords should be configured in the project's environment variables/secrets for security. 
                Go to Dashboard → Settings → Environment Variables to set <code>SAP_DB_PASSWORD</code>.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plug className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingSource ? "Update" : "Add"} Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}