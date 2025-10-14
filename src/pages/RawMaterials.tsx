import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useCreateRawMaterial, useRawMaterials, useUpdateRawMaterialStock } from "@/hooks/useAPI";

export default function RawMaterials() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [normalBoxes, setNormalBoxes] = useState<number>(0);
  const [normalWeight, setNormalWeight] = useState<number>(0);
  const [ringBoxes, setRingBoxes] = useState<number>(0);
  const [ringWeight, setRingWeight] = useState<number>(0);

  const { data: rawMaterialsData, isLoading, error } = useRawMaterials();
  const updateStock = useUpdateRawMaterialStock();
  const createMaterial = useCreateRawMaterial();

  const materials = rawMaterialsData?.data || [];
  const { normalMaterial, ringMaterial } = useMemo(() => {
    const normal = materials.find((m: any) => (m.name || '').toLowerCase() === 'normal papad');
    const ring = materials.find((m: any) => (m.name || '').toLowerCase() === 'ring papad');
    return { normalMaterial: normal, ringMaterial: ring };
  }, [materials]);

  const saveNormal = async () => {
    try {
      if (normalWeight <= 0) {
        toast.error('Enter a valid weight for Normal Papad');
        return;
      }
      if (normalMaterial) {
        await updateStock.mutateAsync({ id: normalMaterial.id, quantity: normalWeight, operation: 'add' });
      } else {
        await createMaterial.mutateAsync({
          name: 'Normal Papad',
          description: '',
          current_stock: normalWeight,
          unit: 'kg',
          min_stock: 0,
          price_per_unit: 0,
          supplier: '',
          status: 'Adequate',
        });
      }
      toast.success("Saved Normal Papad entry", { description: `${date} • Boxes: ${normalBoxes}, Weight: ${normalWeight} kg` });
      setNormalBoxes(0);
      setNormalWeight(0);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save Normal Papad');
    }
  };

  const saveRing = async () => {
    try {
      if (ringWeight <= 0) {
        toast.error('Enter a valid weight for Ring Papad');
        return;
      }
      if (ringMaterial) {
        await updateStock.mutateAsync({ id: ringMaterial.id, quantity: ringWeight, operation: 'add' });
      } else {
        await createMaterial.mutateAsync({
          name: 'Ring Papad',
          description: '',
          current_stock: ringWeight,
          unit: 'kg',
          min_stock: 0,
          price_per_unit: 0,
          supplier: '',
          status: 'Adequate',
        });
      }
      toast.success("Saved Ring Papad entry", { description: `${date} • Boxes: ${ringBoxes}, Weight: ${ringWeight} kg` });
      setRingBoxes(0);
      setRingWeight(0);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save Ring Papad');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Raw Materials</h1>
          <p className="text-muted-foreground">Daily boxes and total weight</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Date</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[180px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading raw materials...</div>
          ) : error ? (
            <div className="text-red-500">Failed to load raw materials</div>
          ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-lg font-semibold">Normal Papad</div>
              <div className="text-sm text-muted-foreground">Current stock: {normalMaterial ? `${normalMaterial.current_stock} kg` : 'not in database yet'}</div>
              <div className="grid grid-cols-3 gap-4 max-w-xl">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Boxes</div>
                  <Input type="number" min="0" value={normalBoxes} onChange={(e) => setNormalBoxes(parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Weight (kg)</div>
                  <Input type="number" step="0.01" min="0" value={normalWeight} onChange={(e) => setNormalWeight(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                </div>
                <div className="flex items-end">
                  <Button onClick={saveNormal} className="w-full">Save</Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-lg font-semibold">Ring Papad</div>
              <div className="text-sm text-muted-foreground">Current stock: {ringMaterial ? `${ringMaterial.current_stock} kg` : 'not in database yet'}</div>
              <div className="grid grid-cols-3 gap-4 max-w-xl">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Boxes</div>
                  <Input type="number" min="0" value={ringBoxes} onChange={(e) => setRingBoxes(parseInt(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Weight (kg)</div>
                  <Input type="number" step="0.01" min="0" value={ringWeight} onChange={(e) => setRingWeight(parseFloat(e.target.value) || 0)} placeholder="0.00" />
                </div>
                <div className="flex items-end">
                  <Button onClick={saveRing} className="w-full">Save</Button>
                </div>
              </div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
