import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Search, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// removed Badge since status column is removed
import { AddItemDialog } from "@/components/forms/AddItemDialog";
import { EditItemDialog } from "@/components/forms/EditItemDialog";
import { useItems } from "@/hooks/useAPI";
import { useState } from "react";
import ItemDeletePopUp from "@/components/popUp/ItemDeletePopUp";

export default function Items() {
  const { data: itemsData, isLoading, error } = useItems();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const items = itemsData?.data || [];

  // Filter items based on search term
  const filteredItems = items.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number) => {
    if (stock > 50) return { label: "In Stock", variant: "default" as const };
    if (stock > 10) return { label: "Low Stock", variant: "secondary" as const };
    return { label: "Critical", variant: "destructive" as const };
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setIsEditOpen(true)
  }

  const handleDeleteClick = (item: any) => {
    setSelectedItem(item);
    setIsDeleteOpen(true)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    setIsDeleteOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Items</h1>
          <p className="text-muted-foreground">Manage manufactured products</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading items...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Items</h1>
          <p className="text-muted-foreground">Manage manufactured products</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading items: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Items</h1>
          <p className="text-muted-foreground">Manage manufactured products</p>
        </div>
        <AddItemDialog />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
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
                <TableHead>Item Name</TableHead>
                <TableHead>Gram Required</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock(kg)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchTerm ? 'No items found matching your search.' : 'No items found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => {
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.gram ? `${item.gram}g` : '-'}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell className="font-semibold">{item.current_stock}</TableCell>
                      <TableCell>₹{item.price}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditClick(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteClick(item)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={isEditOpen}
        item={selectedItem}
        onOpenChange={handleDialogOpenChange}
      />
      <ItemDeletePopUp
        open={isDeleteOpen}
        item={selectedItem}
        onOpenChange={handleDeleteOpenChange}
      />
    </div>
  );
}
