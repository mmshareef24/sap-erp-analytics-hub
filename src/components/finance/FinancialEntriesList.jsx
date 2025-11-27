import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";

export default function FinancialEntriesList({ financialEntries }) {
  const [search, setSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");

  const documentTypes = [...new Set(financialEntries.map(e => e.document_type).filter(Boolean))];

  const filteredEntries = financialEntries.filter(entry => {
    const matchesSearch = 
      entry.document_number?.toLowerCase().includes(search.toLowerCase()) ||
      entry.gl_account_name?.toLowerCase().includes(search.toLowerCase()) ||
      entry.gl_account?.toLowerCase().includes(search.toLowerCase());
    const matchesType = docTypeFilter === "all" || entry.document_type === docTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Financial Documents</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Doc Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Posting Date</TableHead>
                <TableHead>G/L Account</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.slice(0, 20).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono font-medium">{entry.document_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.document_type || "-"}</Badge>
                  </TableCell>
                  <TableCell>{entry.posting_date}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.gl_account}</p>
                      <p className="text-xs text-muted-foreground">{entry.gl_account_name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{entry.cost_center || "-"}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {entry.debit_amount > 0 ? `${entry.currency || "SAR"} ${entry.debit_amount.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {entry.credit_amount > 0 ? `${entry.currency || "SAR"} ${entry.credit_amount.toLocaleString()}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Showing {Math.min(20, filteredEntries.length)} of {filteredEntries.length} entries
        </p>
      </CardContent>
    </Card>
  );
}