import { useMemo } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, AlertTriangle, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useCustomers, useItems, useInvoices, usePayments } from "@/hooks/useAPI";
import { useState } from "react";

export default function Dashboard() {

  // 🔹 Fetch Data (parallel)
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: itemsData, isLoading: itemsLoading } = useItems();
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices();
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const customers = customersData?.data || [];
  const items = itemsData?.data || [];
  const invoices = invoicesData?.data || [];
  const payments = paymentsData?.data || [];

  console.log(
    invoices.map(i => ({
      status: i.status,
      amount: i.total_amount,
      date: i.created_at
    }))
  );
  

  // 🔹 Memoized Metrics
  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum: number, inv: any) => {
      if (!inv.created_at) return sum;
  
      const d = new Date(inv.created_at);
      if (isNaN(d.getTime())) return sum;
  
      const isSameMonth =
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear;
  
      const status = String(inv.status).toLowerCase();
  
      const isPaid =
        status === "paid" ||
        status === "completed" ||
        status === "success";
  
      if (isSameMonth && isPaid) {
        return sum + (parseFloat(inv.total_amount) || 0);
      }
  
      return sum;
    }, 0);
  }, [invoices, selectedMonth, selectedYear]);
  
  


  const totalCustomers = useMemo(() => customers.length, [customers]);
  const totalItems = useMemo(() => items.length, [items]);
  const totalPayments = useMemo(() => payments.length, [payments]);

  const lowStockItems = useMemo(() => {
    return items.filter((item: any) => item.current <= item.minimum);
  }, [items]);

  // 🔹 Loading state
  const isLoading =
    customersLoading || itemsLoading || invoicesLoading || paymentsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business metrics
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 items-center">
        <select
          className="border rounded px-2 py-1"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {[2023, 2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>


      {/* 🔹 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
          trend="+12.5% from last month"
          trendUp={true}
        />

        <MetricCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          trend="+8 new this month"
          trendUp={true}
        />

        <MetricCard
          title="Active Items"
          value={totalItems}
          icon={Package}
          trend={`${lowStockItems.length} low stock`}
          trendUp={false}
        />

        <MetricCard
          title="Pending Payments"
          value={totalPayments}
          icon={AlertTriangle}
          trend="Invoices pending"
          trendUp={false}
        />
      </div>

      {/* 🔹 Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>

          <CardContent>
            {itemsLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ) : lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No low stock items 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.current} {item.unit} remaining (Min: {item.minimum}{" "}
                        {item.unit})
                      </p>
                    </div>
                    <Badge variant="destructive">Low</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>

          <CardContent>
            {invoicesLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No invoices found
              </p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice: any) => (
                  <div
                    key={invoice.legacy_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.customer_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹{invoice.total_amount?.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          invoice.status === "Paid" ? "default" : "secondary"
                        }
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global Loading Indicator */}
      {isLoading && (
        <p className="text-center text-sm text-muted-foreground">
          Updating dashboard...
        </p>
      )}
    </div>
  );
}
