import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  // Sales
  "Open": "bg-blue-100 text-blue-800",
  "In Process": "bg-yellow-100 text-yellow-800",
  "Delivered": "bg-purple-100 text-purple-800",
  "Completed": "bg-green-100 text-green-800",
  "Cancelled": "bg-red-100 text-red-800",
  // Purchase
  "Created": "bg-gray-100 text-gray-800",
  "Approved": "bg-blue-100 text-blue-800",
  "Partially Received": "bg-yellow-100 text-yellow-800",
  "Fully Received": "bg-green-100 text-green-800",
  // Invoice
  "Posted": "bg-blue-100 text-blue-800",
  "Paid": "bg-green-100 text-green-800",
  "Partially Paid": "bg-yellow-100 text-yellow-800",
  "Blocked": "bg-red-100 text-red-800",
  // Production
  "Released": "bg-blue-100 text-blue-800",
  "Confirmed": "bg-purple-100 text-purple-800",
  "Closed": "bg-gray-100 text-gray-800"
};

export default function DataTable({ title, columns, data, maxRows = 5 }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap">{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, maxRows).map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="whitespace-nowrap">
                      {col.key === 'status' ? (
                        <Badge className={statusColors[row[col.key]] || "bg-gray-100 text-gray-800"}>
                          {row[col.key]}
                        </Badge>
                      ) : col.format ? (
                        col.format(row[col.key])
                      ) : (
                        row[col.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}