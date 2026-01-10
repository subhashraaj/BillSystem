import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useCreateInvoice, useInvoices } from "@/hooks/useAPI";
import { useCustomers } from "@/hooks/useAPI";
import { useItems } from "@/hooks/useAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import InvoiceDeletePopUp from "@/components/popUp/InvoiceDeletePopUp";




export default function Invoices() {
  const { data: invoicesData, isLoading, error } = useInvoices();
  const { data: customersData, isLoading: customersLoading, error: customersError } = useCustomers();
  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useItems();
  const invoices = invoicesData?.data || [];
  const customers = customersData?.data || [];
  const items = itemsData?.data || [];
  const { mutateAsync: createInvoice } = useCreateInvoice();
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid": return "default";
      case "Pending": return "secondary";
      case "Overdue": return "destructive";
      default: return "secondary";
    }
  };
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [customerQuery, setCustomerQuery] = useState("")
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [showCityList, setShowCityList] = useState(false)
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0] // YYYY-MM-DD
  );

  const [dueDate, setDueDate] = useState("");
  const [isDeleteInvoiceOpen, setIsDeleteInvoiceOpen] = useState(false);
  const handleCreateInvoiceClick = () => {

    setIsCreateInvoiceOpen(true);
  }
  const handleCreateInvoiceOpenChange = (open: boolean) => {
    setIsCreateInvoiceOpen(open);
    if (!open) {
      setSelectedInvoice(null);
      setSelectedCustomer(null);
      setSelectedItem([]);
    }
  }

  const cities = Array.from(
    new Set(customers.map((c: any) => c.city).filter((city): city is string => Boolean(city))
    ))


  const handleAddItem = (itemId: string) => {
    const item = items.find((i: any) => i.id.toString() === itemId);
    if (!item) return;

    setSelectedItem((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) return prev; // Prevent duplicates

      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price ?? 0,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (id: number, qty: number) => {
    setSelectedItem((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  // console.log(customersData)

  // TAX TOTAL

  const subtotal = selectedItem.reduce(
    (sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.00
  const tax = subtotal * taxRate;
  const total = subtotal + tax

  // handle Create Invoice

  const handleCreateInvoice = async () => {
    if (!selectedCustomer || selectedItem.length === 0) return;

    const payload = {
      customer_id: Number(selectedCustomer),
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      tax_rate: taxRate * 100,
      items: selectedItem.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      await createInvoice(payload);
      setIsCreateInvoiceOpen(false);
      setSelectedCustomer(null);
      setSelectedItem([]);
    } catch (err) {
      console.error("Failed to create invoice", err);
    }
  };

  const filteredCustomers = selectedCity
    ? customers.filter(
      (c: any) =>
        c.city?.toLowerCase() === selectedCity.toLowerCase()
    )
    : customers

  const handleDeleteInvoice = (invoice: {
    id: number;
    invoice_number: string;
  }) => {
    setSelectedInvoice(invoice);
    setIsDeleteInvoiceOpen(true);
  };

  const handleDeleteInvoiceOpenChange = (open: boolean) => {
    setIsDeleteInvoiceOpen(open);
    if (!open) {
      setSelectedInvoice(null);
    }
  };





  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Create and manage customer invoices</p>
        </div>
        <Button className="bg-gradient-primary" onClick={handleCreateInvoiceClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>
      <Dialog open={isCreateInvoiceOpen} onOpenChange={handleCreateInvoiceOpenChange}>
        <DialogContent className="max-w-4xl w-full flex flex-col max-h-[99vh]">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Fill out the details to create a new invoice.</DialogDescription>
          </DialogHeader>
          <div style={{ padding: "5px" }} className="flex-1 overflow-y-auto space-y-4 pr-2">
            <div style={{ display: "flex", justifyContent: "space-between" }}>

              {/* Invoice Generate */}

              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice ID</label>
                <Input value="Auto-generated" disabled />
              </div>

              {/* Due display */}

              {selectedCustomer && (() => {
                const customer = customers.find((c: any) => c.id.toString() === selectedCustomer)


                if (!customer) return null

                return (
                  <div style={{}} className="p-3 mt-2 border rounded-md bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      Amount Due
                    </p>
                    <p className="text-l font-bold text-red-500">
                      ₹{(customer.balance ?? 0).toFixed(2)}
                    </p>
                  </div>
                )
              })()}
            </div>


            {/* City Select */}

            <div className="space-y-2 relative">
              <label className="text-sm font-medium">City</label>

              <Input
                placeholder="Type city name"
                value={cityQuery}
                onFocus={() => setShowCityList(true)}
                onChange={(e) => {
                  setCityQuery(e.target.value)
                  setShowCityList(true)
                }}
                onBlur={() => setTimeout(() => setShowCityList(false), 150)}
              />

              {showCityList && cityQuery && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {cities
                    .filter((city: any) =>
                      city
                        .toLowerCase()
                        .includes(cityQuery.toLowerCase())
                    )
                    .map((city: any) => (
                      <div
                        key={city.id}
                        className="px-3 py-2 cursor-pointer hover:bg-muted"
                        onMouseDown={() => {
                          setSelectedCity(city)
                          setCityQuery(city)
                          setShowCityList(false)
                        }}
                      >
                        {city}
                      </div>
                    ))}

                  {cities.filter((c: any) =>
                    c.city?.toLowerCase().includes(cityQuery.toLowerCase())
                  ).length === 0 && (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No city found
                      </div>
                    )}
                </div>
              )}
            </div>



            {/* Customer Select */}

            <div className="space-y-2 relative">
              <label className="text-sm font-medium">Customer</label>

              <Input
                placeholder="Type customer name"
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value)
                  setShowCustomerList(true)
                  setSelectedCustomer(null)
                }}
                onFocus={() => setShowCustomerList(true)}
                onBlur={() => setTimeout(() => setShowCustomerList(false), 150)}
              />

              {showCustomerList && customerQuery && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {filteredCustomers
                    .filter((customer: any) =>
                      customer.name
                        .toLowerCase()
                        .includes(customerQuery.toLowerCase())
                    )
                    .map((customer: any) => (
                      <div
                        key={customer.id}
                        className="px-3 py-2 cursor-pointer hover:bg-muted"
                        onMouseDown={() => {
                          setSelectedCustomer(customer.id.toString())
                          setCustomerQuery(customer.name)
                          setShowCustomerList(false)
                        }}
                      >
                        {customer.name}
                      </div>
                    ))}

                  {filteredCustomers.filter((c: any) =>
                    c.name.toLowerCase().includes(customerQuery.toLowerCase())
                  ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No customer found
                      </div>
                    )}
                </div>
              )}
            </div>




            {/* Item Select */}
            <div className="space-y">
              <label className="text-sm font-medium">Items</label>
              <Select onValueChange={handleAddItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select items" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item: any) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} — ₹{item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Selected Items List */}
            {selectedItem.length > 0 && (
              <div className="border rounded-md p-3 space-y-3 max-h-64 overflow-y-auto">
                {selectedItem.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>

                      <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        className="w-20"
                      />

                      <p className="font-semibold w-20 text-right">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Invoice Summary */}
            {selectedItem.length > 0 && (
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>



          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} className="bg-gradient-primary">Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InvoiceDeletePopUp
        open={isDeleteInvoiceOpen}
        onOpenChange={handleDeleteInvoiceOpenChange}
        invoice={selectedInvoice}
      />
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>{invoice.invoice_date}</TableCell>
                  <TableCell>{invoice.item_count} items</TableCell>
                  <TableCell className="font-semibold">{invoice.total_amount}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice({ id: invoice.id, invoice_number: invoice.invoice_number })}>Delete</Button>
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
