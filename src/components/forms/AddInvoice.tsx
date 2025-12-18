import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCustomers } from "@/hooks/useAPI";

export function AddInvoice() {
  const [open, setOpen] = useState(false);
  const { data: customersData, isLoading: customersLoading, error: customersError } = useCustomers();
  const customers = customersData?.data || [];
  const [selectedCustomer, setSelectedCustomer] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<any>({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    items: [],
    tax_rate: 0,
    notes: ''
  });
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSelectedCustomer(undefined);
      setFormData({
        customer_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        items: [],
        tax_rate: 0,
        notes: ''
      });
    }
  }
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="customer">Customers</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="bg-gradient-primary w-full">
                Create Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}