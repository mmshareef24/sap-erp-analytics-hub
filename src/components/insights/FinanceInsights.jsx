import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle,
  CheckCircle, Lightbulb, Loader2, Sparkles, ArrowUpDown, Wallet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from "recharts";
import { base44 } from "@/api/base44Client";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function FinanceInsights({ financialEntries, salesInvoices, vendorInvoices }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Calculate metrics
  const totalDebit = financialEntries.reduce((sum, e) => sum + (e.debit_amount || 0), 0);
  const totalCredit = financialEntries.reduce((sum, e) => sum + (e.credit_amount || 0), 0);
  const netPosition = totalDebit - totalCredit;

  // Receivables
  const totalReceivables = salesInvoices
    .filter(i => !["Paid", "Cancelled"].includes(i.status))
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);
  const overdueReceivables = salesInvoices
    .filter(i => i.status === "Overdue")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  // Payables
  const totalPayables = vendorInvoices
    .filter(i => !["Paid", "Cancelled"].includes(i.status))
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);
  const blockedPayables = vendorInvoices
    .filter(i => i.status === "Blocked")
    .reduce((sum, i) => sum + (i.gross_amount || 0), 0);

  // Cash position (simplified)
  const workingCapital = totalReceivables - totalPayables;

  // Monthly trend
  const monthlyData = financialEntries.reduce((acc, entry) => {
    const month = entry.posting_date?.substring(0, 7) || "Unknown";
    const existing = acc.find(m => m.month === month);
    if (existing) {
      existing.debit += entry.debit_amount || 0;
      existing.credit += entry.credit_amount || 0;
    } else {
      acc.push({ 
        month, 
        debit: entry.debit_amount || 0, 
        credit: entry.credit_amount || 0 
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  monthlyData.forEach(m => {
    m.net = m.debit - m.credit;
  });

  // Cost center analysis
  const costCenterData = financialEntries.reduce((acc, entry) => {
    const cc = entry.cost_center || "Unassigned";
    const existing = acc.find(c => c.costCenter === cc);
    if (existing) {
      existing.debit += entry.debit_amount || 0;
      existing.credit += entry.credit_amount || 0;
    } else {
      acc.push({ 
        costCenter: cc, 
        debit: entry.debit_amount || 0, 
        credit: entry.credit_amount || 0 
      });
    }
    return acc;
  }, []).sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit)).slice(0, 6);

  // G/L Account breakdown
  const glAccountData = financialEntries.reduce((acc, entry) => {
    const gl = entry.gl_account_name || entry.gl_account || "Unknown";
    const existing = acc.find(g => g.account === gl);
    if (existing) {
      existing.total += (entry.debit_amount || 0) + (entry.credit_amount || 0);
    } else {
      acc.push({ 
        account: gl, 
        total: (entry.debit_amount || 0) + (entry.credit_amount || 0)
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total).slice(0, 5);

  // AR/AP aging
  const arAgingData = [
    { name: "Current", value: salesInvoices.filter(i => i.status === "Open").reduce((s, i) => s + (i.gross_amount || 0), 0) },
    { name: "Overdue", value: overdueReceivables },
    { name: "Partially Paid", value: salesInvoices.filter(i => i.status === "Partially Paid").reduce((s, i) => s + (i.gross_amount || 0), 0) }
  ].filter(a => a.value > 0);

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this financial data and provide actionable insights:
        
Total Debit: SAR ${totalDebit.toLocaleString()}
Total Credit: SAR ${totalCredit.toLocaleString()}
Net Position: SAR ${netPosition.toLocaleString()}

Accounts Receivable:
- Total Outstanding: SAR ${totalReceivables.toLocaleString()}
- Overdue Amount: SAR ${overdueReceivables.toLocaleString()}
- Overdue %: ${totalReceivables > 0 ? (overdueReceivables / totalReceivables * 100).toFixed(1) : 0}%

Accounts Payable:
- Total Outstanding: SAR ${totalPayables.toLocaleString()}
- Blocked Invoices: SAR ${blockedPayables.toLocaleString()}

Working Capital: SAR ${workingCapital.toLocaleString()}

Top Cost Centers by Activity:
${costCenterData.map(cc => `- ${cc.costCenter}: SAR ${(cc.debit + cc.credit).toLocaleString()}`).join('\n')}

Top G/L Accounts:
${glAccountData.map(gl => `- ${gl.account}: SAR ${gl.total.toLocaleString()}`).join('\n')}

Provide 3-4 specific recommendations to improve cash flow, reduce financial risks, and optimize working capital.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiInsight(result);
    } catch (error) {
      console.error("AI insight error:", error);
    }
    setLoadingAI(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receivables</p>
                <p className="text-2xl font-bold">SAR {(totalReceivables / 1000).toFixed(0)}K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm text-red-600 mt-2">
              {overdueReceivables > 0 ? `SAR ${(overdueReceivables / 1000).toFixed(0)}K overdue` : 'No overdue'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payables</p>
                <p className="text-2xl font-bold">SAR {(totalPayables / 1000).toFixed(0)}K</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-orange-600 mt-2">
              {blockedPayables > 0 ? `SAR ${(blockedPayables / 1000).toFixed(0)}K blocked` : 'None blocked'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Working Capital</p>
                <p className={`text-2xl font-bold ${workingCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  SAR {(workingCapital / 1000).toFixed(0)}K
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">AR - AP</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Position</p>
                <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  SAR {(netPosition / 1000).toFixed(0)}K
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Debit - Credit</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Financial Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Bar dataKey="debit" fill="#10b981" name="Debit" />
                  <Bar dataKey="credit" fill="#ef4444" name="Credit" />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receivables Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={arAgingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {arAgingData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Center & G/L Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Cost Center Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costCenterData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="costCenter" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => `SAR ${v.toLocaleString()}`} />
                  <Bar dataKey="debit" fill="#10b981" name="Debit" stackId="a" />
                  <Bar dataKey="credit" fill="#ef4444" name="Credit" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Top G/L Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {glAccountData.map((gl, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{idx + 1}</span>
                    <p className="font-medium text-sm truncate max-w-[180px]">{gl.account}</p>
                  </div>
                  <p className="font-semibold">SAR {gl.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-r from-emerald-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" /> AI-Powered Insights
            </CardTitle>
            <Button onClick={generateAIInsight} disabled={loadingAI} size="sm">
              {loadingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
              Generate Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsight ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">{aiInsight.summary}</p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {aiInsight.recommendations?.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Risks
                  </h4>
                  <ul className="space-y-1">
                    {aiInsight.risks?.map((risk, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {risk}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" /> Opportunities
                  </h4>
                  <ul className="space-y-1">
                    {aiInsight.opportunities?.map((opp, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Click "Generate Insights" to get AI-powered recommendations for financial optimization
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}