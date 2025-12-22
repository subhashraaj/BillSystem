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
import { useCreateCustomer } from '@/hooks/useAPI';

interface CustomerFormData {
  name: string;
  mobile_number: string;
  address: string;
  city: string;
  pincode: string,
  state: string;
  country: string;
  gst_number: string;
  balance: string;
  opening_balance: string;
}

type CustomerFormErrors = Partial<Record<keyof CustomerFormData, string>>;

const initialFormData: CustomerFormData = {
  name: '',
  mobile_number: '',
  address: '',
  city: '',
  pincode: '',
  state: '',
  country: '',
  gst_number: '',
  balance: '',
  opening_balance: '',
};

export function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  const createCustomer = useCreateCustomer();

  const handleInputChange = <K extends keyof CustomerFormData>(field: K, value: CustomerFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.mobile_number && formData.mobile_number.length < 10) {
      newErrors.mobile_number = 'Mobile number must be at least 10 characters';
    }
    if (formData.address && formData.address.length < 5) {
      newErrors.address = 'Mobile number must be at least 5 characters';
    }

    if (formData.gst_number && formData.gst_number.length !== 15) {
      newErrors.gst_number = 'GST number must be exactly 15 characters';
    }

    if (formData.balance && parseFloat(formData.balance) < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    if (formData.opening_balance && parseFloat(formData.opening_balance) < 0) {
      newErrors.opening_balance = 'Opening balance cannot be negative';
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
      await createCustomer.mutateAsync(formData);
      setFormData(initialFormData);
      setOpen(false);
    } catch (error) {
      console.error('Error creating customer:', error);
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
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter customer name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            {/* Address */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>
            </div>

            {/* Row 2: Mobile & city */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  placeholder="Enter mobile number"
                  className={errors.mobile_number ? 'border-red-500' : ''}
                />
                {errors.mobile_number && <p className="text-sm text-red-500">{errors.mobile_number}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>

            

            {/* Row 3: Pincode, State, Country */}
            <div className="grid grid-cols-3 gap-4">
              
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Enter pincode"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>

            {/* Row 4: GST Number */}
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={formData.gst_number}
                onChange={(e) => handleInputChange('gst_number', e.target.value)}
                placeholder="Enter 15-digit GST number"
                maxLength={15}
                className={errors.gst_number ? 'border-red-500' : ''}
              />
              {errors.gst_number && <p className="text-sm text-red-500">{errors.gst_number}</p>}
            </div>

            {/* Row 5: Balance and Opening Balance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => handleInputChange('balance', e.target.value)}
                  placeholder="0.00"
                  className={errors.balance ? 'border-red-500' : ''}
                />
                {errors.balance && <p className="text-sm text-red-500">{errors.balance}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Opening Balance</Label><span style={{fontSize: "12px"}}> (One time Entry)</span>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => handleInputChange('opening_balance', e.target.value)}
                  placeholder="0.00"
                  className={errors.opening_balance ? 'border-red-500' : ''}
                />
                {errors.opening_balance && <p className="text-sm text-red-500">{errors.opening_balance}</p>}
              </div>
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
                disabled={createCustomer.isPending}
              >
                {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
}
