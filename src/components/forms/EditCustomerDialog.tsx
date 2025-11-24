import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateCustomer } from '@/hooks/useAPI';

interface EditCustomerDialogProps {
  open: boolean;
  customer: any | null;
  onOpenChange: (open: boolean) => void;
}

interface CustomerFormData {
  name: string;
  mobile_number: string;
  city: string;
  state: string;
  country: string;
  gst_number: string;
  balance: number;
  opening_balance: number;
}

type CustomerFormErrors = Partial<Record<keyof CustomerFormData, string>>;

const emptyForm: CustomerFormData = {
  name: '',
  mobile_number: '',
  city: '',
  state: '',
  country: '',
  gst_number: '',
  balance: 0,
  opening_balance: 0,
};

export function EditCustomerDialog({ open, customer, onOpenChange }: EditCustomerDialogProps) {
  const initialForm = useMemo(() => {
    if (!customer) {
      return emptyForm;
    }

    return {
      name: customer.name ?? '',
      mobile_number: customer.mobile_number ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      country: customer.country ?? '',
      gst_number: customer.gst_number ?? '',
      balance: typeof customer.balance === 'number' ? customer.balance : Number(customer.balance) || 0,
      opening_balance:
        typeof customer.opening_balance === 'number'
          ? customer.opening_balance
          : Number(customer.opening_balance) || 0,
    };
  }, [customer]);

  const [formData, setFormData] = useState<CustomerFormData>(initialForm);
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const updateCustomer = useUpdateCustomer();

  useEffect(() => {
    setFormData(initialForm);
    setErrors({});
  }, [initialForm, open]);

  const handleInputChange = <K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: CustomerFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.mobile_number && formData.mobile_number.length < 10) {
      newErrors.mobile_number = 'Mobile number must be at least 10 characters';
    }

    if (formData.gst_number && formData.gst_number.length !== 15) {
      newErrors.gst_number = 'GST number must be exactly 15 characters';
    }

    if (formData.balance < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    if (formData.opening_balance < 0) {
      newErrors.opening_balance = 'Opening balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer || !validateForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      mobile_number: formData.mobile_number.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      country: formData.country.trim() || null,
      gst_number: formData.gst_number.trim() || null,
      balance: Number(formData.balance) || 0,
      opening_balance: Number(formData.opening_balance) || 0,
    };

    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        data: payload,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter customer name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input
                id="edit-mobile"
                value={formData.mobile_number}
                onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                placeholder="Enter mobile number"
                className={errors.mobile_number ? 'border-red-500' : ''}
              />
              {errors.mobile_number && <p className="text-sm text-red-500">{errors.mobile_number}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-state">State</Label>
              <Input
                id="edit-state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-gst">GST Number</Label>
            <Input
              id="edit-gst"
              value={formData.gst_number}
              onChange={(e) => handleInputChange('gst_number', e.target.value)}
              placeholder="Enter 15-digit GST number"
              maxLength={15}
              className={errors.gst_number ? 'border-red-500' : ''}
            />
            {errors.gst_number && <p className="text-sm text-red-500">{errors.gst_number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-balance">Balance</Label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                className={errors.balance ? 'border-red-500' : ''}
              />
              {errors.balance && <p className="text-sm text-red-500">{errors.balance}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-opening-balance">Opening Balance</Label>
              <Input
                id="edit-opening-balance"
                type="number"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) =>
                  handleInputChange('opening_balance', parseFloat(e.target.value) || 0)
                }
                className={errors.opening_balance ? 'border-red-500' : ''}
              />
              {errors.opening_balance && (
                <p className="text-sm text-red-500">{errors.opening_balance}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCustomer.isPending || !customer}>
              {updateCustomer.isPending ? 'Updating...' : 'Update Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

