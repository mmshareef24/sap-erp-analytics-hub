import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText, BookOpen, Building2, TrendingUp, ArrowLeftRight, Loader2 } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import FinancialEntriesList from "@/components/finance/FinancialEntriesList";
import GLAccountSummary from "@/components/finance/GLAccountSummary";
import CostCenterAnalysis from "@/components/finance/CostCenterAnalysis";
import ProfitLossReport from "@/components/finance/ProfitLossReport";
import PayablesReceivables from "@/components/finance/PayablesReceivables";
import DateFilter, { filterDataByDate } from "@/components/common/DateFilter";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("entries");
  const [dateFilter, setDateFilter] = useState({ type: "all", startDate: null, endDate: null });

  const { data: financialEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["financialEntries"],
    queryFn: () => base44.entities.FinancialEntry.list()
  });

  const { data: vendorInvoices = [], isLoading: loadingVendor } = useQuery({
    queryKey: ["vendorInvoices"],
    queryFn: () => base44.entities.VendorInvoice.list()
  });

  const { data: salesInvoices = [], isLoading: loadingSales } = useQuery({
    queryKey: ["salesInvoices"],
    queryFn: () => base44.entities.SalesInvoice.list()
  });

  const isLoading = loadingEntries || loadingVendor || loadingSales;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Apply date filter
  const filteredFinancialEntries = filterDataByDate(financialEntries, dateFilter, "posting_date");
  const filteredVendorInvoices = filterDataByDate(vendorInvoices, dateFilter, "invoice_date");
  const filteredSalesInvoices = filterDataByDate(salesInvoices, dateFilter, "invoice_date");

  const totalDebit = filteredFinancialEntries.reduce((sum, e) => sum + (e.debit_amount || 0), 0);
  const totalCredit = filteredFinancialEntries.reduce((sum, e) => sum + (e.credit_amount || 0), 0);
  const uniqueGLAccounts = new Set(filteredFinancialEntries.map(e => e.gl_account)).size;
  const uniqueCostCenters = new Set(filteredFinancialEntries.map(e => e.cost_center).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance Module</h1>
            <p className="text-muted-foreground mt-1">Financial entries, G/L accounts, cost centers, and reports</p>
          </div>
          <DateFilter onFilterChange={setDateFilter} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Debit"
            value={`SAR ${(totalDebit / 1000).toFixed(0)}K`}
            subtitle={`${filteredFinancialEntries.length} entries`}
            icon={TrendingUp}
          />
          <KPICard
            title="Total Credit"
            value={`SAR ${(totalCredit / 1000).toFixed(0)}K`}
            subtitle="All postings"
            icon={TrendingUp}
          />
          <KPICard
            title="G/L Accounts"
            value={uniqueGLAccounts}
            subtitle="Active accounts"
            icon={BookOpen}
          />
          <KPICard
            title="Cost Centers"
            value={uniqueCostCenters}
            subtitle="With activity"
            icon={Building2}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1">
            <TabsTrigger value="entries" className="gap-2 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">FI Documents</span>
            </TabsTrigger>
            <TabsTrigger value="gl-accounts" className="gap-2 py-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">G/L Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="cost-centers" className="gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Cost Centers</span>
            </TabsTrigger>
            <TabsTrigger value="pnl" className="gap-2 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Profit & Loss</span>
            </TabsTrigger>
            <TabsTrigger value="ap-ar" className="gap-2 py-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">AP/AR</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <FinancialEntriesList financialEntries={filteredFinancialEntries} />
          </TabsContent>

          <TabsContent value="gl-accounts">
            <GLAccountSummary financialEntries={filteredFinancialEntries} />
          </TabsContent>

          <TabsContent value="cost-centers">
            <CostCenterAnalysis financialEntries={filteredFinancialEntries} />
          </TabsContent>

          <TabsContent value="pnl">
            <ProfitLossReport financialEntries={filteredFinancialEntries} />
          </TabsContent>

          <TabsContent value="ap-ar">
            <PayablesReceivables vendorInvoices={filteredVendorInvoices} salesInvoices={filteredSalesInvoices} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}