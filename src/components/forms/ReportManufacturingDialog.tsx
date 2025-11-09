import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Package, X, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateManufacturingRecord, useItems } from '@/hooks/useAPI';

interface SelectedItem {
  item_id: number;
  item_name: string;
  quantity: number;
}

interface ManufacturingFormData {
  items: SelectedItem[];
  batch_number: string;
  staff_name: string;
  manufacturing_date: string;
  manufacturing_time: string;
  notes: string;
}

const initialFormData: ManufacturingFormData = {
  items: [],
  batch_number: '',
  staff_name: '',
  manufacturing_date: new Date().toISOString().split('T')[0],
  manufacturing_time: new Date().toTimeString().slice(0, 5),
  notes: '',
};

export function ReportManufacturingDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ManufacturingFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const createManufacturingRecord = useCreateManufacturingRecord();
  const { data: itemsData } = useItems();
  const items = itemsData?.data || [];

  const handleInputChange = (field: keyof ManufacturingFormData, value: string | number | SelectedItem[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleAddItem = () => {
    if (!selectedItemId) {
      setErrors(prev => ({ ...prev, items: 'Please select an item' }));
      return;
    }

    const itemId = parseInt(selectedItemId);
    const item = items.find((i: any) => i.id === itemId);
    
    if (!item) return;

    // Check if item already added
    if (formData.items.some(i => i.item_id === itemId)) {
      setErrors(prev => ({ ...prev, items: 'Item already added' }));
      return;
    }

    const newItem: SelectedItem = {
      item_id: itemId,
      item_name: item.name,
      quantity: 1,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedItemId('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.items;
      return newErrors;
    });
  };

  const handleRemoveItem = (itemId: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.item_id !== itemId),
    }));
  };

  const handleItemQuantityChange = (itemId: number, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.item_id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
    });

    if (!formData.staff_name.trim()) {
      newErrors.staff_name = 'Staff name is required';
    }

    if (!formData.manufacturing_date) {
      newErrors.manufacturing_date = 'Manufacturing date is required';
    }

    if (!formData.manufacturing_time) {
      newErrors.manufacturing_time = 'Manufacturing time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for backend - array of items with quantities
      const submitData = {
        items: formData.items.map(item => ({
          item_id: item.item_id,
          quantity_manufactured: item.quantity,
        })),
        batch_number: formData.batch_number,
        staff_name: formData.staff_name,
        manufacturing_date: formData.manufacturing_date,
        manufacturing_time: formData.manufacturing_time,
        notes: formData.notes,
      };

      await createManufacturingRecord.mutateAsync(submitData);
      setFormData(initialFormData);
      setSelectedItemId('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating manufacturing record:', error);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const message = (error?.message as string) || 'Failed to create manufacturing record';
      import('sonner').then(({ toast }) => toast.error(message));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(initialFormData);
      setSelectedItemId('');
      setErrors({});
    }
  };

  // Get available items (not already selected)
  const availableItems = items.filter((item: any) => 
    !formData.items.some(selected => selected.item_id === item.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto bg-gradient-success">
          <Package className="h-4 w-4 mr-2" />
          Report Manufacturing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Manufactured Items</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Multi-select Items Section */}
          <div className="space-y-2">
            <Label>Items Manufactured *</Label>
            <div className="flex gap-2">
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="flex-1 justify-between"
                    type="button"
                  >
                    {selectedItemId
                      ? availableItems.find((item: any) => item.id.toString() === selectedItemId)?.name || 'Select item...'
                      : 'Select item to add...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command>
                    <CommandInput placeholder="Search items by name or SKU..." />
                    <CommandList>
                      <CommandEmpty>No items found.</CommandEmpty>
                      <CommandGroup>
                        {availableItems.length === 0 ? (
                          <CommandItem disabled>No more items available</CommandItem>
                        ) : (
                          availableItems.map((item: any) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.name} ${item.sku}`}
                              onSelect={() => {
                                setSelectedItemId(item.id.toString());
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedItemId === item.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.name} ({item.sku})
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                disabled={!selectedItemId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
          </div>

          {/* Selected Items List */}
          {formData.items.length > 0 && (
            <div className="space-y-2 border rounded-md p-3">
              <Label className="text-sm font-medium">Selected Items:</Label>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={item.item_id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.item_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`quantity-${item.item_id}`} className="text-xs">Qty:</Label>
                      <Input
                        id={`quantity-${item.item_id}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemQuantityChange(item.item_id, parseInt(e.target.value) || 1)}
                        className="w-20 h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.item_id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="batch_number">Batch Number</Label>
            <Input
              id="batch_number"
              value={formData.batch_number}
              onChange={(e) => handleInputChange('batch_number', e.target.value)}
              placeholder="e.g., BT-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_name">Staff Name *</Label>
            <Input
              id="staff_name"
              value={formData.staff_name}
              onChange={(e) => handleInputChange('staff_name', e.target.value)}
              placeholder="Enter staff name"
              className={errors.staff_name ? 'border-red-500' : ''}
            />
            {errors.staff_name && <p className="text-sm text-red-500">{errors.staff_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturing_date">Date *</Label>
              <Input
                id="manufacturing_date"
                type="date"
                value={formData.manufacturing_date}
                onChange={(e) => handleInputChange('manufacturing_date', e.target.value)}
                className={errors.manufacturing_date ? 'border-red-500' : ''}
              />
              {errors.manufacturing_date && <p className="text-sm text-red-500">{errors.manufacturing_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturing_time">Time *</Label>
              <Input
                id="manufacturing_time"
                type="time"
                value={formData.manufacturing_time}
                onChange={(e) => handleInputChange('manufacturing_time', e.target.value)}
                className={errors.manufacturing_time ? 'border-red-500' : ''}
              />
              {errors.manufacturing_time && <p className="text-sm text-red-500">{errors.manufacturing_time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createManufacturingRecord.isPending}
            >
              {createManufacturingRecord.isPending ? 'Reporting...' : 'Report Manufacturing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
