import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogPortal, AlertDialogOverlay } from "@radix-ui/react-alert-dialog";
import { AlertDialogFooter, AlertDialogHeader } from "../ui/alert-dialog";
import { useDeleteCustomer } from "@/hooks/useAPI";
import { toast } from "sonner";
const CustomerDeletePopUp = ({ open, onOpenChange, customer }: { open: boolean, onOpenChange: (open: boolean) => void, customer: any | null }) => {
    const deleteCustomer = useDeleteCustomer();
    const handleDelete = () => {
        deleteCustomer.mutate(customer?.id);
        toast.success('Customer deleted successfully');
        onOpenChange(false);
    };
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogPortal>
                <AlertDialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <AlertDialogContent
                    style={{ borderRadius: '0.5rem', border: '1px solid #e0e0e0', padding: '1rem' }}
                    className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-6 shadow-lg">   
                    <AlertDialogHeader style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }} className="text-center">
                        <AlertDialogTitle className="text-2xl font-bold">Delete Customer</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }} className="text-sm text-muted-foreground space-y-2">
                        <p>Are you sure you want to delete <span className="font-bold">{customer?.name}</span>?</p>
                    </AlertDialogDescription>
                    <AlertDialogFooter style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }} className="flex justify-end gap-2">
                        <AlertDialogCancel style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Cancel</AlertDialogCancel>
                        <AlertDialogAction style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }} onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogPortal>
        </AlertDialog>
    );
};

export default CustomerDeletePopUp;