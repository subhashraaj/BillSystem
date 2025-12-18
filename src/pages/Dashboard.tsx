import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const lowStockItems = [
    { name: "Steel Sheets", current: 15, minimum: 50, unit: "kg" },
    { name: "Aluminum Rods", current: 8, minimum: 30, unit: "pcs" },
    { name: "Copper Wire", current: 22, minimum: 40, unit: "m" },
  ];

  const recentInvoices = [
    { id: "INV-001", customer: "ABC Corp", amount: "$2,450", status: "Paid" },
    { id: "INV-002", customer: "XYZ Ltd", amount: "$1,890", status: "Pending" },
    { id: "INV-003", customer: "Tech Solutions", amount: "$3,200", status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value="₹45,231"
          icon={DollarSign}
          trend="+12.5% from last month"
          trendUp={true}
        />
        <MetricCard
          title="Total Customers"
          value="156"
          icon={Users}
          trend="+8 new this month"
          trendUp={true}
        />
        <MetricCard
          title="Active Items"
          value="89"
          icon={Package}
          trend="12 low stock"
          trendUp={false}
        />
        <MetricCard
          title="Pending Payments"
          value="₹8,420"
          icon={AlertTriangle}
          trend="5 invoices overdue"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.current} {item.unit} remaining (Min: {item.minimum} {item.unit})
                    </p>
                  </div>
                  <Badge variant="destructive">Low</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map((invoice, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{invoice.amount}</p>
                    <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
