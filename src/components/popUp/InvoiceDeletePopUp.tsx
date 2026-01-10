import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import { useDeleteInvoice } from "@/hooks/useAPI";
  import { toast } from "sonner";
  
  const InvoiceDeletePopUp = ({
    open,
    onOpenChange,
    invoice,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: { id: number; invoice_number: string } | null;
  }) => {
    const { mutate: deleteInvoice, isPending } = useDeleteInvoice();
  
    const handleDelete = () => {
      if (!invoice?.id) return;
  
      deleteInvoice(invoice.id, {
        onSuccess: () => {
          toast.success("Invoice deleted successfully");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to delete invoice");
        },
      });
    };
  
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-bold">
              Delete Invoice
            </AlertDialogTitle>
          </AlertDialogHeader>
  
          <AlertDialogDescription className="text-sm text-muted-foreground text-center">
            Are you sure you want to delete{" "}
            <span className="font-bold">{invoice?.invoice_number}</span>?
          </AlertDialogDescription>
  
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };
  
  export default InvoiceDeletePopUp;
  