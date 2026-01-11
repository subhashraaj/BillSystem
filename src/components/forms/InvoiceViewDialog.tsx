import { Dialog, DialogHeader, DialogContent, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Table } from "../ui/table";
import { TableHeader } from "../ui/table";
import { TableBody } from "../ui/table";
import { TableRow } from "../ui/table";
import { TableCell } from "../ui/table";
import { TableHead } from "../ui/table";

export const InvoiceViewDialog = ({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any | null;
}) => {
  if (!invoice) return null;

  console.log(invoice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Invoice No</span>
            <span>{invoice.invoice_number}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Customer</span>
            <span>{invoice.customer_name}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Invoice Date</span>
            <span>{invoice.invoice_date}</span>
          </div>

          {invoice.due_date && (
            <div className="flex justify-between">
              <span className="font-medium">Due Date</span>
              <span>{invoice.due_date}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="font-medium">Status</span>
            <Badge>{invoice.status}</Badge>
          </div>
          {/* Invoice items */}
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-medium">Invoice Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sub Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item: any) => (
                  <TableRow key={item.item_id}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unit_price}</TableCell>
                    <TableCell>₹{item.total_price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>


          <div className="flex justify-between text-lg font-bold border-t pt-3">
            <span>Total</span>
            <span>₹{invoice.total_amount}</span>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
