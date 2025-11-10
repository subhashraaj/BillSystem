import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Factory, Package, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportManufacturingDialog } from "@/components/forms/ReportManufacturingDialog";
import { useManufacturing } from "@/hooks/useAPI";
import { useState } from "react";

export default function Manufacturing() {
  const { data: manufacturingData, isLoading, error } = useManufacturing();
  const [searchTerm, setSearchTerm] = useState("");
  
  const manufacturingRecords = manufacturingData?.data || [];

  // Filter records based on search term
  const filteredRecords = manufacturingRecords.filter((record: any) =>
    record.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.staff_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manufacturing</h1>
          <p className="text-muted-foreground">Report and track manufactured items</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading manufacturing records...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manufacturing</h1>
          <p className="text-muted-foreground">Report and track manufactured items</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading manufacturing records: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manufacturing</h1>
        <p className="text-muted-foreground">Reports of manufactured items</p>
      </div>
          <div className="text-center py-8">
            <ReportManufacturingDialog />
          </div>
       
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Manufacturing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Search manufacturing records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Batch No</TableHead>
                <TableHead>Staff</TableHead>
                {/* <TableHead>Status</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchTerm ? 'No manufacturing records found matching your search.' : 'No manufacturing records found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.manufacturing_date}</div>
                        <div className="text-sm text-muted-foreground">{record.manufacturing_time}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.item_name}</div>
                        <div className="text-sm text-muted-foreground">{record.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{record.quantity_manufactured}</TableCell>
                    <TableCell>{record.batch_number || '-'}</TableCell>
                    <TableCell>{record.staff_name}</TableCell>
                    {/* <TableCell>
                      <Badge variant="default">Completed</Badge>
                    </TableCell> */}
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