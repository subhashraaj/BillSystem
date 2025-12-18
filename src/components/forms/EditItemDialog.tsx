import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateItem } from "@/hooks/useAPI";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface EditItemDialogProps {
    open: boolean;
    item: any | null;
    onOpenChange: (open: boolean) => void;
}

interface ItemFormData {
    name: string;
    gram: number;
    category: string;
    price: number;
    current_stock: number;
}

type ItemFormErrors = Partial<Record<keyof ItemFormData, string>>;

const initialFormData: ItemFormData = {
    name: '',
    gram: 0,
    category: '',
    price: 0,
    current_stock: 0,
};

export function EditItemDialog({ open, item, onOpenChange }: EditItemDialogProps) {
    const initialForm = useMemo<ItemFormData>(() => {
        if (!item) return initialFormData;
    
        return {
            name: item.name ?? "",
            gram: item.gram ?? 0,
            category: item.category ?? "",
            price: item.price ?? 0,
            current_stock: item.current_stock ?? 0,
        };
    }, [item]);

    const [formData, setFormData] = useState<ItemFormData>(initialForm);
    const [errors, setErrors] = useState<ItemFormErrors>({});
    const updateItem = useUpdateItem();
    useEffect(() => {
        setFormData(initialForm);
        setErrors({});
    }, [initialForm, open]);

    const handleInputChange = <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = () => {
        const newErrors: ItemFormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (formData.gram < 0) {
            newErrors.gram = 'Gram required cannot be negative';
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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!item || !validateForm()) {
            return;
        }

        const payload = {
            name: formData.name.trim(),
            gram: formData.gram || 0,
            category: formData.category.toUpperCase(),
            price: formData.price,
            current_stock: formData.current_stock || 0,
        };

        try {
            await updateItem.mutateAsync({
                id: item.id,
                data: payload,
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Item Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter item name"
                            className={errors.name ? 'border-red-500' : ''} />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gram">Gram Required</Label>
                        <Input
                            id="gram"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.gram || ''}
                            onChange={(e) => handleInputChange('gram', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={errors.gram ? 'border-red-500' : ''} />
                        {errors.gram && <p className="text-sm text-red-500">{errors.gram}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => handleInputChange('category', e.target.value.toUpperCase())}
                            placeholder="Enter category"
                            className={errors.category ? 'border-red-500' : ''} />
                        {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price || ''}
                            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={errors.price ? 'border-red-500' : ''} />
                        {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="current_stock">Current Stock (kg)</Label>
                        <Input
                            id="current_stock"
                            type="number"
                            step="1"
                            min="0"
                            value={formData.current_stock || ''}
                            onChange={(e) => handleInputChange('current_stock', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className={errors.current_stock ? 'border-red-500' : ''} />
                        {errors.current_stock && <p className="text-sm text-red-500">{errors.current_stock}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateItem.isPending || !item}>
                            {updateItem.isPending ? 'Updating...' : 'Update Item'}
                        </Button>
                    </div>
                </form>
            </DialogContent>

        </Dialog>


    );
};
