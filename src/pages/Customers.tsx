import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddCustomerDialog } from "@/components/forms/AddCustomerDialog";
import { useCustomers } from "@/hooks/useAPI";
import { useState } from "react";

export default function Customers() {
  const { data: customersData, isLoading, error } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  
  const customers = customersData?.data || [];

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.gst_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading customers: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <AddCustomerDialog />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>City</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    {/* <TableCell>{customer.email}</TableCell> */}
                    <TableCell>{customer.mobile_number || '-'}</TableCell>
                    <TableCell>{customer.city || '-'}</TableCell>
                    <TableCell>{customer.gst_number || '-'}</TableCell>
                    <TableCell className="font-semibold">${customer.balance}</TableCell>
                    {/* <TableCell>
                      <Badge variant={customer.status === "Active" ? "default" : "secondary"}>
                        {customer.status}
                      </Badge>
                    </TableCell> */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
