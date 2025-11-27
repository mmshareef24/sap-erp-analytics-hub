import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, Trash2, Play, Edit, Loader2 } from "lucide-react";
import ReportBuilder from "@/components/reports/ReportBuilder";
import ReportViewer from "@/components/reports/ReportViewer";

const moduleLabels = {
  SalesOrder: "Sales Orders",
  SalesInvoice: "Sales Invoices",
  PurchaseOrder: "Purchase Orders",
  VendorInvoice: "Vendor Invoices",
  Inventory: "Inventory",
  ProductionOrder: "Production Orders",
  FinancialEntry: "Financial Entries"
};

export default function Reports() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["custom-reports"],
    queryFn: () => base44.entities.CustomReport.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomReport.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-reports"] })
  });

  const handleEdit = (report) => {
    setEditingReport(report);
    setShowBuilder(true);
  };

  const handleClose = () => {
    setShowBuilder(false);
    setEditingReport(null);
  };

  if (viewingReport) {
    return <ReportViewer report={viewingReport} onBack={() => setViewingReport(null)} />;
  }

  if (showBuilder) {
    return <ReportBuilder report={editingReport} onClose={handleClose} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
          <p className="text-muted-foreground">Create, save, and schedule custom reports</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Report
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No custom reports yet</h3>
            <p className="text-muted-foreground mb-4">Create your first custom report to get started</p>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {moduleLabels[report.module]}
                    </Badge>
                  </div>
                  {report.is_scheduled && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      {report.schedule_frequency}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {report.description && (
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                )}
                <div className="text-xs text-muted-foreground mb-4">
                  <p>{report.selected_fields?.length || 0} fields selected</p>
                  {report.filters?.length > 0 && <p>{report.filters.length} filter(s) applied</p>}
                  {report.group_by && <p>Grouped by: {report.group_by}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setViewingReport(report)} className="flex-1">
                    <Play className="h-3 w-3 mr-1" /> Run
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(report)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteMutation.mutate(report.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}