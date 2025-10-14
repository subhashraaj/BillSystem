import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI, itemAPI, rawMaterialAPI, manufacturingAPI, invoiceAPI, paymentAPI } from '../services/api';
import { toast } from 'sonner';

// Customer hooks
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll,
  });
};

export const useCustomer = (id: number) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => customerAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customerAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
};

// Item hooks
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: itemAPI.getAll,
  });
};

export const useItem = (id: number) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: itemAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create item');
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => itemAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item');
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: itemAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item');
    },
  });
};

export const useUpdateItemStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, quantity, operation }: { id: number; quantity: number; operation: 'add' | 'subtract' | 'set' }) => 
      itemAPI.updateStock(id, quantity, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Stock updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stock');
    },
  });
};

// Raw Materials hooks
export const useRawMaterials = () => {
  return useQuery({
    queryKey: ['rawMaterials'],
    queryFn: rawMaterialAPI.getAll,
  });
};

export const useRawMaterial = (id: number) => {
  return useQuery({
    queryKey: ['rawMaterials', id],
    queryFn: () => rawMaterialAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rawMaterialAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Raw material created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create raw material');
    },
  });
};

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => rawMaterialAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Raw material updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update raw material');
    },
  });
};

export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rawMaterialAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Raw material deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete raw material');
    },
  });
};

export const useUpdateRawMaterialStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, quantity, operation }: { id: number; quantity: number; operation: 'add' | 'subtract' | 'set' }) => 
      rawMaterialAPI.updateStock(id, quantity, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] });
      toast.success('Stock updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stock');
    },
  });
};

// Manufacturing hooks
export const useManufacturing = () => {
  return useQuery({
    queryKey: ['manufacturing'],
    queryFn: manufacturingAPI.getAll,
  });
};

export const useManufacturingRecord = (id: number) => {
  return useQuery({
    queryKey: ['manufacturing', id],
    queryFn: () => manufacturingAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreateManufacturingRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: manufacturingAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Manufacturing record created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create manufacturing record');
    },
  });
};

export const useUpdateManufacturingRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => manufacturingAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Manufacturing record updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update manufacturing record');
    },
  });
};

export const useDeleteManufacturingRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: manufacturingAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Manufacturing record deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete manufacturing record');
    },
  });
};

// Invoice hooks
export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceAPI.getAll,
  });
};

export const useInvoice = (id: number) => {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: invoiceAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => invoiceAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice');
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: invoiceAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete invoice');
    },
  });
};

// Payment hooks
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: paymentAPI.getAll,
  });
};

export const usePayment = (id: number) => {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentAPI.getById(id),
    enabled: !!id,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paymentAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment');
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => paymentAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment');
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paymentAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payment');
    },
  });
};
