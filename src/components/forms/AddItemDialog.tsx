import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useCreateItem } from '@/hooks/useAPI';

interface ItemFormData {
  name: string;
  category: string;
  price: number;
}

const initialFormData: ItemFormData = {
  name: '',
  category: '',
  price: 0,
};

export function AddItemDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ItemFormData>>({});
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  
  const createItem = useCreateItem();

  const handleInputChange = <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ItemFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
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
      const generatedSku = `${formData.name}`
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      const payload = {
        name: formData.name,
        sku: generatedSku,
        description: '',
        category: formData.category.toUpperCase(),
        current_stock: 0,
        price: formData.price,
        cost: 0,
        status: 'In Stock' as const,
      };

      await createItem.mutateAsync(payload as any);
      setFormData(initialFormData);
      setOpen(false);
    } catch (error) {
      console.error('Error creating item:', error);
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
        <Button className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter item name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value.toUpperCase())}
              placeholder="Enter category"
              className={errors.category ? 'border-red-500' : ''}
            />
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={isPriceEditing && formData.price === 0 ? '' : formData.price}
              onFocus={() => setIsPriceEditing(true)}
              onBlur={(e) => {
                setIsPriceEditing(false);
                if (e.currentTarget.value === '') {
                  handleInputChange('price', 0);
                }
              }}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
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
              disabled={createItem.isPending}
            >
              {createItem.isPending ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
