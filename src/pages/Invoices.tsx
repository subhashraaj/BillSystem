import { useEffect, useState } from "react";
import { Plus, Search, Download } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print"
import OriginalTemplate from "@/components/functionality/print/original";


import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";


import { useInvoices, useCreateInvoice, useCustomers, useItems, useInvoiceById } from "@/hooks/useAPI";
import InvoiceDeletePopUp from "@/components/popUp/InvoiceDeletePopUp";
import { InvoiceViewDialog } from "@/components/forms/InvoiceViewDialog";


type SelectedItem = {
  id: number;
  name: string;
  price: number;     // permanent price
  temp_rate: number; // temporary invoice rate
  quantity: number;
};

export default function Invoices() {
  const { data: invoicesData } = useInvoices();
  const { data: customersData } = useCustomers();
  const { data: itemsData } = useItems();
  const { mutateAsync: createInvoice } = useCreateInvoice();

  const invoices = invoicesData?.data || [];
  const customers = customersData?.data || [];
  const items = itemsData?.data || [];

  // city
  const [openCity, setOpenCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityValue, setCityValue] = useState("");

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [customerValue, setCustomerValue] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);

  // Items
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Invoice
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDeleteInvoiceOpen, setIsDeleteInvoiceOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [invoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);

  const [dueDate, setDueDate] = useState("");


  /* ------------------ ITEM HANDLERS ------------------ */


  const handleAddItem = (itemId: string) => {
    const item = items.find((i: any) => i.id.toString() === itemId);
    if (!item) return;

    setSelectedItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price ?? 0,
          temp_rate: item.price ?? 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: number, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, qty) } : i
      )
    );
  };

  const updateTempRate = (id: number, rate: number) => {
    setSelectedItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, temp_rate: Math.max(0, rate) } : i
      )
    );
  };

  const handleDeleteInvoice = (invoice: { id: number, invoice_number: string }) => {
    setSelectedInvoice(invoice)
    setIsDeleteInvoiceOpen(true)

  }

  const handleDeleteInvoiceOpenChange = (open: boolean) => {
    setIsDeleteInvoiceOpen(open);
    if (!open) {
      setSelectedInvoice(null);
    }
  };

  /* ------------------ TOTALS ------------------ */

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.temp_rate * item.quantity,
    0
  );
  const taxRate = 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  /* ------------------ CREATE INVOICE ------------------ */

  const handleCreateInvoice = async () => {
    if (!selectedCustomer || selectedItems.length === 0) return;

    const payload = {
      customer_id: Number(selectedCustomer),
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      tax_rate: taxRate * 100,
      items: selectedItems.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
        temp_rate: item.temp_rate,
      })),
    };


    await createInvoice(payload);
    setIsCreateInvoiceOpen(false);
    setSelectedCustomer(null);
    setSelectedItems([]);
  };

  const selectedCustomerName =
    customers.find((c: any) => c.id.toString() === selectedCustomer)?.name;


  const cities = Array.from(
    new Set(
      customers
        .map((c: any) => c.city?.trim())
        .filter(Boolean)
    )
  ).sort();

  const filteredCustomers = selectedCity
    ? customers.filter(
      (c: any) =>
        c.city &&
        c.city.trim().toLowerCase() === selectedCity.toLowerCase()
    )
    : customers;


  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef:printRef,
    onAfterPrint: () => setInvoiceToPrint(null),
  });

  // Trigger print automatically when invoiceToPrint changes
  useEffect(() => {
    if (invoiceToPrint) {
      handlePrint();
    }
  }, [invoiceToPrint]);






  // console.log(selectedCustomer)

  /* ------------------ RENDER ------------------ */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Create and manage invoices</p>
        </div>
        <Button onClick={() => setIsCreateInvoiceOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* ---------------- CREATE INVOICE DIALOG ---------------- */}

      <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Temporary rate will not change item price</DialogDescription>
          </DialogHeader>

          {/* Balance Block */}


          {/* CITY */}
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>

            <Popover open={openCity} onOpenChange={setOpenCity}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {cityValue || "Select city..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search city..." />

                  <CommandList>
                    <CommandEmpty>No city found.</CommandEmpty>

                    <CommandGroup>
                      {cities.map((city) => (
                        <CommandItem
                          key={city}
                          value={city}
                          onSelect={(value) => {
                            setCityValue(value);
                            setSelectedCity(value);

                            // reset customer when city changes
                            setCustomerValue("");
                            setSelectedCustomer(null);

                            setOpenCity(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              cityValue === city ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {city}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* CUSTOMER */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer</label>

            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  disabled={!selectedCity}
                >
                  {customerValue || "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search customer..." />

                  <CommandList>
                    <CommandEmpty>
                      {selectedCity
                        ? "No customers in this city."
                        : "Select a city first."}
                    </CommandEmpty>

                    <CommandGroup>
                      {filteredCustomers.map((customer: any) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={(value) => {
                            setCustomerValue(value);
                            setSelectedCustomer(customer.id.toString());
                            setOpenCustomer(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customerValue === customer.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            <span className="text-xs">
                              {customer.mobile_number || customer.phone}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>






          {/* ITEMS */}
          <Select onValueChange={handleAddItem}>
            <SelectTrigger>
              <SelectValue placeholder="Add Item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item: any) => (
                <SelectItem key={item.id} value={item.id.toString()} disabled={selectedItems.some((i) => i.id === item.id)}>
                  {item.name} — ₹{item.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* SELECTED ITEMS */}
          {selectedItems.map((item) => (
            <div key={item.id} className="flex gap-3 items-center border-b py-2">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Base Price ₹{item.price}
                </p>
              </div>

              <Input
                type="number"
                className="w-24"
                value={item.temp_rate}
                onChange={(e) =>
                  updateTempRate(item.id, Number(e.target.value))
                }
                placeholder="Rate"
              />

              <Input
                type="number"
                className="w-20"
                value={item.quantity}
                onChange={(e) =>
                  updateQuantity(item.id, Number(e.target.value))
                }
              />

              <p className="w-24 text-right font-semibold">
                ₹{(item.temp_rate * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          {/* SUMMARY */}
          <div className="border rounded-md p-3 bg-muted/30 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={!selectedCustomer || selectedItems.length === 0}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- INVOICE LIST ---------------- */}

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <Input className="pl-9" placeholder="Search invoices..." />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.invoice_number}</TableCell>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell>{inv.invoice_date}</TableCell>
                  <TableCell>{inv.item_count}</TableCell>
                  <TableCell>₹{inv.total_amount}</TableCell>
                  <TableCell className="text-right space-x-2">

                    <Button variant="ghost" size="sm"
                      onClick={() =>
                        handleDeleteInvoice({
                          id: inv.id,
                          invoice_number: inv.invoice_number,

                        })
                      }
                    >Delete</Button>

                    <Button size="sm" variant="ghost"
                      onClick={() => setInvoiceToPrint(inv)}
                    >Original</Button>


                    {/* <Button size="sm" variant="ghost"
                        onClick={() => printInvoice(inv.id, "DUPLICATE")}
                      > Duplicate</Button> */}

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoiceToPrint && (
        <div style={{ display: "none" }}>
          <OriginalTemplate ref={printRef} invoice={invoiceToPrint} />
        </div>

      )}



      <InvoiceDeletePopUp
        open={isDeleteInvoiceOpen}
        onOpenChange={handleDeleteInvoiceOpenChange}
        invoice={selectedInvoice}
      />

      <InvoiceViewDialog
        open={isViewInvoiceOpen}
        onOpenChange={setIsViewInvoiceOpen}
        invoice={viewInvoice}
      />
    </div>
  );
}
