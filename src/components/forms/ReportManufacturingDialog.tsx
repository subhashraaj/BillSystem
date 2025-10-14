import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Package } from 'lucide-react';
import { useCreateManufacturingRecord, useItems } from '@/hooks/useAPI';

interface ManufacturingFormData {
  item_id: number;
  quantity_manufactured: number;
  batch_number: string;
  staff_name: string;
  manufacturing_date: string;
  manufacturing_time: string;
  notes: string;
}

const initialFormData: ManufacturingFormData = {
  item_id: 0,
  quantity_manufactured: 1,
  batch_number: '',
  staff_name: '',
  manufacturing_date: new Date().toISOString().split('T')[0],
  manufacturing_time: new Date().toTimeString().slice(0, 5),
  notes: '',
};

export function ReportManufacturingDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ManufacturingFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ManufacturingFormData>>({});
  
  const createManufacturingRecord = useCreateManufacturingRecord();
  const { data: itemsData } = useItems();
  const items = itemsData?.data || [];

  const handleInputChange = (field: keyof ManufacturingFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ManufacturingFormData> = {};

    if (!formData.item_id) {
      newErrors.item_id = 'Item is required';
    }

    if (!formData.quantity_manufactured || formData.quantity_manufactured <= 0) {
      newErrors.quantity_manufactured = 'Quantity must be greater than 0';
    }

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
      await createManufacturingRecord.mutateAsync(formData);
      setFormData(initialFormData);
      setOpen(false);
    } catch (error) {
      console.error('Error creating manufacturing record:', error);
      // Surface error to user
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const message = (error?.message as string) || 'Failed to create manufacturing record';
      // Lazy import to avoid coupling hooks here
      import('sonner').then(({ toast }) => toast.error(message));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(initialFormData);
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto bg-gradient-success">
          <Package className="h-4 w-4 mr-2" />
          Report Manufacturing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Manufactured Items</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item_id">Item Name *</Label>
            <Select
              value={formData.item_id.toString()}
              onValueChange={(value) => handleInputChange('item_id', parseInt(value))}
            >
              <SelectTrigger className={errors.item_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item: any) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.item_id && <p className="text-sm text-red-500">{errors.item_id}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_manufactured">Quantity Manufactured *</Label>
            <Input
              id="quantity_manufactured"
              type="number"
              min="1"
              value={formData.quantity_manufactured}
              onChange={(e) => handleInputChange('quantity_manufactured', parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
              className={errors.quantity_manufactured ? 'border-red-500' : ''}
            />
            {errors.quantity_manufactured && <p className="text-sm text-red-500">{errors.quantity_manufactured}</p>}
          </div>

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
