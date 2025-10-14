import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Payments() {
  const payments = [
    { id: "PAY-001", invoice: "INV-001", customer: "ABC Corporation", date: "2024-01-15", amount: "$2,450", method: "Bank Transfer", status: "Completed" },
    { id: "PAY-002", invoice: "INV-002", customer: "XYZ Limited", date: "2024-01-14", amount: "$1,890", method: "Cash", status: "Pending" },
    { id: "PAY-003", invoice: "INV-003", customer: "Tech Solutions Inc", date: "2024-01-13", amount: "$3,200", method: "Credit Card", status: "Completed" },
  ];

  const getStatusVariant = (status: string) => {
    return status === "Completed" ? "default" : "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Track and manage payment records</p>
        </div>
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>{payment.invoice}</TableCell>
                  <TableCell>{payment.customer}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-semibold">{payment.amount}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(payment.status)}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
